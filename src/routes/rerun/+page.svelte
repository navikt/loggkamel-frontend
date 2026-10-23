<script lang="ts">
	import { enhance } from '$app/forms';
	import BackendAccessNotice from '$lib/BackendAccessNotice.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const rerunPulls = $derived(data.rerunPulls);
</script>

<div class="container small">
	<h1 class="ds-heading" data-size="xl" style="margin-bottom:var(--ds-size-5);">
		Pulls som trengs å rerun
	</h1>

	<BackendAccessNotice />

	{#if data.error}
		<div class="ds-alert" data-color="danger" role="alert">{data.error}</div>
	{/if}
	{#if form?.success === 'rerun'}
		<div class="ds-alert" data-color="success" role="status">Loggpullen er kjørt på nytt.</div>
	{:else if form?.success === 'resolve'}
		<div class="ds-alert" data-color="success" role="status">Loggpullen er markert som løst.</div>
	{:else if form?.error}
		<div class="ds-alert" data-color="danger" role="alert">{form.error}</div>
	{/if}

	<table class="ds-table">
		<caption>Pulls som trengs å rerun</caption>
		<thead>
			<tr>
				<th>Teknologi</th>
				<th>Database</th>
				<th>Hvorfor</th>
				<th>Rerun</th>
				<th>Mark as</th>
			</tr>
		</thead>
		<tbody>
			{#each rerunPulls as pull}
				<tr>
					<td>{pull.teknologi}</td>
					<td>{pull.dbname}</td>
					<td>{pull.failureReason}</td>
					<td>
						<form method="POST" action="?/rerun" use:enhance>
							<input type="hidden" name="id" value={pull.id} />
							<button class="ds-button" type="submit">Rerun</button>
						</form>
					</td>
					<td>
						<form method="POST" action="?/resolve" use:enhance>
							<input type="hidden" name="id" value={pull.id} />
							<button class="ds-button" type="submit">Resolved</button>
						</form>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
