import type { PageServerLoad } from './$types';
import type { RerunPull } from '$lib/types';

export const load: PageServerLoad = async () => {
	const response = await fetch('https://loggkamel.intern.dev.nav.no/api/v1/pull/rerun-required');
	console.log(response);

	if (!response.ok) {
		return { rerunPulls: [] as RerunPull[] };
		console.log('Not OK, { rerunPulls: [] }');
	}

	const text = await response.text();

	if (!text) {
		console.log('Not text');
		return { rerunPulls: [] as RerunPull[] };
	}

	try {
		const parsed = JSON.parse(text);

		if (!Array.isArray(parsed)) {
			return { rerunPulls: [] as RerunPull[] };
		}

		const rerunPulls: RerunPull[] = parsed as RerunPull[];
		return { rerunPulls };
	} catch {
		console.error('Unexpected non-JSON response');
		console.log(text);
		return { rerunPulls: [] as RerunPull[] };
	}
	console.log('Cases done');
};
