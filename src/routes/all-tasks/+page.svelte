<script>
</script>

<div class="container">
    <h1 class="ds-heading" data-size="xl"  style="margin-bottom:var(--ds-size-4)">
        Alle registrerte databaser
    </h1>

    <div class="buddy-items" style="margin-bottom: 3rem;">
        <ds-field class="ds-field">
            <label class="ds-label">Filtrer på naisteam</label>
            <select class="ds-input">
                <option value="" disabled="" selected="">Velg naisteam …</option>
                <option value="qwerty">Qwerty</option>
                <option value="aconcagua">Aconcagua</option>
            </select>
        </ds-field>
        <ds-field class="ds-field">
            <label class="ds-label">Filtrer på databaseteknologi</label>
            <select class="ds-input">
                <option value="" disabled="" selected="">Velg databaseteknologi …</option>
                <option value="DB2">DB2</option>
                <option value="POSTGRESQL">PostgreSQL (FSS)</option>
                <option value="ORACLE">Oracle</option>
            </select>
        </ds-field>
        <button class="ds-button" type="button">Filtrer</button> <!-- Maybe drop -->
    </div>

    <!-- TODO: Use ds-details to list all nais teams with any registered tasks, that expands to table with all the  tasks -->
</div>