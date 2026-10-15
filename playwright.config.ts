import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		env: { NAIS_CLUSTER_NAME: 'dev-gcp' }
	},
	testMatch: '**/*.e2e.{ts,js}'
});
