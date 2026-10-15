import { describe, expect, it } from 'vitest';
import { resolveLoggkamelConfig } from './loggkamel-config';

describe('resolveLoggkamelConfig', () => {
	it('returns the dev backend URL and audience for dev-gcp', () => {
		expect(resolveLoggkamelConfig('dev-gcp')).toEqual({
			baseUrl: 'https://loggkamel.intern.dev.nav.no/',
			apiUrl: 'https://loggkamel.intern.dev.nav.no/api/v1',
			oboAudience: 'api://dev-gcp.sikkerhetstjenesten.loggkamel/.default'
		});
	});

	it('returns the prod backend URL and audience for prod-gcp', () => {
		expect(resolveLoggkamelConfig('prod-gcp')).toEqual({
			baseUrl: 'https://loggkamel.intern.nav.no/',
			apiUrl: 'https://loggkamel.intern.nav.no/api/v1',
			oboAudience: 'api://prod-gcp.sikkerhetstjenesten.loggkamel/.default'
		});
	});

	it.each([undefined, '', 'test-gcp'])('rejects unsupported cluster %s', (clusterName) => {
		expect(() => resolveLoggkamelConfig(clusterName)).toThrow(
			'Unsupported or missing NAIS_CLUSTER_NAME'
		);
	});
});
