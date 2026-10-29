<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let okonomi = $state<boolean | null>(null);
	let arkivforskrift = $state<boolean | null>(null);
	let endringerUtenKrav = $state<boolean | null>(null);

	$effect(() => {
		if (data.task) {
			okonomi = null;
			arkivforskrift = null;
			endringerUtenKrav = null;
		}
	});
</script>

<div class="container small">
	{#if data.error}
		<h1 class="ds-heading" data-size="xl" style="margin-bottom:var(--ds-size-4)">Oppdater task</h1>
		<div class="ds-alert" data-color="danger" role="alert">{data.error}</div>
	{:else if data.task}
		<h1 class="ds-heading" data-size="xl" style="margin-bottom:var(--ds-size-4)">
			Endre {data.task.dbname} ({data.task.teknologi})
		</h1>

		{#if form?.error}
			<div class="ds-alert" data-color="danger" role="alert">{form.error}</div>
		{/if}
		{#if form?.success}
			<div class="ds-alert" data-color="success" role="status">Databasen er oppdatert.</div>
		{/if}

		<form method="POST" use:enhance>
			<ds-field class="ds-field" style="margin-bottom:1.25rem;">
				<label for="naisteam" class="ds-label">Endre hvilket naisteam som får loggene</label>
				<p class="ds-paragraph">
					Naisteamet får tilgang til loggene i GAAL og 2 års-log bucket'en.
				</p>
				<select class="ds-input" id="naisteam" name="naisteam" required>
					{#each data.naisteams as naisteam (naisteam)}
						<option value={naisteam} selected={naisteam === data.task.naisteam}>{naisteam}</option>
					{/each}
				</select>
			</ds-field>

			<fieldset class="ds-fieldset" style="margin-bottom:1.25rem;">
				<legend class="ds-label">Endre overførings-tasks for databasen</legend>
				<ds-field class="ds-field">
					<input
						class="ds-input"
						type="checkbox"
						id="okonomi"
						data-testid="okonomi"
						name="okonomi"
						value="true"
						checked={okonomi ?? data.task.okonomi}
						onchange={(event) => {
							okonomi = event.currentTarget.checked;
							if (okonomi) endringerUtenKrav = false;
						}}
					/>
					<label for="okonomi" class="ds-label" data-weight="regular"
						>Databasen er et økonomi- eller hjelpesystem, så overfør endringslogger (DML, DCL og
						DDL) til GAAL</label
					>
				</ds-field>
				<ds-field class="ds-field">
					<input
						class="ds-input"
						type="checkbox"
						id="arkivforskrift"
						data-testid="arkivforskrift"
						name="arkivforskrift"
						value="true"
						checked={arkivforskrift ?? data.task.arkivforskrift}
						onchange={(event) => {
							arkivforskrift = event.currentTarget.checked;
							if (arkivforskrift) endringerUtenKrav = false;
						}}
					/>
					<label for="arkivforskrift" class="ds-label" data-weight="regular"
						>Databasen skal forvaltes som arkiv etter arkivforskrifta § 5, så overfør endringslogger
						(DML, DCL og DDL) til GAAL</label
					>
				</ds-field>
				<ds-field class="ds-field">
					<input
						class="ds-input"
						type="checkbox"
						id="endringerUtenKrav"
						data-testid="endringerUtenKrav"
						name="endringerUtenKrav"
						value="true"
						checked={endringerUtenKrav ?? data.task.endringerUtenKrav}
						onchange={(event) => {
							endringerUtenKrav = event.currentTarget.checked;
							if (endringerUtenKrav) {
								okonomi = false;
								arkivforskrift = false;
							}
						}}
					/>
					<label for="endringerUtenKrav" class="ds-label" data-weight="regular"
						>Databasen må <b>ikke</b> følge økonomireglementet/arkivforskrifta, men overfør endringslogger
						(DML, DCL og DDL) til GAAL</label
					>
				</ds-field>
				<ds-field class="ds-field">
					<input
						class="ds-input"
						type="checkbox"
						id="loggingLeseoperasjoner"
						name="loggingLeseoperasjoner"
						value="true"
						checked={data.task.loggingLeseoperasjoner}
					/>
					<label for="loggingLeseoperasjoner" class="ds-label" data-weight="regular"
						>Overfør SELECT-logger til naisteamets default log bucket</label
					>
				</ds-field>
			</fieldset>

			<div class="ds-alert" data-color="info" style="margin-bottom:var(--ds-size-5);">
				Pga. en bug i GCP, kan vi ikke sette riktig tid i logTime-feltet når vi overfører loggene
				fra tidligere i 2026 som er eldre enn 30 dager. Riktig tid for SQL-kjøringen står i
				råloggene i <a href="https://console.cloud.google.com/logs">GCP Logs Explorer</a>
				(gå via <a href="https://audit-approval.iap.nav.cloud.nais.io">GAAL</a> for å se i 2 års-log bucket'en).
			</div>
			{#if data.task.backfill === 'cold-storage-requested' || data.task.backfill === 'backfill-requested'}
				<fieldset class="ds-fieldset" style="margin-bottom:1.5rem;">
					<legend class="ds-label">Mange logger allerede gjennomgått?</legend>
					<ds-field class="ds-field">
						<input
							class="ds-input"
							type="checkbox"
							id="coldStorageInsteadOfBackfill"
							data-testid="coldStorageInsteadOfBackfill"
							name="coldStorageInsteadOfBackfill"
							value="true"
							checked={data.task.backfill === 'cold-storage-requested'}
						/>
						<label for="coldStorageInsteadOfBackfill" class="ds-label" data-weight="regular"
							>Overfør manuelt logger fra tidligere i 2026 rett til kald-arkivet ved oppretting,
							ikke til GAAL</label
						>
					</ds-field>
				</fieldset>
			{:else}
				<p class="ds-paragraph" data-testid="backfillCompleted" style="margin-bottom:1.5rem;">
					Backfill eller cold storage er allerede overført.
				</p>
			{/if}

			<button class="ds-button" type="submit" disabled={data.naisteams.length === 0}>
				Oppdater database
			</button>
		</form>
	{:else}
		<h1 class="ds-heading" data-size="xl" style="margin-bottom:var(--ds-size-4)">Oppdater task</h1>
		<p>
			Du kan bare oppdatere tasks på dine naisteam, trykk på "Endre" for tasken på <a href="/"
				>landingssiden</a
			>.
		</p>
	{/if}
</div>
