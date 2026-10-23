import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { TeamsWithTasks } from '$lib/types';
import { authErrors, getAuthenticatedHeaders } from '$lib/server/authenticated-headers';
import { backfillError, isValidDatabaseName } from '$lib/server/backfill';
import { getLoggkamelConfig } from '$lib/server/loggkamel-config';

const LOAD_ERROR = 'Could not load backfill and cold-storage requests. Please try again later.';
const COMPLETE_ERROR = 'Could not mark the task as completed. Please try again later.';

export const load: PageServerLoad = async ({ fetch, request, setHeaders }) => {
	setHeaders({ 'Cache-Control': 'no-store' });
	const teamsWithTasks: TeamsWithTasks[] = [];
	const auth = await getAuthenticatedHeaders(request);
	if (!auth.ok) {
		return { teamsWithTasks, error: authErrors[auth.reason] };
	}

	try {
		const response = await fetch(`${getLoggkamelConfig().apiUrl}/auditlogg-backfills/requested`, {
			headers: auth.headers,
			cache: 'no-store',
			redirect: 'error'
		});
		if (!response.ok) {
			return { teamsWithTasks, error: backfillError(response.status, LOAD_ERROR) };
		}

		const requestedTeams: TeamsWithTasks[] = await response.json();
		return { teamsWithTasks: requestedTeams, error: null };
	} catch (error) {
		if (error instanceof TypeError || error instanceof SyntaxError) {
			return { teamsWithTasks, error: LOAD_ERROR };
		}
		throw error;
	}
};

export const actions: Actions = {
	complete: async ({ fetch, request }) => {
		const formData = await request.formData();
		const teknologi = formData.get('teknologi');
		const dbname = formData.get('dbname');
		if ((teknologi !== 'POSTGRESQL' && teknologi !== 'DB2') || !isValidDatabaseName(dbname)) {
			return fail(400, { error: 'A valid technology and database name are required.' });
		}

		const auth = await getAuthenticatedHeaders(request);
		if (!auth.ok) {
			return fail(auth.reason === 'obo-token-failed' ? 502 : 401, {
				error: authErrors[auth.reason]
			});
		}

		try {
			const response = await fetch(
				`${getLoggkamelConfig().apiUrl}/auditlogg-backfills/${teknologi}/${encodeURIComponent(dbname)}/complete`,
				{
					method: 'POST',
					headers: auth.headers,
					cache: 'no-store',
					redirect: 'error'
				}
			);
			if (!response.ok) {
				return fail(response.status >= 400 && response.status < 500 ? response.status : 502, {
					error: backfillError(response.status, COMPLETE_ERROR)
				});
			}
		} catch (error) {
			if (error instanceof TypeError) {
				return fail(502, { error: COMPLETE_ERROR });
			}
			throw error;
		}

		return { success: `${dbname} was marked as completed.` };
	}
};
