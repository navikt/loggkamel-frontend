import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { RerunPull } from '$lib/types';
import { authErrors, getAuthenticatedHeaders } from '$lib/server/authenticated-headers';

const LOGGKAMEL_API_URL = 'https://loggkamel.intern.dev.nav.no/api/v1';
const LOAD_ERROR = 'Kunne ikke hente feilede loggpuller. Prøv igjen senere.';
const ACTION_ERROR = 'Kunne ikke endre loggpullen. Prøv igjen senere.';

type PullAction = 'rerun' | 'resolve';

async function changePull(
	fetch: typeof globalThis.fetch,
	request: Request,
	formData: FormData,
	action: PullAction
) {
	const id = formData.get('id');
	if (typeof id !== 'string' || !/^\d+$/.test(id)) {
		return fail(400, { error: ACTION_ERROR });
	}

	const auth = await getAuthenticatedHeaders(request);
	if (!auth.ok) {
		return fail(auth.reason === 'obo-token-failed' ? 502 : 401, {
			error: authErrors[auth.reason]
		});
	}

	try {
		const response = await fetch(`${LOGGKAMEL_API_URL}/pull/${action}/${id}`, {
			method: 'POST',
			headers: auth.headers,
			cache: 'no-store'
		});

		if (!response.ok) {
			if (response.status === 401) {
				return fail(401, { error: 'Du må være logget inn for å gjøre denne endringen.' });
			}
			if (response.status === 403) {
				return fail(403, { error: 'Du har ikke tilgang til å gjøre denne endringen.' });
			}
			return fail(502, { error: ACTION_ERROR });
		}
	} catch (error) {
		if (error instanceof TypeError) {
			return fail(502, { error: ACTION_ERROR });
		}
		throw error;
	}

	return { success: action };
}

export const load: PageServerLoad = async ({ fetch, request }) => {
	const auth = await getAuthenticatedHeaders(request);
	if (!auth.ok) {
		return { rerunPulls: [] as RerunPull[], error: authErrors[auth.reason] };
	}

	try {
		const response = await fetch(`${LOGGKAMEL_API_URL}/pull/rerun-required`, {
			headers: auth.headers,
			cache: 'no-store'
		});
		if (!response.ok) {
			return { rerunPulls: [] as RerunPull[], error: LOAD_ERROR };
		}

		const rerunPulls: RerunPull[] = await response.json();
		return { rerunPulls, error: null };
	} catch (error) {
		if (error instanceof TypeError || error instanceof SyntaxError) {
			return { rerunPulls: [] as RerunPull[], error: LOAD_ERROR };
		}
		throw error;
	}
};

export const actions: Actions = {
	rerun: async ({ fetch, request }) =>
		changePull(fetch, request, await request.formData(), 'rerun'),
	resolve: async ({ fetch, request }) =>
		changePull(fetch, request, await request.formData(), 'resolve')
};
