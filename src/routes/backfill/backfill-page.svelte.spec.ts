import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { SubmitFunction } from '$app/forms';
import type { TeamTask } from '#lib/types.ts';
import BackfillPage from './+page.svelte';
import type { PageData } from './$types';

const { enhanceMock } = vi.hoisted(() => ({
	enhanceMock: vi.fn()
}));

vi.mock('$app/forms', () => ({ enhance: enhanceMock }));
vi.mock('$app/navigation', () => ({ beforeNavigate: vi.fn() }));

type Completion = Exclude<Awaited<ReturnType<SubmitFunction>>, void>;
type Submission = {
	options: Parameters<SubmitFunction>[0];
	finish: Completion;
};
let submissions: Submission[];

function task(teknologi: string, dbname: string, backfill: string, naisteam = 'team-a'): TeamTask {
	return {
		naisteam,
		teknologi,
		dbname,
		backfill,
		okonomi: false,
		arkivforskrift: false,
		endringerUtenKrav: false,
		loggingLeseoperasjoner: false,
		fiksa: false,
		created: '2026-01-01',
		updated: '2026-01-01',
		loggingEndringer: false,
		funnetLogger: false,
		discardLogs: false
	};
}

function pageData(): PageData {
	return {
		teamsWithTasks: [
			{
				naisteam: 'team-a',
				tasksForTeam: [
					task('POSTGRESQL', 'pg-backfill', 'backfill-requested'),
					task('POSTGRESQL', 'pg-cold', 'cold-storage-requested'),
					task('DB2', 'db2-backfill', 'backfill-requested'),
					task('DB2', 'db2-cold', 'cold-storage-requested')
				]
			},
			{
				naisteam: 'team-b',
				tasksForTeam: [task('DB2', 'other-db', 'backfill-requested', 'team-b')]
			},
			{ naisteam: 'empty-team', tasksForTeam: [] }
		],
		error: null
	};
}

async function finishSubmission(
	update = vi.fn().mockResolvedValue(undefined),
	result: Parameters<Completion>[0]['result'] = {
		type: 'success',
		status: 200,
		data: {},
		location: '/backfill'
	}
) {
	const { options, finish } = submissions[0];
	await finish({
		action: options.action,
		formData: options.formData,
		formElement: options.formElement,
		result,
		update
	});
	return update;
}

beforeEach(() => {
	vi.clearAllMocks();
	submissions = [];
	enhanceMock.mockImplementation((form: HTMLFormElement, submit: SubmitFunction) => {
		const onSubmit = async (event: SubmitEvent) => {
			event.preventDefault();
			const cancel = vi.fn();
			const options: Parameters<SubmitFunction>[0] = {
				action: new URL(form.action),
				formData: new FormData(form),
				formElement: form,
				submitter: event.submitter,
				controller: new AbortController(),
				cancel
			};
			const finish = await submit(options);
			if (finish && !cancel.mock.calls.length) submissions.push({ options, finish });
		};
		form.addEventListener('submit', onSubmit);
		return { destroy: () => form.removeEventListener('submit', onSubmit) };
	});
});

