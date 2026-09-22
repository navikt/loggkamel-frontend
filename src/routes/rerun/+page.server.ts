import type { PageServerLoad } from './$types';
import type { RerunPull, TeamTask } from '$lib/types';

export const load: PageServerLoad = async () => {
	const response = await fetch(
		'https://loggkamel.intern.dev.nav.no/api/v1/pull/rerun-required'
	);
	const allRerunRequired: RerunPull[] = await response.json();
	const teamTasks: TeamTask[] = await response.json();
	console.log(teamTasks);
	return { teamTasks };
	console.log(allRerunRequired);
	return { allRerunRequired };
};
