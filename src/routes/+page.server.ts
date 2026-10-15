import type { PageServerLoad } from './$types';
import type { TeamTask, TeamsWithTasks } from '$lib/types';
import { authErrors, getAuthenticatedHeaders } from '$lib/server/authenticated-headers';
import { getLoggkamelConfig } from '$lib/server/loggkamel-config';

export const load: PageServerLoad = async ({ fetch, request }) => {
	const auth = await getAuthenticatedHeaders(request);
	if (!auth.ok) {
		return { teamTasks: [], error: authErrors[auth.reason] };
	}

	try {
		const response = await fetch(`${getLoggkamelConfig().apiUrl}/task/mine`, {
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
