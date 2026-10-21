<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let okonomi = $state(true);
	let endringerUtenKrav = $state(false);
</script>

<div class="container small">
	<h1 class="ds-heading" data-size="xl" style="margin-bottom:var(--ds-size-4)">
		Registrer on-prem database
	</h1>

	{#if data.error}
		<div class="ds-alert" data-color="danger" role="alert">{data.error}</div>
	{/if}
	{#if !data.error && data.naisteams.length === 0}
		<p class="ds-paragraph">Du er ikke medlem av et naisteam du kan registrere databaser på.</p>
	{/if}
	{#if form?.error}
		<div class="ds-alert" data-color="danger" role="alert">{form.error}</div>
	{/if}
	{#if form?.success}
		<div class="ds-alert" data-color="success" role="status">Databasen er registrert.</div>
	{/if}

	<form method="POST" use:enhance>
		<ds-field class="ds-field" style="margin-bottom:1.25rem;">
			<label for="naisteam" class="ds-label">Velg hvilket naisteam som får loggene</label>
			<p class="ds-paragraph">Naisteamet får tilgang til loggene i GAAL og 2 års-log bucket'en.</p>
			<select
				class="ds-input"
				id="naisteam"
				name="naisteam"
				required
				disabled={data.naisteams.length === 0}
			>
				<option value="" disabled selected>Velg naisteam …</option>
				{#each data.naisteams as naisteam (naisteam)}
					<option value={naisteam}>{naisteam}</option>
				{/each}
			</select>
		</ds-field>

		<ds-field class="ds-field" style="margin-bottom:1.25rem;">
			<label for="teknologi" class="ds-label">Oppgi databaseteknologi</label>
			<select class="ds-input" id="teknologi" name="teknologi" required>
				<option value="" disabled selected>Velg DBMS …</option>
				<option value="POSTGRESQL">Postgres</option>
				<option value="DB2">DB2</option>
			</select>
		</ds-field>

		<ds-field class="ds-field" style="margin-bottom:1.25rem;">
			<label for="dbname" class="ds-label">Databasenavn</label>
			<input class="ds-input" type="text" id="dbname" name="dbname" required />
		</ds-field>

		<fieldset class="ds-fieldset" style="margin-bottom:1.25rem;">
			<legend class="ds-label">Velg overførings-tasks for databasen</legend>
			<ds-field class="ds-field">
				<input
					class="ds-input"
					type="checkbox"
					id="okonomi"
					name="okonomi"
					value="true"
					bind:checked={okonomi}
					onchange={(event) => {
						if (event.currentTarget.checked) endringerUtenKrav = false;
					}}
				/>
				<label for="okonomi" class="ds-label" data-weight="regular"
					>Databasen er et økonomi- eller hjelpesystem, så overfør endringslogger (DML, DCL og DDL)
					til GAAL</label
				>
			</ds-field>
			<ds-field class="ds-field">
				<input
					class="ds-input"
					type="checkbox"
					id="endringerUtenKrav"
					name="endringerUtenKrav"
					value="true"
					bind:checked={endringerUtenKrav}
					onchange={(event) => {
						if (event.currentTarget.checked) okonomi = false;
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
				/>
				<label for="loggingLeseoperasjoner" class="ds-label" data-weight="regular"
					>Overfør SELECT-logger til naisteamets default log bucket</label
				>
			</ds-field>
		</fieldset>

		<div class="ds-alert" data-color="info" style="margin-bottom:var(--ds-size-5);">
			Pga. en bug i GCP, kan vi ikke sette riktig tid i logTime-feltet når vi overfører loggene fra
			tidligere i 2026 som er eldre enn 30 dager. Riktig tid for SQL-kjøringen står i råloggene i <a
				href="https://console.cloud.google.com/logs">GCP Logs Explorer</a
			>
			(gå via <a href="https://audit-approval.iap.nav.cloud.nais.io">GAAL</a> for å se i 2 års-log bucket'en).
		</div>
		<fieldset class="ds-fieldset" style="margin-bottom:1.5rem;">
			<legend class="ds-label">Mange logger allerede gjennomgått?</legend>
			<ds-field class="ds-field">
				<input
					class="ds-input"
					type="checkbox"
					id="coldStorageInsteadOfBackfill"
					name="coldStorageInsteadOfBackfill"
					value="true"
				/>
				<label for="coldStorageInsteadOfBackfill" class="ds-label" data-weight="regular"
					>Overfør manuelt logger fra tidligere i 2026 rett til kald-arkivet ved oppretting, ikke
					til GAAL</label
				>
			</ds-field>
		</fieldset>

		<button class="ds-button" type="submit" disabled={data.naisteams.length === 0}>
			Registrer database
		</button>
	</form>
</div>
