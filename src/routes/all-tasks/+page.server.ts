import type { PageServerLoad } from './$types';
import type { TeamsWithTasks, TeamTask } from '$lib/types';

export const load: PageServerLoad = async () => {
	const response = await fetch(
		'https://loggkamel.intern.dev.nav.no/api/v1/naisteam/auditlogg/by-team'
	);
	const teamsWithTasks: TeamsWithTasks[] = await response.json();
	console.log('WOW By team');
	console.log(teamsWithTasks);
	return { teamsWithTasks };
};
