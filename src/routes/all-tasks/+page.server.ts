import type { PageServerLoad } from './$types';
import type { TeamsWithTasks } from '$lib/types';
import { getLoggkamelConfig } from '$lib/server/loggkamel-config';

export const load: PageServerLoad = async () => {
	const response = await fetch(`${getLoggkamelConfig().apiUrl}/naisteam/auditlogg/by-team`);
	const teamsWithTasks: TeamsWithTasks[] = await response.json();
	return { teamsWithTasks };
};
