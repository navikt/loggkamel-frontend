import type { PageServerLoad } from './$types';
import type { RerunPull } from '$lib/types';

export const load: PageServerLoad = async () => {
	const response = await fetch('https://loggkamel.intern.dev.nav.no/api/v1/pull/rerun-required');

	if (!response.ok) {
		return { rerunPulls: [] as RerunPull[] };
	}

	const text = await response.text();

	if (!text) {
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
		return { rerunPulls: [] as RerunPull[] };
	}
};
