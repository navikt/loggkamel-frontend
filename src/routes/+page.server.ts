import type { PageServerLoad } from './$types';
import type { TeamTask, TeamsWithTasks } from '$lib/types';
import { getAuthenticatedHeaders } from '$lib/server/authenticated-headers';

const LOGGKAMEL_API_URL = 'https://loggkamel.intern.dev.nav.no/api/v1';

export const load: PageServerLoad = async ({ fetch, request }) => {
	const auth = await getAuthenticatedHeaders(request);
	if (!auth.ok) {
		const errors = {
			'missing-token': 'Du må være logget inn for å se registrerte databaser.',
			'invalid-token': 'Innloggingen din er ikke gyldig. Logg inn på nytt.',
			'obo-token-failed': 'Kunne ikke hente et tilgangstoken for Loggkamel. Prøv igjen senere.'
		};
		return { teamTasks: [], error: errors[auth.reason] };
	}

	try {
		const response = await fetch(`${LOGGKAMEL_API_URL}/task/mine`, {
			headers: auth.headers,
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
