import type { PageServerLoad } from './$types';
import type { TeamsWithTasks } from '$lib/types';

export const load: PageServerLoad = async () => {
	// TODO: this should not be hardcoded, get from an env or config value instead
	const response = await fetch('https://loggkamel.intern.nav.no/api/v1/naisteam/auditlogg/by-team');
	const teamsWithTasks: TeamsWithTasks[] = await response.json();
	return { teamsWithTasks };
};
