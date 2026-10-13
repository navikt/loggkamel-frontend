import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import UpdatePage from './+page.svelte';
import type { PageData } from './$types';

function pageData(backfill: string): PageData {
	return {
		task: {
			naisteam: 'team-a',
			teknologi: 'POSTGRESQL',
			dbname: 'audit-db',
			okonomi: true,
			endringerUtenKrav: false,
			loggingLeseoperasjoner: true,
			fiksa: false,
			created: '2026-01-01',
			updated: '2026-01-01',
			loggingEndringer: true,
			funnetLogger: false,
			discardLogs: false,
			backfill
		},
		naisteams: ['team-a', 'team-b'],
		error: null
	};
}

describe('update page backfill checkbox', () => {
	it('checks the checkbox when backfill is false', async () => {
		render(UpdatePage, { data: pageData('false'), form: null, params: {} });

		await expect
			.element(page.getByRole('checkbox', { name: /Overfør manuelt logger fra tidligere i 2026/ }))
			.toBeChecked();
	});

	it('leaves the checkbox unchecked when backfill is requested', async () => {
		render(UpdatePage, { data: pageData('requested'), form: null, params: {} });

		await expect
			.element(page.getByRole('checkbox', { name: /Overfør manuelt logger fra tidligere i 2026/ }))
			.not.toBeChecked();
	});

	it('shows completed text instead of the checkbox for other backfill states', async () => {
		render(UpdatePage, { data: pageData('finished'), form: null, params: {} });

		await expect.element(page.getByText('Backfill er allerede fullført.')).toBeInTheDocument();
		await expect
			.element(page.getByRole('checkbox', { name: /Overfør manuelt logger fra tidligere i 2026/ }))
			.not.toBeInTheDocument();
	});
});
