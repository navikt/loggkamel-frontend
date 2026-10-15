import { env } from '$env/dynamic/private';

type LoggkamelConfig = {
	baseUrl: string;
	apiUrl: string;
	oboAudience: string;
};

function createConfig(baseUrl: string, oboAudience: string): LoggkamelConfig {
	return { baseUrl, apiUrl: `${baseUrl}api/v1`, oboAudience };
}

export function resolveLoggkamelConfig(clusterName: string | undefined): LoggkamelConfig {
	switch (clusterName) {
		case 'dev-gcp':
			return createConfig(
				'https://loggkamel.intern.dev.nav.no/',
				'api://dev-gcp.sikkerhetstjenesten.loggkamel/.default'
			);
		case 'prod-gcp':
			return createConfig(
				'https://loggkamel.intern.nav.no/',
				'api://prod-gcp.sikkerhetstjenesten.loggkamel/.default'
			);
		default:
			throw new Error(
				`Unsupported or missing NAIS_CLUSTER_NAME: ${clusterName ?? '(missing)'}. ` +
					'Set NAIS_CLUSTER_NAME to "dev-gcp" or "prod-gcp" before starting the frontend.'
			);
	}
}

let config: LoggkamelConfig | undefined;

export function getLoggkamelConfig(): LoggkamelConfig {
	config ??= resolveLoggkamelConfig(env.NAIS_CLUSTER_NAME);
	return config;
}
