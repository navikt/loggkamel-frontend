import type { PageServerLoad } from './$types';
import type { TeamTask } from '$lib/types';

export const load: PageServerLoad = async () => {
	const response = await fetch(
		'https://loggkamel.intern.dev.nav.no/api/v1/naisteam/auditlogg/sikkerhetstjenesten'
	);
	const teamTasks: TeamTask[] = await response.json();
	console.log(teamTasks);
	return { teamTasks };
};
