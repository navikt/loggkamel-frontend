import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAuthenticatedHeaders } from '$lib/server/authenticated-headers';

const LOGGKAMEL_API_URL = 'https://loggkamel.intern.dev.nav.no/api/v1';

const authErrors = {
	'missing-token': 'Du må være logget inn for å registrere en database.',
	'invalid-token': 'Innloggingen din er ikke gyldig. Logg inn på nytt.',
	'obo-token-failed': 'Kunne ikke hente et tilgangstoken for Loggkamel. Prøv igjen senere.'
} as const;

type TeamsResult = { ok: true; teams: string[] } | { ok: false; error: string };

async function getMyTeams(fetch: typeof globalThis.fetch, headers: Headers): Promise<TeamsResult> {
	let response: Response;
	try {
		response = await fetch(`${LOGGKAMEL_API_URL}/naisteam/mine`, {
			headers,
			cache: 'no-store'
		});
	} catch (error) {
		if (error instanceof TypeError) {
			return { ok: false, error: 'Kunne ikke koble til Loggkamel. Prøv igjen senere.' };
		}
		throw error;
	}

	if (!response.ok) {
		return { ok: false, error: 'Kunne ikke hente naisteamene dine. Prøv igjen senere.' };
	}

	let teams: unknown;
	try {
		teams = await response.json();
	} catch (error) {
		if (error instanceof SyntaxError) {
			return {
				ok: false,
				error: 'Loggkamel returnerte data vi ikke kunne lese. Prøv igjen senere.'
			};
		}
		throw error;
	}

	if (!Array.isArray(teams) || !teams.every((team): team is string => typeof team === 'string')) {
		return { ok: false, error: 'Loggkamel returnerte data vi ikke kunne lese. Prøv igjen senere.' };
	}

	return { ok: true, teams };
}

function formString(formData: FormData, name: string): string | null {
	const value = formData.get(name);
	return typeof value === 'string' ? value.trim() : null;
}

export const load: PageServerLoad = async ({ fetch, request }) => {
	const auth = await getAuthenticatedHeaders(request);
	if (!auth.ok) {
		return { naisteams: [], error: authErrors[auth.reason] };
	}

	const result = await getMyTeams(fetch, auth.headers);
	if (!result.ok) {
		return { naisteams: [], error: result.error };
	}

	return { naisteams: result.teams, error: null };
};

export const actions: Actions = {
	default: async ({ fetch, request }) => {
		const auth = await getAuthenticatedHeaders(request);
		if (!auth.ok) {
			return fail(auth.reason === 'obo-token-failed' ? 502 : 401, {
				error: authErrors[auth.reason]
			});
		}

		const formData = await request.formData();
		const naisteam = formString(formData, 'naisteam');
		const teknologi = formString(formData, 'teknologi');
		const dbname = formString(formData, 'dbname');

		if (!naisteam || !dbname || (teknologi !== 'POSTGRESQL' && teknologi !== 'DB2')) {
			return fail(400, { error: 'Velg naisteam og databaseteknologi, og oppgi databasenavn.' });
		}

		const payload = {
			naisteam,
			teknologi,
			dbname,
			backfill: formData.has('discardLogs') ? 'false' : 'requested',
			okonomi: formData.has('okonomi'),
			endringerUtenKrav: formData.has('endringerUtenKrav'),
			loggingLeseoperasjoner: formData.has('loggingLeseoperasjoner')
		};

		try {
			const response = await fetch(`${LOGGKAMEL_API_URL}/task`, {
				method: 'POST',
				headers: auth.headers,
				body: JSON.stringify(payload),
				cache: 'no-store'
			});

			if (!response.ok) {
				return fail(502, {
					error: 'Kunne ikke registrere databasen i Loggkamel. Prøv igjen senere.'
				});
			}
		} catch (error) {
			if (error instanceof TypeError) {
				return fail(502, { error: 'Kunne ikke koble til Loggkamel. Prøv igjen senere.' });
			}
			throw error;
		}

		return { success: true };
	}
};
