<script lang="ts">
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();
    const teamsWithTasks = $derived(data.teamsWithTasks);
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

    <div>
        {#each teamsWithTasks as naisTeam (naisTeam.naisteam)}
            <details class="ds-details">
                <summary>{naisTeam.naisteam} ({naisTeam.tasksForTeam.length})</summary>
                <div>
                    <table class="ds-table">
                        <thead>
                        <tr>
                            <th>DBMS</th>
                            <th>Database</th>
                            <th>Overførings-tasks</th>
                        </tr>
                        </thead>
                        <tbody>
                        {#each naisTeam.tasksForTeam as task (task.dbname)}
                            <tr>
                                <td>{task.teknologi}</td>
                                <td>{task.dbname}</td>
                                <td>{task.okonomi ? 'Økonomi' : task.endringerUtenKrav ? 'endringer' : task.loggingLeseoperasjoner ? 'read' : 'ingen'}</td>
                            </tr>
                        {/each}
                        </tbody>
                    </table>
                </div>
            </details>

        {/each}
    </div>
</div>