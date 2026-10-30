import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import RegisterPage from './+page.svelte';

describe('registration page transfer task checkboxes', () => {
	it('unchecks both mandatory reasons when non-mandatory change logging is checked', async () => {
		render(RegisterPage, {
			data: { naisteams: ['team-a'], error: null },
			form: null,
			params: {}
		});

		await page.getByTestId('arkivforskrift').click();
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
			render(RegisterPage, {
				data: { naisteams: ['team-a'], error: null },
				form: null,
				params: {}
			});

			await page.getByTestId('endringerUtenKrav').click();
			await page.getByTestId(reason).click();

			await expect.element(page.getByTestId('endringerUtenKrav')).not.toBeChecked();
			await expect.element(page.getByTestId(reason)).toBeChecked();
		}
	);
});
