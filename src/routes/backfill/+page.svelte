<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import BackendAccessNotice from '$lib/BackendAccessNotice.svelte';
	import type { TeamTask } from '$lib/types';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let pending = $state.raw<TeamTask | null>(null);
	let downloadNotice = $state<string | null>(null);
	const activeTeams = $derived(data.teamsWithTasks.filter((team) => team.tasksForTeam.length > 0));

	beforeNavigate(({ cancel }) => {
		if (pending) cancel();
	});

	function completeTask(task: TeamTask): SubmitFunction {
		return ({ cancel }) => {
			if (pending) {
				cancel();
				return;
			}
			pending = task;
			downloadNotice = null;
			return async ({ update }) => {
				try {
					await update();
				} finally {
					pending = null;
				}
			};
		};
	}
</script>

<svelte:head>
	<title>Backfill and Cold-Storage Management | Loggkamel</title>
</svelte:head>

<main class="container">
	<h1 class="ds-heading" data-size="xl">Backfill and Cold-Storage Management</h1>

	<BackendAccessNotice />

	{#if data.error}
		<div class="ds-alert" data-color="danger" role="alert" data-testid="backfill-load-error">
			{data.error}
		</div>
	{/if}

	{#if downloadNotice}
		<div class="ds-alert" data-color="info" role="status" data-testid="backfill-download-notice">
			{downloadNotice}
		</div>
	{:else if !pending && form?.error}
		<div class="ds-alert" data-color="danger" role="alert" data-testid="backfill-action-error">
			{form.error}
		</div>
	{:else if !pending && form?.success}
		<div class="ds-alert" data-color="success" role="status" data-testid="backfill-action-success">
			{form.success}
		</div>
	{/if}

	{#if pending}
		<div class="ds-alert" data-color="info" role="status" data-testid="backfill-pending">
			Marking {pending.dbname} as completed. Please stay on this page until the process finishes. Navigation
			is paused while it runs.
		</div>
	{/if}

	{#if !data.error && activeTeams.length === 0}
		<p role="status" data-testid="backfill-empty">
			No backfill or cold-storage requests remaining.
		</p>
	{:else}
		<div>
			{#each activeTeams as team (team.naisteam)}
				<details class="ds-details" data-testid={`backfill-team-${team.naisteam}`}>
					<summary data-testid={`backfill-team-summary-${team.naisteam}`}>
						{team.naisteam}
						({team.tasksForTeam.filter((task) => task.backfill === 'backfill-requested').length}
						backfills requested,
						{team.tasksForTeam.filter((task) => task.backfill === 'cold-storage-requested').length}
						cold storage requested)
					</summary>
					<div>
						<div class="table-scroll">
							<table class="ds-table" data-testid={`backfill-tasks-${team.naisteam}`}>
								<caption>Active requests for {team.naisteam}</caption>
								<thead>
									<tr>
										<th scope="col">Teknologi</th>
										<th scope="col">Database</th>
										<th scope="col">Action Requested</th>
										<th scope="col">Available Actions</th>
									</tr>
								</thead>
								<tbody>
									{#each team.tasksForTeam as task (`${task.teknologi}-${task.dbname}`)}
										<tr data-testid={`backfill-task-${task.teknologi}-${task.dbname}`}>
											<td>{task.teknologi}</td>
											<td>{task.dbname}</td>
											<td>{task.backfill}</td>
											<td>
												<div class="buddy-items">
													{#if task.teknologi === 'DB2' && task.backfill === 'cold-storage-requested'}
														<a
															data-testid={`backfill-download-${task.teknologi}-${task.dbname}`}
															class="ds-button"
															data-variant="secondary"
															href={`/backfill/download?dbname=${encodeURIComponent(task.dbname)}`}
															target="_blank"
															rel="noopener noreferrer"
															data-sveltekit-reload
															data-sveltekit-preload-data="off"
															aria-label={`Download Files for ${task.dbname}`}
															onclick={() =>
																(downloadNotice = `Download requested for ${task.dbname}. Your browser will manage the download. If the request fails, an error will appear in the new tab.`)}
														>
															Download Files
														</a>
													{/if}
													{#if task.teknologi === 'POSTGRESQL' || (task.teknologi === 'DB2' && task.backfill === 'cold-storage-requested')}
														<form
															data-testid={`backfill-complete-form-${task.teknologi}-${task.dbname}`}
															method="POST"
															action="?/complete"
															use:enhance={completeTask(task)}
														>
															<input type="hidden" name="teknologi" value={task.teknologi} />
															<input type="hidden" name="dbname" value={task.dbname} />
															<button
																data-testid={`backfill-complete-${task.teknologi}-${task.dbname}`}
																class="ds-button"
																type="submit"
																disabled={pending !== null}
																aria-label={`Mark ${task.dbname} Completed`}
																aria-busy={pending === task}
															>
																{pending === task ? 'Marking completed...' : 'Mark Completed'}
															</button>
														</form>
													{:else}
														<span
															data-testid={`backfill-no-actions-${task.teknologi}-${task.dbname}`}
															>No actions available</span
														>
													{/if}
												</div>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				</details>
			{/each}
		</div>
	{/if}
</main>

<style>
	h1,
	.ds-alert {
		margin-bottom: var(--ds-size-5);
	}

	.table-scroll {
		overflow-x: auto;
	}
</style>
