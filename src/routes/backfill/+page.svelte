<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import BackendAccessNotice from '$lib/BackendAccessNotice.svelte';
	import type { TeamTask, TeamsWithTasks } from '$lib/types';

	function mockTask(
		naisteam: string,
		dbname: string,
		teknologi: string,
		backfill: string
	): TeamTask {
		return {
			naisteam,
			dbname,
			teknologi,
			backfill,
			okonomi: true,
			endringerUtenKrav: false,
			loggingLeseoperasjoner: false,
			fiksa: true,
			created: '2026-10-23T08:00:00Z',
			updated: '2026-10-23T08:00:00Z',
			loggingEndringer: true,
			funnetLogger: true,
			discardLogs: false
		};
	}

	let teams = $state<TeamsWithTasks[]>([
		{
			naisteam: 'team-alpha',
			tasksForTeam: [
				mockTask('team-alpha', 'alpha-postgres', 'POSTGRESQL', 'backfill-requested'),
				mockTask('team-alpha', 'alpha-archive', 'POSTGRESQL', 'cold-storage-requested'),
				mockTask('team-alpha', 'ALPHADB', 'DB2', 'cold-storage-requested')
			]
		},
		{
			naisteam: 'team-beta',
			tasksForTeam: [
				mockTask('team-beta', 'BETADB', 'DB2', 'backfill-requested'),
				mockTask('team-beta', 'BETAARCH', 'DB2', 'cold-storage-requested'),
				mockTask('team-beta', 'beta-postgres', 'POSTGRESQL', 'backfill-requested')
			]
		}
	]);

	let pending = $state<{ task: TeamTask; action: 'download' | 'complete' } | null>(null);
	let feedback = $state<{ color: 'success' | 'danger'; message: string } | null>(null);
	let simulateFailure = $state(false);
	const activeTeams = $derived(teams.filter((team) => team.tasksForTeam.length > 0));

	beforeNavigate(({ cancel }) => {
		if (pending) cancel();
	});

	async function simulateAction(task: TeamTask, action: 'download' | 'complete') {
		if (pending) return;
		pending = { task, action };
		feedback = null;
		const shouldFail = simulateFailure;

		// Delay mock responses so the pending state can be reviewed before API integration.
		await new Promise<void>((resolve) => setTimeout(resolve, action === 'download' ? 4000 : 600));

		if (shouldFail) {
			feedback = {
				color: 'danger',
				message:
					action === 'download'
						? `Could not download files for ${task.dbname}. Please try again. (Simulated error.)`
						: `Could not mark ${task.dbname} as completed. Please try again. (Simulated error.)`
			};
		} else if (action === 'complete') {
			teams = teams.map((team) => ({
				...team,
				tasksForTeam: team.tasksForTeam.filter(
					(row) =>
						row.teknologi !== task.teknologi ||
						row.dbname !== task.dbname ||
						row.naisteam !== task.naisteam
				)
			}));
			feedback = {
				color: 'success',
				message: `${task.dbname} was marked as completed. (Simulated response.)`
			};
		} else {
			feedback = {
				color: 'success',
				message: `Download completed for ${task.dbname}. No files are downloaded in this preview.`
			};
		}
		pending = null;
	}
</script>

<svelte:head>
	<title>Backfill and Cold-Storage Management | Loggkamel</title>
</svelte:head>

<main class="container">
	<h1 class="ds-heading" data-size="xl">Backfill and Cold-Storage Management</h1>

	<BackendAccessNotice />

	<details class="ds-details preview-settings">
		<summary>Mock data preview</summary>
		<div>
			<p>
				All data and responses are simulated. Downloads take four seconds. Completing a task removes
				it from this preview. Reload the page to reset the data.
			</p>
			<label>
				<input
					class="ds-input"
					type="checkbox"
					bind:checked={simulateFailure}
					disabled={pending !== null}
				/>
				Simulate failed responses
			</label>
		</div>
	</details>

	{#if feedback}
		<div
			class="ds-alert"
			data-color={feedback.color}
			role={feedback.color === 'danger' ? 'alert' : 'status'}
		>
			{feedback.message}
		</div>
	{/if}

	{#if pending}
		<div class="ds-alert" data-color="info" role="status">
			{pending.action === 'download'
				? `Preparing files for ${pending.task.dbname}. This may take a while.`
				: `Marking ${pending.task.dbname} as completed.`}
			Please stay on this page until the process finishes. Navigation is paused while it runs.
		</div>
	{/if}

	{#if activeTeams.length === 0}
		<p role="status">No backfill or cold-storage requests remaining.</p>
	{:else}
		<div>
			{#each activeTeams as team (team.naisteam)}
				<details class="ds-details">
					<summary>
						{team.naisteam}
						({team.tasksForTeam.filter((task) => task.backfill === 'backfill-requested').length}
						backfills requested,
						{team.tasksForTeam.filter((task) => task.backfill === 'cold-storage-requested').length}
						cold storage requested)
					</summary>
					<div>
						<div class="table-scroll">
							<table class="ds-table">
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
										<tr>
											<td>{task.teknologi}</td>
											<td>{task.dbname}</td>
											<td>{task.backfill}</td>
											<td>
												<div class="buddy-items">
													{#if task.teknologi === 'DB2' && task.backfill === 'cold-storage-requested'}
														<button
															class="ds-button"
															type="button"
															data-variant="secondary"
															disabled={pending !== null}
															aria-label={`Download Files for ${task.dbname}`}
															aria-busy={pending?.task === task && pending.action === 'download'}
															onclick={() => simulateAction(task, 'download')}
														>
															{#if pending?.task === task && pending.action === 'download'}
																<svg
																	class="ds-spinner"
																	data-size="xs"
																	viewBox="0 0 50 50"
																	aria-hidden="true"
																>
																	<circle
																		class="ds-spinner__background"
																		cx="25"
																		cy="25"
																		r="20"
																		fill="none"
																		stroke-width="5"
																	/>
																	<circle
																		class="ds-spinner__circle"
																		cx="25"
																		cy="25"
																		r="20"
																		fill="none"
																		stroke-width="5"
																	/>
																</svg>
																Preparing files...
															{:else}
																Download Files
															{/if}
														</button>
													{/if}
													{#if task.teknologi === 'POSTGRESQL' || (task.teknologi === 'DB2' && task.backfill === 'cold-storage-requested')}
														<button
															class="ds-button"
															type="button"
															disabled={pending !== null}
															aria-label={`Mark ${task.dbname} Completed`}
															aria-busy={pending?.task === task && pending.action === 'complete'}
															onclick={() => simulateAction(task, 'complete')}
														>
															{pending?.task === task && pending.action === 'complete'
																? 'Marking completed...'
																: 'Mark Completed'}
														</button>
													{:else}
														<span>No actions available</span>
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
	.ds-alert,
	.preview-settings {
		margin-bottom: var(--ds-size-5);
	}

	.table-scroll {
		overflow-x: auto;
	}
</style>
