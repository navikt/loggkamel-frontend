import type { PageServerLoad } from './$types';
import type { TeamTask } from '$lib/types';
import { getToken, requestOboToken } from '@navikt/oasis';

const LOGGKAMEL_API_URL = 'https://loggkamel.intern.dev.nav.no/api/v1/naisteam';
const LOGGKAMEL_OBO_SCOPE_PLACEHOLDER = 'api://loggkamel/.default';

export const load: PageServerLoad = async ({ fetch, request }) => {
	const token = getToken(request);
	if (!token) {
		return { teamTasks: [], error: 'Du må være logget inn for å se registrerte databaser.' };
	}

	const oboResult = await requestOboToken(token, LOGGKAMEL_OBO_SCOPE_PLACEHOLDER);
	if (!oboResult.ok) {
		return {
			teamTasks: [],
			error: 'Kunne ikke hente et tilgangstoken for Loggkamel. Prøv igjen senere.'
		};
	}

	try {
		const headers = { Authorization: `Bearer ${oboResult.token}` };
		const teamsResponse = await fetch(`${LOGGKAMEL_API_URL}/mine`, {
			headers,
			cache: 'no-store'
		});

		if (!teamsResponse.ok) {
			return {
				teamTasks: [],
				error: 'Kunne ikke hente naisteamene dine fra Loggkamel. Prøv igjen senere.'
			};
		}

		const teams: unknown = await teamsResponse.json();
		if (!Array.isArray(teams) || !teams.every((team): team is string => typeof team === 'string')) {
			return {
				teamTasks: [],
				error: 'Loggkamel returnerte en ugyldig liste over naisteam.'
			};
		}

		const taskResponses = await Promise.all(
			teams.map((team) =>
				fetch(`${LOGGKAMEL_API_URL}/auditlogg/${encodeURIComponent(team)}`, {
					headers,
					cache: 'no-store'
				})
			)
		);

		if (taskResponses.some((response) => !response.ok)) {
			return {
				teamTasks: [],
				error: 'Kunne ikke hente alle oppgavene fra Loggkamel. Prøv igjen senere.'
			};
		}

		const taskLists: TeamTask[][] = await Promise.all(
			taskResponses.map((response) => response.json())
		);
		return { teamTasks: taskLists.flat(), error: null };
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
