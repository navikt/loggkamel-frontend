import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getAuthenticatedHeadersMock } = vi.hoisted(() => ({
	getAuthenticatedHeadersMock: vi.fn()
}));

vi.mock('$lib/server/authenticated-headers', () => ({
	getAuthenticatedHeaders: getAuthenticatedHeadersMock
}));

import { load } from './+page.server';

type LoadEvent = Parameters<typeof load>[0];

function createLoadEvent(fetch: LoadEvent['fetch'], request: Request): LoadEvent {
	return { fetch, request } as unknown as LoadEvent;
}

describe('landing page load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it.each([
		['missing-token', 'Du må være logget inn for å se registrerte databaser.'],
		['invalid-token', 'Innloggingen din er ikke gyldig. Logg inn på nytt.'],
		['obo-token-failed', 'Kunne ikke hente et tilgangstoken for Loggkamel. Prøv igjen senere.']
	] as const)('returns the appropriate error for %s', async (reason, error) => {
		const request = new Request('https://example.test');
		const fetch = vi.fn<LoadEvent['fetch']>();
		getAuthenticatedHeadersMock.mockResolvedValue({ ok: false, reason });

		const result = await load(createLoadEvent(fetch, request));

		expect(getAuthenticatedHeadersMock).toHaveBeenCalledWith(request);
		expect(fetch).not.toHaveBeenCalled();
		expect(result).toEqual({ teamTasks: [], error });
	});

	it('uses the authenticated headers and returns tasks from all teams', async () => {
		const request = new Request('https://example.test');
		const headers = new Headers({
			Authorization: 'Bearer obo-token',
			Accept: 'application/json',
			'Content-Type': 'application/json'
		});
		const teamTasks = [
			{
				naisteam: 'team-a',
				teknologi: 'PostgreSQL',
				dbname: 'database-a',
				okonomi: true,
				endringerUtenKrav: false,
				loggingLeseoperasjoner: false,
				fiksa: false,
				created: '2026-01-01',
				updated: '2026-01-01',
				loggingEndringer: true,
				funnetLogger: false,
				discardLogs: false
			}
		];
		const fetch = vi.fn<LoadEvent['fetch']>().mockResolvedValue(
			new Response(
				JSON.stringify([
					{ naisteam: 'team-a', tasksForTeam: teamTasks },
					{ naisteam: 'team-b', tasksForTeam: [] }
				]),
				{ status: 200 }
			)
		);
		getAuthenticatedHeadersMock.mockResolvedValue({ ok: true, headers });

		const result = await load(createLoadEvent(fetch, request));

		expect(getAuthenticatedHeadersMock).toHaveBeenCalledWith(request);
		expect(fetch).toHaveBeenCalledWith('https://loggkamel.intern.dev.nav.no/api/v1/task/mine', {
			headers,
			cache: 'no-store'
		});
		expect(result).toEqual({ teamTasks, error: null });
	});

	it('returns an error when the Loggkamel request is not successful', async () => {
		const fetch = vi
			.fn<LoadEvent['fetch']>()
			.mockResolvedValue(new Response(null, { status: 500 }));
		getAuthenticatedHeadersMock.mockResolvedValue({
			ok: true,
			headers: new Headers()
		});

		const result = await load(createLoadEvent(fetch, new Request('https://example.test')));

		expect(result).toEqual({
			teamTasks: [],
			error: 'Kunne ikke hente oppgavene dine fra Loggkamel. Prøv igjen senere.'
		});
	});
});
