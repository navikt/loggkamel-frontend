import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getAuthenticatedHeadersMock } = vi.hoisted(() => ({
	getAuthenticatedHeadersMock: vi.fn()
}));

vi.mock('$lib/server/authenticated-headers', () => ({
	authErrors: {
		'missing-token': 'Authentication error',
		'invalid-token': 'Authentication error',
		'obo-token-failed': 'Authentication error'
	},
	getAuthenticatedHeaders: getAuthenticatedHeadersMock
}));

import { actions, load } from './+page.server';
import type { Actions, PageServerLoad } from './$types';

type LoadEvent = Parameters<PageServerLoad>[0];
type ActionEvent = Parameters<NonNullable<Actions['rerun']>>[0];

function createLoadEvent(fetch: LoadEvent['fetch'], request: Request): LoadEvent {
	return { fetch, request } as unknown as LoadEvent;
}

function createActionEvent(fetch: ActionEvent['fetch'], id: string): ActionEvent {
	const formData = new FormData();
	formData.set('id', id);
	const request = new Request('https://example.test/rerun', {
		method: 'POST',
		body: formData
	});
	return { fetch, request } as unknown as ActionEvent;
}

describe('rerun page load and actions', () => {
	const headers = new Headers({ Authorization: 'Bearer test-token' });

	beforeEach(() => {
		vi.clearAllMocks();
		getAuthenticatedHeadersMock.mockResolvedValue({ ok: true, headers });
	});

	it('loads unresolved pulls using authenticated headers', async () => {
		const rerunPulls = [
			{
				id: 42,
				dbname: 'audit-db',
				teknologi: 'DB2',
				pullStartDate: '2026-09-12',
				pullEndDate: '2026-09-13',
				failureReason: 'Pull failed',
				resolved: false,
				created: '2026-09-13T06:00:04.750377Z',
				updated: '2026-09-13T06:00:04.750377Z'
			}
		];
		const fetch = vi.fn<LoadEvent['fetch']>().mockResolvedValue(Response.json(rerunPulls));

		const result = await load(createLoadEvent(fetch, new Request('https://example.test/rerun')));

		expect(fetch).toHaveBeenCalledWith(
			'https://loggkamel.intern.dev.nav.no/api/v1/pull/rerun-required',
			{ headers, cache: 'no-store' }
		);
		expect(result).toEqual({ rerunPulls, error: null });
	});

	it('returns an authentication error without calling Loggkamel', async () => {
		getAuthenticatedHeadersMock.mockResolvedValue({
			ok: false,
			reason: 'missing-token'
		});
		const fetch = vi.fn<LoadEvent['fetch']>();

		const result = await load(createLoadEvent(fetch, new Request('https://example.test/rerun')));

		expect(fetch).not.toHaveBeenCalled();
		expect(result).toEqual({ rerunPulls: [], error: 'Authentication error' });
	});

	it.each([
		['rerun', 'rerun'],
		['resolve', 'resolve']
	] as const)('sends the %s request to Loggkamel', async (action, endpoint) => {
		const fetch = vi
			.fn<ActionEvent['fetch']>()
			.mockResolvedValue(new Response(null, { status: 204 }));

		const result = await actions[action](createActionEvent(fetch, '42'));

		expect(fetch).toHaveBeenCalledOnce();
		expect(fetch).toHaveBeenCalledWith(
			`https://loggkamel.intern.dev.nav.no/api/v1/pull/${endpoint}/42`,
			{ method: 'POST', headers, cache: 'no-store' }
		);
		expect(result).toEqual({ success: action });
	});

	it.each([
		[401, 'Du må være logget inn for å gjøre denne endringen.'],
		[403, 'Du har ikke tilgang til å gjøre denne endringen.']
	])('shows an authorization message when Loggkamel returns %s', async (status, error) => {
		const fetch = vi.fn<ActionEvent['fetch']>().mockResolvedValue(new Response(null, { status }));

		const result = await actions.rerun(createActionEvent(fetch, '42'));

		expect(result).toMatchObject({ status, data: { error } });
	});

	it('shows a generic error when Loggkamel rejects an action', async () => {
		const fetch = vi
			.fn<ActionEvent['fetch']>()
			.mockResolvedValue(new Response(null, { status: 500 }));

		const result = await actions.resolve(createActionEvent(fetch, '42'));

		expect(result).toMatchObject({
			status: 502,
			data: { error: 'Kunne ikke endre loggpullen. Prøv igjen senere.' }
		});
	});

	it('does not call Loggkamel when the pull id is invalid', async () => {
		const fetch = vi.fn<ActionEvent['fetch']>();

		const result = await actions.rerun(createActionEvent(fetch, '42/not-an-id'));

		expect(getAuthenticatedHeadersMock).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
		expect(result).toMatchObject({
			status: 400,
			data: { error: 'Kunne ikke endre loggpullen. Prøv igjen senere.' }
		});
	});
});
