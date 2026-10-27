import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/authenticated-headers', async (importOriginal) => ({
	...(await importOriginal<typeof import('$lib/server/authenticated-headers')>()),
	getAuthenticatedHeaders: vi.fn()
}));

import { authErrors, getAuthenticatedHeaders } from '$lib/server/authenticated-headers';
import { actions, load } from './+page.server';
import type { Actions, PageServerLoad } from './$types';

type LoadEvent = Parameters<PageServerLoad>[0];
type ActionEvent = Parameters<NonNullable<Actions['complete']>>[0];
const apiUrl = 'https://loggkamel.intern.dev.nav.no/api/v1';
const loadError = 'Could not load backfill and cold-storage requests. Please try again later.';
const completeError = 'Could not mark the task as completed. Please try again later.';
const invalidFieldsError = 'A valid technology and database name are required.';
const statusErrors = [
	[400, 'The task is not in a state that allows this action. Refresh the page and try again.'],
	[401, 'You must be logged in to manage backfill and cold-storage requests.'],
	[403, 'You do not have permission to manage backfill and cold-storage requests.'],
	[404, 'The requested task was not found. Refresh the page and try again.'],
	[409, 'The task is not in a state that allows this action. Refresh the page and try again.']
] as const;

function loadEvent(fetch = vi.fn<LoadEvent['fetch']>()) {
	const setHeaders = vi.fn<LoadEvent['setHeaders']>();
	const request = new Request('https://example.test/backfill');
	const event = { fetch, request, setHeaders } as unknown as LoadEvent;
	return { event, fetch, request, setHeaders };
}

function actionEvent(
	fetch = vi.fn<ActionEvent['fetch']>(),
	fields: Record<string, FormDataEntryValue> = { teknologi: 'POSTGRESQL', dbname: 'audit-db' }
) {
	const formData = new FormData();
	for (const [key, value] of Object.entries(fields)) formData.set(key, value);
	const request = new Request('https://example.test/backfill?/complete', {
		method: 'POST',
		body: formData
	});
	return { event: { fetch, request } as unknown as ActionEvent, fetch, request };
}

describe('backfill loader', () => {
	let headers: Headers;

	beforeEach(() => {
		vi.clearAllMocks();
		headers = new Headers({ Authorization: 'Bearer test-only' });
		vi.mocked(getAuthenticatedHeaders).mockResolvedValue({ ok: true, headers });
	});

	it.each([
		{ teamsWithTasks: [] },
		{
			teamsWithTasks: [
				{ naisteam: 'team-a', tasksForTeam: [{ teknologi: 'DB2', dbname: 'audit-db' }] }
			]
		}
	])('returns backend teams unchanged and prevents caching: %j', async ({ teamsWithTasks }) => {
		const { event, fetch, request, setHeaders } = loadEvent();
		fetch.mockResolvedValue(Response.json(teamsWithTasks));

		expect(await load(event)).toEqual({ teamsWithTasks, error: null });
		expect(setHeaders).toHaveBeenCalledExactlyOnceWith({ 'Cache-Control': 'no-store' });
		expect(getAuthenticatedHeaders).toHaveBeenCalledExactlyOnceWith(request);
		expect(fetch).toHaveBeenCalledExactlyOnceWith(`${apiUrl}/auditlogg-backfills/requested`, {
			headers,
			cache: 'no-store',
			redirect: 'error'
		});
	});

	it.each([new TypeError('network failure'), new SyntaxError('invalid JSON')])(
		'handles expected transport or parsing failures',
		async (error) => {
			const { event, fetch } = loadEvent();
			fetch.mockRejectedValue(error);

			expect(await load(event)).toEqual({ teamsWithTasks: [], error: loadError });
		}
	);

	it('does not hide unexpected failures', async () => {
		const error = new Error('unexpected failure');
		const { event, fetch } = loadEvent();
		fetch.mockRejectedValue(error);

		await expect(load(event)).rejects.toBe(error);
	});
});

describe('backfill completion action', () => {
	let headers: Headers;

	beforeEach(() => {
		vi.clearAllMocks();
		headers = new Headers({ Authorization: 'Bearer test-only' });
		vi.mocked(getAuthenticatedHeaders).mockResolvedValue({ ok: true, headers });
	});

	it.each([
		['missing-token', 401],
		['invalid-token', 401],
		['obo-token-failed', 502]
	] as const)('returns %s with status %s', async (reason, status) => {
		vi.mocked(getAuthenticatedHeaders).mockResolvedValue({ ok: false, reason });
		const { event, fetch, request } = actionEvent();

		expect(await actions.complete(event)).toMatchObject({
			status,
			data: { error: authErrors[reason] }
		});
		expect(getAuthenticatedHeaders).toHaveBeenCalledExactlyOnceWith(request);
		expect(fetch).not.toHaveBeenCalled();
	});

	it.each([
		['POSTGRESQL', 200],
		['DB2', 201],
		['POSTGRESQL', 202],
		['DB2', 204],
		['POSTGRESQL', 299]
	] as const)(
		'completes %s tasks for HTTP %s without requiring JSON',
		async (teknologi, status) => {
			const dbname = 'ø audit?#% &';
			const response = new Response(null, { status });
			const json = vi.spyOn(response, 'json');
			const { event, fetch } = actionEvent(undefined, { teknologi, dbname });
			fetch.mockResolvedValue(response);

			expect(await actions.complete(event)).toEqual({
				success: `${dbname} was marked as completed.`
			});
			expect(fetch).toHaveBeenCalledExactlyOnceWith(
				`${apiUrl}/auditlogg-backfills/${teknologi}/${encodeURIComponent(dbname)}/complete`,
				{ method: 'POST', headers, cache: 'no-store', redirect: 'error' }
			);
			expect(json).not.toHaveBeenCalled();
		}
	);

	it('does not hide unexpected failures', async () => {
		const error = new Error('unexpected failure');
		const { event, fetch } = actionEvent();
		fetch.mockRejectedValue(error);

		await expect(actions.complete(event)).rejects.toBe(error);
	});
});
