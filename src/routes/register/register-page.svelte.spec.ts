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

		await page.getByRole('checkbox', { name: /Endringslogger \(DML/ }).click();

		await expect
			.element(page.getByRole('checkbox', { name: /Økonomi- eller hjelpesystem/ }))
			.not.toBeChecked();
	});

	it('unchecks non-mandatory change logging when economic logging is checked', async () => {
		render(RegisterPage, {
			data: { naisteams: ['team-a'], error: null },
			form: null,
			params: {}
		});

		const economicCheckbox = page.getByRole('checkbox', { name: /Økonomi- eller hjelpesystem/ });
		await economicCheckbox.click();
		await page.getByRole('checkbox', { name: /Endringslogger \(DML/ }).click();
		await economicCheckbox.click();

		await expect
			.element(page.getByRole('checkbox', { name: /Endringslogger \(DML/ }))
			.not.toBeChecked();
	});
});
