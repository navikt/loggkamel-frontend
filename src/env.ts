import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	NAIS_CLUSTER_NAME: {
		// The server startup hook validates the cluster at runtime, not during builds.
		schema: (value) => value
	}
});