describe('backfill team overview', () => {
	it.each([
		['POSTGRESQL', 'backfill-requested', true],
		['POSTGRESQL', 'cold-storage-requested', true],
		['DB2', 'backfill-requested', false],
		['DB2', 'cold-storage-requested', true],
		['DB2', 'backfill-completed', false],
		['ORACLE', 'cold-storage-requested', false]
	] as const)('shows the action matrix for %s / %s', async (teknologi, backfill, canComplete) => {
		await render(BackfillPage, {
			data: {
				teamsWithTasks: [
					{ naisteam: 'team-a', tasksForTeam: [task(teknologi, 'audit-db', backfill)] }
				],
				error: null
			},
			form: null,
			params: {}
		});
		await page.getByTestId('backfill-team-summary-team-a').click();
		const row = page.getByTestId(`backfill-task-${teknologi}-audit-db`);
		await expect.element(row).toMatchTextContent(teknologi);
		await expect.element(row).toMatchTextContent('audit-db');
		await expect.element(row).toMatchTextContent(backfill);
		const complete = page.getByTestId(`backfill-complete-${teknologi}-audit-db`);
		const noActions = page.getByTestId(`backfill-no-actions-${teknologi}-audit-db`);
		if (canComplete) {
			await expect.element(complete).toBeVisible();
			await expect.element(noActions).not.toBeInTheDocument();
			await expect
				.element(page.getByTestId(`backfill-complete-form-${teknologi}-audit-db`))
				.toHaveAttribute('action', '?/complete');
		} else {
			await expect.element(complete).not.toBeInTheDocument();
			await expect.element(noActions).toHaveTextContent('No actions available');
		}
		await expect
			.element(page.getByRole('link', { name: /Download Files/ }))
			.not.toBeInTheDocument();
	});

	it('shows a loading error instead of a misleading empty state', async () => {
		await render(BackfillPage, {
			data: { teamsWithTasks: [], error: 'Could not load requests.' },
			form: null,
			params: {}
		});

		await expect
			.element(page.getByTestId('backfill-load-error'))
			.toHaveTextContent('Could not load requests.');
		await expect.element(page.getByTestId('backfill-empty')).not.toBeInTheDocument();
	});
});

describe('backfill completion feedback', () => {
	it('submits hidden task fields', async () => {
		await render(BackfillPage, {
			data: pageData(),
			form: null,
			params: {}
		});
		await page.getByTestId('backfill-team-summary-team-a').click();
		await page.getByTestId('backfill-complete-POSTGRESQL-pg-backfill').click();

		expect(submissions).toHaveLength(1);
		expect(Object.fromEntries(submissions[0].options.formData)).toEqual({
			teknologi: 'POSTGRESQL',
			dbname: 'pg-backfill'
		});
		expect(submissions[0].options.formElement.method).toBe('post');
		expect(submissions[0].options.action.search).toBe('?/complete');
	});

	it('clears pending after a failed completion and keeps the task available for retry', async () => {
		const view = await render(BackfillPage, { data: pageData(), form: null, params: {} });
		await page.getByTestId('backfill-team-summary-team-a').click();
		await page.getByTestId('backfill-complete-DB2-db2-cold').click();
		const update = vi.fn(async () => {
			await view.rerender({ form: { error: 'Completion was rejected.' } });
		});

		await finishSubmission(update, {
			type: 'failure',
			status: 409,
			location: '/backfill',
			data: { error: 'Completion was rejected.' }
		});

		await expect.element(page.getByTestId('backfill-pending')).not.toBeInTheDocument();
		await expect.element(page.getByTestId('backfill-complete-DB2-db2-cold')).toBeEnabled();
		await expect
			.element(page.getByTestId('backfill-complete-DB2-db2-cold'))
			.toHaveAttribute('aria-busy', 'false');
		await expect
			.element(page.getByTestId('backfill-action-error'))
			.toHaveTextContent('Completion was rejected.');
		await expect.element(page.getByTestId('backfill-task-DB2-db2-cold')).toBeVisible();
	});

	it('updates to the empty state after the last request is completed', async () => {
		const view = await render(BackfillPage, {
			data: {
				teamsWithTasks: [
					{
						naisteam: 'team-a',
						tasksForTeam: [task('POSTGRESQL', 'last-db', 'backfill-requested')]
					}
				],
				error: null
			},
			form: null,
			params: {}
		});
		await page.getByTestId('backfill-team-summary-team-a').click();
		await page.getByTestId('backfill-complete-POSTGRESQL-last-db').click();
		await finishSubmission(
			vi.fn(async () => {
				await view.rerender({
					data: { teamsWithTasks: [], error: null },
					form: { success: 'last-db was marked as completed.' }
				});
			})
		);

		await expect.element(page.getByTestId('backfill-empty')).toBeVisible();
		await expect.element(page.getByTestId('backfill-team-team-a')).not.toBeInTheDocument();
		await expect
			.element(page.getByTestId('backfill-action-success'))
			.toHaveTextContent('last-db was marked as completed.');
	});
});
