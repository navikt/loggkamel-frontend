import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { TeamTask, TeamsWithTasks } from '$lib/types';
import { authErrors, getAuthenticatedHeaders } from '$lib/server/authenticated-headers';
import { getLoggkamelConfig } from '$lib/server/loggkamel-config';

type UpdateTask = TeamTask & { backfill: string };
type TasksResult = { ok: true; tasks: UpdateTask[] } | { ok: false; error: string };
type TeamsResult = { ok: true; teams: string[] } | { ok: false; error: string };

function getTaskSelection(url: URL): { teknologi: string; dbname: string } | null {
	const teknologi = url.searchParams.get('teknologi');
	const dbname = url.searchParams.get('dbname');
	return teknologi && dbname ? { teknologi, dbname } : null;
}

async function getMyTasks(fetch: typeof globalThis.fetch, headers: Headers): Promise<TasksResult> {
	let response: Response;
	try {
		response = await fetch(`${getLoggkamelConfig().apiUrl}/task/mine`, {
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
		return {
			ok: false,
			error: 'Kunne ikke hente oppgavene dine fra Loggkamel. Prøv igjen senere.'
		};
	}

	try {
		const teamsWithTasks: (Omit<TeamsWithTasks, 'tasksForTeam'> & {
			tasksForTeam: UpdateTask[];
		})[] = await response.json();
		return { ok: true, tasks: teamsWithTasks.flatMap((team) => team.tasksForTeam) };
	} catch (error) {
		if (error instanceof SyntaxError) {
			return {
				ok: false,
				error: 'Loggkamel returnerte data vi ikke kunne lese. Prøv igjen senere.'
			};
		}
		throw error;
	}
}

async function getMyTeams(fetch: typeof globalThis.fetch, headers: Headers): Promise<TeamsResult> {
	let response: Response;
	try {
		response = await fetch(`${getLoggkamelConfig().apiUrl}/naisteam/mine`, {
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

	try {
		const teams: unknown = await response.json();
		if (!Array.isArray(teams) || !teams.every((team): team is string => typeof team === 'string')) {
			return {
				ok: false,
				error: 'Loggkamel returnerte data vi ikke kunne lese. Prøv igjen senere.'
			};
		}
		return { ok: true, teams };
	} catch (error) {
		if (error instanceof SyntaxError) {
			return {
				ok: false,
				error: 'Loggkamel returnerte data vi ikke kunne lese. Prøv igjen senere.'
			};
		}
		throw error;
	}
}

function findTask(tasks: UpdateTask[], teknologi: string, dbname: string): UpdateTask | undefined {
	return tasks.find((task) => task.teknologi === teknologi && task.dbname === dbname);
}

function formString(formData: FormData, name: string): string | null {
	const value = formData.get(name);
	return typeof value === 'string' ? value.trim() : null;
}

export const load: PageServerLoad = async ({ fetch, request, url }) => {
	const selection = getTaskSelection(url);
	if (!selection) {
		return {
			task: null,
			naisteams: [],
			error: 'Velg en database fra landingssiden for å oppdatere den.'
		};
	}

	const auth = await getAuthenticatedHeaders(request);
	if (!auth.ok) {
		return { task: null, naisteams: [], error: authErrors[auth.reason] };
	}

	const tasksResult = await getMyTasks(fetch, auth.headers);
	if (!tasksResult.ok) {
		return { task: null, naisteams: [], error: tasksResult.error };
	}

	const task = findTask(tasksResult.tasks, selection.teknologi, selection.dbname);
	if (!task) {
		return {
			task: null,
			naisteams: [],
			error: 'Fant ikke databasen blant oppgavene til naisteamene dine.'
		};
	}

	const teamsResult = await getMyTeams(fetch, auth.headers);
	if (!teamsResult.ok) {
		return { task: null, naisteams: [], error: teamsResult.error };
	}

	return { task, naisteams: teamsResult.teams, error: null };
};

export const actions: Actions = {
	default: async ({ fetch, request, url }) => {
		const selection = getTaskSelection(url);
		if (!selection) {
			return fail(400, { error: 'Velg en database fra landingssiden for å oppdatere den.' });
		}

		const auth = await getAuthenticatedHeaders(request);
		if (!auth.ok) {
			return fail(auth.reason === 'obo-token-failed' ? 502 : 401, {
				error: authErrors[auth.reason]
			});
		}

		const formData = await request.formData();
		const naisteam = formString(formData, 'naisteam');
		if (!naisteam) {
			return fail(400, { error: 'Velg naisteam som skal få loggene.' });
		}

		if (
			(formData.has('okonomi') || formData.has('arkivforskrift')) &&
			formData.has('endringerUtenKrav')
		) {
			return fail(400, {
				error:
					'Endringslogger uten lovkrav kan ikke velges sammen med økonomi eller arkivforskrift.'
			});
		}

		const tasksResult = await getMyTasks(fetch, auth.headers);
		if (!tasksResult.ok) {
			return fail(502, { error: tasksResult.error });
		}

		const task = findTask(tasksResult.tasks, selection.teknologi, selection.dbname);
		if (!task) {
			return fail(404, { error: 'Fant ikke databasen blant oppgavene til naisteamene dine.' });
		}

		const backfill =
			task.backfill === 'cold-storage-requested' || task.backfill === 'backfill-requested'
				? formData.has('coldStorageInsteadOfBackfill')
					? 'cold-storage-requested'
					: 'backfill-requested'
				: task.backfill;
		const payload = {
			naisteam,
			teknologi: task.teknologi,
			dbname: task.dbname,
			backfill,
			okonomi: formData.has('okonomi'),
			arkivforskrift: formData.has('arkivforskrift'),
			endringerUtenKrav: formData.has('endringerUtenKrav'),
			loggingLeseoperasjoner: formData.has('loggingLeseoperasjoner')
		};

		try {
			const response = await fetch(`${getLoggkamelConfig().apiUrl}/task`, {
				method: 'PUT',
				headers: auth.headers,
				body: JSON.stringify(payload),
				cache: 'no-store'
			});

			if (!response.ok) {
				return fail(502, {
					error: 'Kunne ikke oppdatere databasen i Loggkamel. Prøv igjen senere.'
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
