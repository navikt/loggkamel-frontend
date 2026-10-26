import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/authenticated-headers', async (importOriginal) => ({
	...(await importOriginal<typeof import('$lib/server/authenticated-headers')>()),
	getAuthenticatedHeaders: vi.fn()
}));

import { authErrors, getAuthenticatedHeaders } from '$lib/server/authenticated-headers';
import { GET } from './+server';
import type { RequestHandler } from './$types';

type DownloadEvent = Parameters<RequestHandler>[0];
const downloadError = 'Could not download the DB2 cold-storage export. Please try again later.';

function downloadEvent(dbname: string | null = 'audit-db') {
	const url = new URL('https://example.test/backfill/download');
	if (dbname !== null) url.searchParams.set('dbname', dbname);
	const request = new Request(url);
	const fetch = vi.fn<DownloadEvent['fetch']>();
	return { event: { fetch, request, url } as unknown as DownloadEvent, fetch, request };
}

async function expectError(response: Response, status: number, message: string) {
	expect(response.status).toBe(status);
	expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
	expect(response.headers.get('Cache-Control')).toBe('no-store');
	expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
	expect(response.headers.has('Content-Disposition')).toBe(false);
	expect(await response.text()).toBe(message);
}

describe('DB2 cold-storage streaming download', () => {
	let headers: Headers;

	beforeEach(() => {
		vi.clearAllMocks();
		headers = new Headers({
			Authorization: 'Bearer test-only',
			Accept: 'application/json',
			'Content-Type': 'application/json'
		});
		vi.mocked(getAuthenticatedHeaders).mockResolvedValue({ ok: true, headers });
	});

	it.each([null, '', '  ', '../db', 'db/name', 'db\\name', 'db\u0000name', 'db\u007fname'])(
		'rejects database name %j before authentication',
		async (dbname) => {
			const { event, fetch } = downloadEvent(dbname);

			await expectError(await GET(event), 400, 'A valid database name is required.');
			expect(getAuthenticatedHeaders).not.toHaveBeenCalled();
			expect(fetch).not.toHaveBeenCalled();
		}
	);

	it.each([
		['missing-token', 401],
		['invalid-token', 401],
		['obo-token-failed', 502]
	] as const)('rejects %s with HTTP %s without contacting the backend', async (reason, status) => {
		vi.mocked(getAuthenticatedHeaders).mockResolvedValue({ ok: false, reason });
		const { event, fetch, request } = downloadEvent();

		await expectError(await GET(event), status, authErrors[reason]);
		expect(getAuthenticatedHeaders).toHaveBeenCalledExactlyOnceWith(request);
		expect(fetch).not.toHaveBeenCalled();
	});

	it('authenticates the encoded path, forwards cancellation and requests ZIP instead of JSON', async () => {
		const dbname = 'ø audit?#% &';
		const { event, fetch, request } = downloadEvent(dbname);
		fetch.mockResolvedValue(new Response('archive'));

		const response = await GET(event);

		expect(fetch).toHaveBeenCalledExactlyOnceWith(
			`https://loggkamel.intern.dev.nav.no/api/v1/auditlogg-backfills/db2/${encodeURIComponent(dbname)}`,
			{ headers, cache: 'no-store', redirect: 'error', signal: request.signal }
		);
		expect(headers.get('Authorization')).toBe('Bearer test-only');
		expect(headers.get('Accept')).toBe('application/zip');
		expect(headers.has('Content-Type')).toBe(false);
		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toBe('application/zip');
		expect(response.headers.get('Content-Disposition')).toBe(
			`attachment; filename*=UTF-8''${encodeURIComponent(dbname)}-cold-storage.zip`
		);
		expect(response.headers.get('Cache-Control')).toBe('no-store');
		expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
		expect(await response.text()).toBe('archive');
	});

	it('cancels the upstream stream when the download consumer cancels', async () => {
		const cancel = vi.fn();
		const body = new ReadableStream<Uint8Array>({ cancel });
		const { event, fetch } = downloadEvent();
		fetch.mockResolvedValue(new Response(body));

		const response = await GET(event);
		await response.body!.cancel('download abandoned');

		expect(cancel).toHaveBeenCalledExactlyOnceWith('download abandoned');
	});

	it('propagates stream failures to the download consumer', async () => {
		let controller!: ReadableStreamDefaultController<Uint8Array>;
		const body = new ReadableStream<Uint8Array>({
			start(streamController) {
				controller = streamController;
			}
		});
		const { event, fetch } = downloadEvent();
		fetch.mockResolvedValue(new Response(body));
		const response = await GET(event);
		const error = new Error('upstream disconnected');
		controller.error(error);

		await expect(response.body!.getReader().read()).rejects.toBe(error);
	});

	it.each([
		[
			400,
			400,
			'The task is not in a state that allows this action. Refresh the page and try again.'
		],
		[401, 401, 'You must be logged in to manage backfill and cold-storage requests.'],
		[403, 403, 'You do not have permission to manage backfill and cold-storage requests.'],
		[404, 404, 'The requested task was not found. Refresh the page and try again.'],
		[
			409,
			409,
			'The task is not in a state that allows this action. Refresh the page and try again.'
		],
		[302, 502, downloadError],
		[422, 422, downloadError],
		[429, 429, downloadError],
		[500, 502, downloadError],
		[503, 502, downloadError]
	] as const)(
		'cancels rejected HTTP %s response bodies and returns HTTP %s safely',
		async (upstreamStatus, status, error) => {
			const cancel = vi.fn();
			const upstream = new Response(
				new ReadableStream({
					start(controller) {
						controller.enqueue(new TextEncoder().encode('private upstream details'));
					},
					cancel
				}),
				{ status: upstreamStatus }
			);
			const { event, fetch } = downloadEvent();
			fetch.mockResolvedValue(upstream);

			await expectError(await GET(event), status, error);
			expect(cancel).toHaveBeenCalledOnce();
		}
	);

	it.each([204, 403, 500])('handles a response without a body for HTTP %s', async (status) => {
		const { event, fetch } = downloadEvent();
		fetch.mockResolvedValue(new Response(null, { status }));

		await expectError(
			await GET(event),
			status === 403 ? 403 : 502,
			status === 403
				? 'You do not have permission to manage backfill and cold-storage requests.'
				: downloadError
		);
	});

	it('returns a safe gateway error when fetching fails', async () => {
		const { event, fetch } = downloadEvent();
		fetch.mockRejectedValue(new TypeError('private network details'));

		await expectError(await GET(event), 502, downloadError);
	});

	it.each([new Error('unexpected error'), new DOMException('aborted', 'AbortError')])(
		'does not swallow unexpected errors or request cancellation',
		async (error) => {
			const { event, fetch } = downloadEvent();
			fetch.mockRejectedValue(error);

			await expect(GET(event)).rejects.toBe(error);
		}
	);
});
