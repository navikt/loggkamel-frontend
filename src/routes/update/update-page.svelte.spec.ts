import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import UpdatePage from './+page.svelte';
import type { PageData } from './$types';

function pageData(
	backfill: string,
	okonomi = true,
	endringerUtenKrav = false,
	arkivforskrift = false
): PageData {
	return {
		task: {
			naisteam: 'team-a',
			teknologi: 'POSTGRESQL',
			dbname: 'audit-db',
			okonomi,
			arkivforskrift,
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
	it('checks the checkbox when cold storage is requested', async () => {
		render(UpdatePage, { data: pageData('cold-storage-requested'), form: null, params: {} });

		await expect.element(page.getByTestId('coldStorageInsteadOfBackfill')).toBeChecked();
	});

	it('leaves the checkbox unchecked when backfill is requested', async () => {
		render(UpdatePage, { data: pageData('backfill-requested'), form: null, params: {} });

		await expect.element(page.getByTestId('coldStorageInsteadOfBackfill')).not.toBeChecked();
	});

	it.each(['backfill-completed', 'cold-storage-completed'])(
		'shows completed text instead of the checkbox for other backfill states',
		async (backfillStatus) => {
			render(UpdatePage, { data: pageData(backfillStatus), form: null, params: {} });

			await expect.element(page.getByTestId('backfillCompleted')).toBeInTheDocument();
			await expect
				.element(page.getByTestId('coldStorageInsteadOfBackfill'))
				.not.toBeInTheDocument();
		}
	);

	it('unchecks both mandatory reasons when non-mandatory change logging is checked', async () => {
		render(UpdatePage, {
			data: pageData('backfill-requested', true, false, true),
			form: null,
			params: {}
		});

		await expect.element(page.getByTestId('okonomi')).toBeChecked();
		await expect.element(page.getByTestId('arkivforskrift')).toBeChecked();

		await page.getByTestId('endringerUtenKrav').click();

		await expect.element(page.getByTestId('okonomi')).not.toBeChecked();
		await expect.element(page.getByTestId('arkivforskrift')).not.toBeChecked();
		await expect.element(page.getByTestId('endringerUtenKrav')).toBeChecked();
	});

	it.each(['okonomi', 'arkivforskrift'])(
		'unchecks non-mandatory change logging when %s is checked',
		async (reason) => {
			render(UpdatePage, {
				data: pageData('requested', false, true),
				form: null,
				params: {}
			});

			await page.getByTestId(reason).click();

			await expect.element(page.getByTestId('endringerUtenKrav')).not.toBeChecked();
			await expect.element(page.getByTestId(reason)).toBeChecked();
		}
	);

	it('allows both mandatory reasons to be selected', async () => {
		render(UpdatePage, { data: pageData('backfill-requested'), form: null, params: {} });

		await page.getByTestId('arkivforskrift').click();

		await expect.element(page.getByTestId('okonomi')).toBeChecked();
		await expect.element(page.getByTestId('arkivforskrift')).toBeChecked();
	});
});
