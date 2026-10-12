import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getAuthenticatedHeadersMock } = vi.hoisted(() => ({
	getAuthenticatedHeadersMock: vi.fn()
}));

vi.mock('$lib/server/authenticated-headers', () => ({
	getAuthenticatedHeaders: getAuthenticatedHeadersMock
}));

import { actions, load } from './+page.server';
import type { Actions, PageServerLoad } from './$types';

type LoadEvent = Parameters<PageServerLoad>[0];
type ActionEvent = Parameters<NonNullable<Actions['default']>>[0];

function createLoadEvent(fetch: LoadEvent['fetch'], request: Request): LoadEvent {
	return { fetch, request } as unknown as LoadEvent;
}

function createActionEvent(fetch: ActionEvent['fetch'], request: Request): ActionEvent {
	return { fetch, request } as unknown as ActionEvent;
}

function createFormRequest(fields: Record<string, string>): Request {
	const formData = new FormData();
	for (const [name, value] of Object.entries(fields)) {
		formData.set(name, value);
	}
	return new Request('https://example.test/register', { method: 'POST', body: formData });
}

describe('registration page load and action', () => {
	const headers = new Headers({ Authorization: 'Bearer obo-token' });

	beforeEach(() => {
		vi.clearAllMocks();
		getAuthenticatedHeadersMock.mockResolvedValue({ ok: true, headers });
	});

	it('loads the naisteams available to the signed-in user', async () => {
		const fetch = vi
			.fn<LoadEvent['fetch']>()
			.mockResolvedValue(Response.json(['team-a', 'team-b']));

		const result = await load(createLoadEvent(fetch, new Request('https://example.test/register')));

		expect(fetch).toHaveBeenCalledWith('https://loggkamel.intern.dev.nav.no/api/v1/naisteam/mine', {
			headers,
			cache: 'no-store'
		});
		expect(result).toEqual({ naisteams: ['team-a', 'team-b'], error: null });
	});

	it('returns an error when loading naisteams fails', async () => {
		const fetch = vi
			.fn<LoadEvent['fetch']>()
			.mockResolvedValue(new Response(null, { status: 500 }));

		const result = await load(createLoadEvent(fetch, new Request('https://example.test/register')));

		expect(result).toEqual({
			naisteams: [],
			error: 'Kunne ikke hente naisteamene dine. Prøv igjen senere.'
		});
	});

	it('creates a task directly with the submitted values', async () => {
		const fetch = vi
			.fn<ActionEvent['fetch']>()
			.mockResolvedValue(new Response(null, { status: 201 }));

		const result = await actions.default(
			createActionEvent(
				fetch,
				createFormRequest({
					naisteam: 'team-a',
					teknologi: 'POSTGRESQL',
					dbname: 'audit-db',
					discardLogs: 'true',
					okonomi: 'true',
					endringerUtenKrav: 'true',
					loggingLeseoperasjoner: 'true'
				})
			)
		);

		expect(fetch).toHaveBeenCalledOnce();
		expect(fetch).toHaveBeenCalledWith(
			'https://loggkamel.intern.dev.nav.no/api/v1/task',
			expect.objectContaining({
				method: 'POST',
				headers,
				cache: 'no-store',
				body: JSON.stringify({
					naisteam: 'team-a',
					teknologi: 'POSTGRESQL',
					dbname: 'audit-db',
					backfill: 'requested',
					okonomi: true,
					endringerUtenKrav: true,
					loggingLeseoperasjoner: true
				})
			})
		);
		expect(result).toEqual({ success: true });
	});

	it('returns an error when Loggkamel rejects task creation', async () => {
		const fetch = vi
			.fn<ActionEvent['fetch']>()
			.mockResolvedValue(new Response(null, { status: 500 }));

		const result = await actions.default(
			createActionEvent(
				fetch,
				createFormRequest({
					naisteam: 'team-a',
					teknologi: 'DB2',
					dbname: 'audit-db'
				})
			)
		);

		expect(fetch).toHaveBeenCalledOnce();
		expect(result).toMatchObject({
			status: 502,
			data: { error: 'Kunne ikke registrere databasen i Loggkamel. Prøv igjen senere.' }
		});
	});

	it('sets backfill to false when the checkbox is unchecked', async () => {
		const fetch = vi
			.fn<ActionEvent['fetch']>()
			.mockResolvedValue(new Response(null, { status: 201 }));

		await actions.default(
			createActionEvent(
				fetch,
				createFormRequest({
					naisteam: 'team-a',
					teknologi: 'DB2',
					dbname: 'audit-db'
				})
			)
		);

		const requestOptions = fetch.mock.calls[0][1];
		expect(JSON.parse(String(requestOptions?.body))).toMatchObject({
			teknologi: 'DB2',
			backfill: 'false'
		});
	});

	it('rejects technologies outside the accepted enums', async () => {
		const fetch = vi.fn<ActionEvent['fetch']>();

		const result = await actions.default(
			createActionEvent(
				fetch,
				createFormRequest({
					naisteam: 'team-a',
					teknologi: 'Oracle',
					dbname: 'audit-db'
				})
			)
		);

		expect(fetch).not.toHaveBeenCalled();
		expect(result).toMatchObject({ status: 400 });
	});
});
