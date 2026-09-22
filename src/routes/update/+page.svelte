<script lang="ts">
    import { page } from '$app/state';

    const teknologi = $derived(page.url.searchParams.get('teknologi'));
    const dbname = $derived(page.url.searchParams.get('dbname'));

    const hasSelection = $derived(Boolean(teknologi && dbname));
</script>

<!-- TODO: Get task info from /api/v1/task/mine (or new) and possible teams from /api/v1/naisteam/mine-->

<div class="container small">
    {#if hasSelection}
        <h1 class="ds-heading" data-size="xl" style="margin-bottom:var(--ds-size-4)">
            Endre {dbname} ({teknologi})
        </h1>

        <!-- fetch task by teknologi + dbname -->
        <ds-field class="ds-field" style="margin-bottom:1.25rem;">
            <label for="naisteam" class="ds-label">Endre hvilket naisteam som får loggene</label>
            <p class="ds-paragraph">Naisteamet får tilgang til loggene i GAAL og 2 års-log bucket'en.</p>
            <select class="ds-input">
                <option value="currentTeam" selected="">current-team</option>   <!-- TODO -->
                <option value="everest">Everest</option>
                <option value="aconcagua">Aconcagua</option>
                <option value="denali">Denali</option>
            </select>
        </ds-field>

        <fieldset class="ds-fieldset" style="margin-bottom:1.25rem;">
            <legend for="tasks" class="ds-label">Endre overførings-tasks for databasen</legend>
            <!--<p class="ds-paragraph">Utdype mer?</p>-->
            <ds-field class="ds-field">
                <input
                        class="ds-input"
                        type="checkbox"
                        name="_R_0_"
                        checked=""
                        value="okonomi"
                />
                <label for="okonomi" class="ds-label" data-weight="regular">Økonomi- eller hjelpesystem: Overfør endringslogger til GAAL</label>
            </ds-field>
            <!-- TODO: Arkivlov?
            <ds-field class="ds-field">
                <input
                        class="ds-input"
                        type="checkbox"
                        name="_R_0_"
                        value="arkivlov"
                />
                <label for="arkivforskrift" class="ds-label" data-weight="regular">Databasen skal forvaltes som arkiv: Overfør endringslogger (til GAAL, men ingen krav om gjennomgang)</label>
            </ds-field>
            -->
            <ds-field class="ds-field">
                <input
                        class="ds-input"
                        type="checkbox"
                        name="_R_0_"
                        value="endringerUtenKrav"
                />
                <label for="endringerUtenKrav" class="ds-label" data-weight="regular">Endringslogger (DML, DCL og DDL) overføres for databasen, uten at det foreligger lovkrav.</label>
            </ds-field>
            <ds-field class="ds-field">
                <input
                        class="ds-input"
                        type="checkbox"
                        name="_R_0_"
                        value="loggingLeseoperasjoner"
                />
                <label for="select" class="ds-label" data-weight="regular">Overfør SELECT-logger til naisteamets default log bucket</label>
            </ds-field>
        </fieldset>

        <!-- TODO: Skal det være mulig å endre backfill = false til requested? (eneste case som kan endres) -->

        <button class="ds-button">Oppdater database</button>
    {:else}
        <h1 class="ds-heading" data-size="xl" style="margin-bottom:var(--ds-size-4)">
            Oppdater task
        </h1>
        <p>
            Du kan bare oppdatere tasks på dine naisteam, trykk på "Endre" for tasken på <a href="/">landingssiden</a>.
        </p>
    {/if}
</div>