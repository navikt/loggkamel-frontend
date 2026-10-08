import type { PageServerLoad } from './$types';
import type { TeamTask, TeamsWithTasks } from '$lib/types';
import { getToken, requestOboToken, validateToken } from '@navikt/oasis';

const LOGGKAMEL_API_URL = 'https://loggkamel.intern.dev.nav.no/api/v1';
const LOGGKAMEL_OBO_AUDIENCE = 'api://dev-gcp.sikkerhetstjenesten.loggkamel/.default';

export const load: PageServerLoad = async ({ fetch, request }) => {
	const token = getToken(request);
	if (!token) {
		return { teamTasks: [], error: 'Du må være logget inn for å se registrerte databaser.' };
	}

	const validation = await validateToken(token);
	if (!validation.ok) {
		return { teamTasks: [], error: 'Innloggingen din er ikke gyldig. Logg inn på nytt.' };
	}

	const oboResult = await requestOboToken(token, LOGGKAMEL_OBO_AUDIENCE);
	if (!oboResult.ok) {
		return {
			teamTasks: [],
			error: 'Kunne ikke hente et tilgangstoken for Loggkamel. Prøv igjen senere.'
		};
	}

	try {
		const headers = { Authorization: `Bearer ${oboResult.token}` };
		const response = await fetch(`${LOGGKAMEL_API_URL}/task/mine`, {
			headers,
			cache: 'no-store'
		});

		if (!response.ok) {
			return {
				teamTasks: [],
				error: 'Kunne ikke hente oppgavene dine fra Loggkamel. Prøv igjen senere.'
			};
		}

		const teamsWithTasks: TeamsWithTasks[] = await response.json();
		const teamTasks: TeamTask[] = teamsWithTasks.flatMap((team) => team.tasksForTeam);
		return { teamTasks, error: null };
	} catch (error) {
		if (error instanceof TypeError) {
			return {
				teamTasks: [],
				error: 'Kunne ikke koble til Loggkamel. Prøv igjen senere.'
			};
		}
		if (error instanceof SyntaxError) {
			return {
				teamTasks: [],
				error: 'Loggkamel returnerte data vi ikke kunne lese. Prøv igjen senere.'
			};
		}
		throw error;
	}
};
