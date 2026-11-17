import { vi } from 'vitest';

vi.mock('$app/env/private', () => ({
	NAIS_CLUSTER_NAME: 'dev-gcp'
}));
