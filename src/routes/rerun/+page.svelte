<script lang="ts">
	import type { PageProps } from './$types';
	import CheckmarkCircleIcon from '$lib/assets/CheckmarkCircleIcon.svelte';

	let { data }: PageProps = $props();
	const rerunPulls = $derived(data.rerunPulls);
</script>

<div class="container">
	<h1 class="ds-heading" data-size="xl" style="margin-bottom:var(--ds-size-5);">
		Pulls som trengs å rerun
	</h1>

	<div class="ds-alert" data-color="info" style="margin-bottom:var(--ds-size-5);">
		Backenden sjekker om du er i naisteamet Sikkerhetstjenesten, frontenden er lat.
	</div>

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
						<button class="ds-button">Rerun</button>
					</td>
					<td>
						<button class="ds-button">Resolved</button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
