import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import UpdatePage from './+page.svelte';
import type { PageData } from './$types';

function pageData(backfill: string, okonomi = true, endringerUtenKrav = false): PageData {
	return {
		task: {
			naisteam: 'team-a',
			teknologi: 'POSTGRESQL',
			dbname: 'audit-db',
			okonomi,
			endringerUtenKrav,
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
		render(UpdatePage, { data: pageData('cold-storage-requested'), form: null, params: {} });

		await expect.element(page.getByTestId('coldStorageInsteadOfBackfill')).toBeChecked();
	});

	it('leaves the checkbox unchecked when backfill is requested', async () => {
		render(UpdatePage, { data: pageData('backfill-requested'), form: null, params: {} });

		await expect.element(page.getByTestId('coldStorageInsteadOfBackfill')).not.toBeChecked();
	});

	it('shows completed text instead of the checkbox for other backfill states', async () => {
		render(UpdatePage, { data: pageData('backfill-completed'), form: null, params: {} });

		await expect.element(page.getByTestId('backfillCompleted')).toBeInTheDocument();
		await expect.element(page.getByTestId('coldStorageInsteadOfBackfill')).not.toBeInTheDocument();
	});

	it('unchecks economic logging when non-mandatory change logging is checked', async () => {
		render(UpdatePage, { data: pageData('backfill-requested'), form: null, params: {} });

		await page.getByTestId('endringerUtenKrav').click();

		await expect.element(page.getByTestId('okonomi')).not.toBeChecked();
	});

	it('unchecks non-mandatory change logging when economic logging is checked', async () => {
		render(UpdatePage, {
			data: pageData('requested', false, true),
			form: null,
			params: {}
		});

		await page.getByTestId('okonomi').click();

		await expect.element(page.getByTestId('endringerUtenKrav')).not.toBeChecked();
	});
});
