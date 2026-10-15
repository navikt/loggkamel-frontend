import { vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({
	env: { NAIS_CLUSTER_NAME: 'dev-gcp' }
}));
