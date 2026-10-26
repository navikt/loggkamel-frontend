import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { SubmitFunction } from '@sveltejs/kit';
import type { TeamTask, TeamsWithTasks } from '$lib/types';
import BackfillPage from './+page.svelte';
import type { PageData } from './$types';

const { enhanceMock, beforeNavigateMock } = vi.hoisted(() => ({
	enhanceMock: vi.fn(),
	beforeNavigateMock: vi.fn()
}));

vi.mock('$app/forms', () => ({ enhance: enhanceMock }));
vi.mock('$app/navigation', () => ({ beforeNavigate: beforeNavigateMock }));

type Completion = Exclude<Awaited<ReturnType<SubmitFunction>>, void>;
type Submission = {
	options: Parameters<SubmitFunction>[0];
	finish: Completion;
};
let submissions: Submission[];
let cancellations: ReturnType<typeof vi.fn>[];

function task(teknologi: string, dbname: string, backfill: string, naisteam = 'team-a'): TeamTask {
	return {
		naisteam,
		teknologi,
		dbname,
		backfill,
		okonomi: false,
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
	result: Parameters<Completion>[0]['result'] = { type: 'success', status: 200, data: {} }
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
	cancellations = [];
	enhanceMock.mockImplementation((form: HTMLFormElement, submit: SubmitFunction) => {
		const onSubmit = async (event: SubmitEvent) => {
			event.preventDefault();
			const cancel = vi.fn();
			cancellations.push(cancel);
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
		['POSTGRESQL', 'backfill-requested', true, false],
		['POSTGRESQL', 'cold-storage-requested', true, false],
		['DB2', 'backfill-requested', false, false],
		['DB2', 'cold-storage-requested', true, true],
		['DB2', 'backfill-completed', false, false],
		['ORACLE', 'cold-storage-requested', false, false]
	] as const)(
		'shows the action matrix for %s / %s',
		async (teknologi, backfill, canComplete, canDownload) => {
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
			await expect.element(row).toHaveTextContent(teknologi);
			await expect.element(row).toHaveTextContent('audit-db');
			await expect.element(row).toHaveTextContent(backfill);
			const complete = page.getByTestId(`backfill-complete-${teknologi}-audit-db`);
			const download = page.getByTestId(`backfill-download-${teknologi}-audit-db`);
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
			if (canDownload) await expect.element(download).toBeVisible();
			else await expect.element(download).not.toBeInTheDocument();
		}
	);

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

describe('DB2 download link', () => {
	it.each([
		{ error: 'An earlier completion failed.' },
		{ success: 'An earlier completion succeeded.' }
	])('encodes the download link and replaces earlier completion feedback: %j', async (form) => {
		const dbname = 'ø audit?#% &';
		await render(BackfillPage, {
			data: {
				teamsWithTasks: [
					{
						naisteam: 'team-a',
						tasksForTeam: [task('DB2', dbname, 'cold-storage-requested')]
					}
				],
				error: null
			},
			form,
			params: {}
		});
		await page.getByTestId('backfill-team-summary-team-a').click();
		const download = page.getByTestId(`backfill-download-DB2-${dbname}`);
		await expect
			.element(download)
			.toHaveAttribute('href', `/backfill/download?dbname=${encodeURIComponent(dbname)}`);
		await expect.element(download).toHaveAttribute('target', '_blank');
		await expect.element(download).toHaveAttribute('rel', 'noopener noreferrer');
		await expect.element(download).toHaveAttribute('data-sveltekit-reload');
		await expect.element(download).toHaveAttribute('data-sveltekit-preload-data', 'off');
		download.element().addEventListener('click', (event) => event.preventDefault(), { once: true });

		await download.click();

		await expect
			.element(page.getByTestId('backfill-download-notice'))
			.toHaveTextContent(
				`Download requested for ${dbname}. Your browser will manage the download. If the request fails, an error will appear in the new tab.`
			);
		await expect.element(page.getByTestId('backfill-action-error')).not.toBeInTheDocument();
		await expect.element(page.getByTestId('backfill-action-success')).not.toBeInTheDocument();
		await expect.element(page.getByTestId(`backfill-task-DB2-${dbname}`)).toBeVisible();
		await expect.element(page.getByTestId(`backfill-complete-DB2-${dbname}`)).toBeEnabled();
		expect(submissions).toHaveLength(0);
		const cancel = vi.fn();
		beforeNavigateMock.mock.calls[0][0]({ cancel });
		expect(cancel).not.toHaveBeenCalled();

		await page.getByTestId(`backfill-complete-DB2-${dbname}`).click();

		await expect.element(page.getByTestId('backfill-download-notice')).not.toBeInTheDocument();
		await expect.element(page.getByTestId('backfill-pending')).toBeVisible();
		await finishSubmission();
	});
});
