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

const task = {
	naisteam: 'team-a',
	teknologi: 'POSTGRESQL',
	dbname: 'audit-db',
	okonomi: true,
	endringerUtenKrav: false,
	loggingLeseoperasjoner: true,
	fiksa: false,
	created: '2026-01-01',
	updated: '2026-01-01',
	loggingEndringer: true,
	funnetLogger: false,
	discardLogs: false,
	backfill: 'requested'
};

function createLoadEvent(fetch: LoadEvent['fetch'], requestUrl: string): LoadEvent {
	const request = new Request(requestUrl);
	return { fetch, request, url: new URL(requestUrl) } as unknown as LoadEvent;
}

function createActionEvent(
	fetch: ActionEvent['fetch'],
	requestUrl: string,
	fields: Record<string, string>
): ActionEvent {
	const formData = new FormData();
	for (const [name, value] of Object.entries(fields)) {
		formData.set(name, value);
	}
	const request = new Request(requestUrl, { method: 'POST', body: formData });
	return { fetch, request, url: new URL(requestUrl) } as unknown as ActionEvent;
}

function tasksResponse(taskValue = task) {
	return Response.json([{ naisteam: taskValue.naisteam, tasksForTeam: [taskValue] }]);
}

describe('update page load and action', () => {
	const headers = new Headers({ Authorization: '******' });

	beforeEach(() => {
		vi.clearAllMocks();
		getAuthenticatedHeadersMock.mockResolvedValue({ ok: true, headers });
	});

	it('requires both URL parameters without making API calls', async () => {
		const fetch = vi.fn<LoadEvent['fetch']>();

		const result = await load(
			createLoadEvent(fetch, 'https://example.test/update?dbname=audit-db')
		);

		expect(getAuthenticatedHeadersMock).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
		expect(result).toEqual({
			task: null,
			naisteams: [],
			error: 'Velg en database fra landingssiden for å oppdatere den.'
		});
	});

	it('loads the matching task and destination teams', async () => {
		const fetch = vi
			.fn<LoadEvent['fetch']>()
			.mockResolvedValueOnce(tasksResponse())
			.mockResolvedValueOnce(Response.json(['team-a', 'team-b']));

		const result = await load(
			createLoadEvent(fetch, 'https://example.test/update?teknologi=POSTGRESQL&dbname=audit-db')
		);

		expect(fetch).toHaveBeenNthCalledWith(
			1,
			'https://loggkamel.intern.dev.nav.no/api/v1/task/mine',
			{ headers, cache: 'no-store' }
		);
		expect(fetch).toHaveBeenNthCalledWith(
			2,
			'https://loggkamel.intern.dev.nav.no/api/v1/naisteam/mine',
			{ headers, cache: 'no-store' }
		);
		expect(result).toEqual({ task, naisteams: ['team-a', 'team-b'], error: null });
	});

	it('returns an error if no matching task is found', async () => {
		const fetch = vi.fn<LoadEvent['fetch']>().mockResolvedValue(tasksResponse());

		const result = await load(
			createLoadEvent(fetch, 'https://example.test/update?teknologi=DB2&dbname=other-db')
		);

		expect(fetch).toHaveBeenCalledOnce();
		expect(result).toMatchObject({
			task: null,
			error: 'Fant ikke databasen blant oppgavene til naisteamene dine.'
		});
	});

	it.each([
		['false', 'true', 'false'],
		['requested', '', 'requested']
	])(
		'maps the discard checkbox to backfill %s',
		async (currentBackfill, checkbox, expectedBackfill) => {
			const currentTask = { ...task, backfill: currentBackfill };
			const fetch = vi
				.fn<ActionEvent['fetch']>()
				.mockResolvedValueOnce(tasksResponse(currentTask))
				.mockResolvedValueOnce(new Response(null, { status: 200 }));
			const fields = {
				naisteam: 'team-b',
				okonomi: 'true',
				loggingLeseoperasjoner: 'true',
				...(checkbox ? { discardLogs: checkbox } : {})
			};

			const result = await actions.default(
				createActionEvent(
					fetch,
					'https://example.test/update?teknologi=POSTGRESQL&dbname=audit-db',
					fields
				)
			);

			expect(fetch).toHaveBeenNthCalledWith(
				2,
				'https://loggkamel.intern.dev.nav.no/api/v1/task',
				expect.objectContaining({
					method: 'PUT',
					headers,
					cache: 'no-store',
					body: JSON.stringify({
						naisteam: 'team-b',
						teknologi: 'POSTGRESQL',
						dbname: 'audit-db',
						backfill: expectedBackfill,
						okonomi: true,
						endringerUtenKrav: false,
						loggingLeseoperasjoner: true
					})
				})
			);
			expect(result).toEqual({ success: true });
		}
	);

	it('preserves backfill when it is no longer changeable', async () => {
		const completedTask = { ...task, backfill: 'finished' };
		const fetch = vi
			.fn<ActionEvent['fetch']>()
			.mockResolvedValueOnce(tasksResponse(completedTask))
			.mockResolvedValueOnce(new Response(null, { status: 200 }));

		await actions.default(
			createActionEvent(fetch, 'https://example.test/update?teknologi=POSTGRESQL&dbname=audit-db', {
				naisteam: 'team-b',
				discardLogs: 'true'
			})
		);

		const options = fetch.mock.calls[1][1];
		expect(JSON.parse(String(options?.body))).toMatchObject({ backfill: 'finished' });
	});

	it('does not submit if the URL selection is missing', async () => {
		const fetch = vi.fn<ActionEvent['fetch']>();

		const result = await actions.default(
			createActionEvent(fetch, 'https://example.test/update?teknologi=POSTGRESQL', {
				naisteam: 'team-a'
			})
		);

		expect(getAuthenticatedHeadersMock).not.toHaveBeenCalled();
		expect(fetch).not.toHaveBeenCalled();
		expect(result).toMatchObject({ status: 400 });
	});

	it('returns an error when Loggkamel rejects the update', async () => {
		const fetch = vi
			.fn<ActionEvent['fetch']>()
			.mockResolvedValueOnce(tasksResponse())
			.mockResolvedValueOnce(new Response(null, { status: 500 }));

		const result = await actions.default(
			createActionEvent(fetch, 'https://example.test/update?teknologi=POSTGRESQL&dbname=audit-db', {
				naisteam: 'team-a'
			})
		);

		expect(result).toMatchObject({
			status: 502,
			data: { error: 'Kunne ikke oppdatere databasen i Loggkamel. Prøv igjen senere.' }
		});
	});
});
