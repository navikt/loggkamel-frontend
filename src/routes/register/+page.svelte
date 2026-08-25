<script>
</script>

<div class="container small">
    <h1 class="ds-heading" data-size="xl"  style="margin-bottom:var(--ds-size-4)">
        Registrer on-prem database
    </h1>

    <div class="ds-alert" data-color="info" style="margin-bottom:var(--ds-size-5);">
        Pga. en bug i GCP, kan vi ikke sette riktig tid i logTime-feltet når vi overfører loggene fra tidligere i 2026 som er eldre enn 30 dager.
        Riktig tid for SQL-kjøringen står i råloggene i <a href="https://console.cloud.google.com/logs">GCP Logs Explorer</a>
        (gå via <a href="https://audit-approval.iap.nav.cloud.nais.io">GAAL</a> for å se i 2 års-log bucket'en).
    </div>

    <ds-field class="ds-field" style="margin-bottom:1.25rem;">
        <label for="naisteam" class="ds-label">Velg hvilket naisteam som får loggene</label>
        <p class="ds-paragraph">Naisteamet får tilgang til loggene i GAAL og 2 års-log bucket'en.</p>
        <select class="ds-input">
            <option value="" disabled="" selected="">Velg naisteam …</option>
            <option value="everest">Everest</option>
            <option value="aconcagua">Aconcagua</option>
            <option value="denali">Denali</option>
        </select>
    </ds-field>

    <ds-field class="ds-field" style="margin-bottom:1.25rem;">
        <label for="teknologi" class="ds-label">Oppgi databaseteknologi</label>
        <select class="ds-input">
            <option value="" disabled="" selected="">Velg DBMS …</option>
            <option value="everest">PostgreSQL FSS</option>
            <option value="aconcagua">DB2</option>
            <option value="denali">Oracle</option>
        </select>
    </ds-field>

    <ds-field class="ds-field" style="margin-bottom:1.25rem;">
        <label for="databasenavn" class="ds-label">Databasenavn</label>
        <input class="ds-input" type="text" id="databasenavn"/>
    </ds-field>

    <fieldset class="ds-fieldset" style="margin-bottom:1.25rem;">
        <legend for="tasks" class="ds-label">Velg overførings-tasks for databasen</legend>
        <!--<p class="ds-paragraph">Utdype mer?</p>-->
        <ds-field class="ds-field">
            <input
                    class="ds-input"
                    type="checkbox"
                    name="_R_0_"
                    checked=""
                    value="okonomi"
            />
            <label for="økonomi" class="ds-label" data-weight="regular">Økonomi- eller hjelpesystem: Overfør endringslogger til GAAL</label>
        </ds-field>
        <ds-field class="ds-field">
            <input
                    class="ds-input"
                    type="checkbox"
                    name="_R_0_"
                    value="arkivlov"
            />
            <label for="arkivforskrift" class="ds-label" data-weight="regular">Databasen skal forvaltes som arkiv: Overfør endringslogger (til GAAL, men ingen krav om gjennomgang)</label>
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

    <!-- TODO: Formulering -->
    <fieldset class="ds-fieldset" style="margin-bottom:1.5rem;">
        <legend class="ds-label">Mange logger allerede gjennomgått?</legend>
        <ds-field class="ds-field">
            <input
                    class="ds-input"
                    type="checkbox"
                    name="_R_0_"
                    value="loggingLeseoperasjoner"
            />
            <label for="quiet" class="ds-label" data-weight="regular">Overfør manuelt logger fra 2026 eldre enn 29 dager rett til arkivet, ikke til GAAL</label>
        </ds-field>
    </fieldset>

    <button class="ds-button">Registrer database</button>
</div>