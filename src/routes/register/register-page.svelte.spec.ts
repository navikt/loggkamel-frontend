import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import RegisterPage from './+page.svelte';

describe('registration page transfer task checkboxes', () => {
	it('unchecks economic logging when non-mandatory change logging is checked', async () => {
		render(RegisterPage, {
			data: { naisteams: ['team-a'], error: null },
			form: null,
			params: {}
		});

		await page.getByTestId('endringerUtenKrav').click();

		await expect.element(page.getByTestId('okonomi')).not.toBeChecked();
	});

	it('unchecks non-mandatory change logging when economic logging is checked', async () => {
		render(RegisterPage, {
			data: { naisteams: ['team-a'], error: null },
			form: null,
			params: {}
		});

		const economicCheckbox = page.getByTestId('okonomi');
		await economicCheckbox.click();
		await page.getByTestId('endringerUtenKrav').click();
		await economicCheckbox.click();

		await expect.element(page.getByTestId('endringerUtenKrav')).not.toBeChecked();
	});
});
