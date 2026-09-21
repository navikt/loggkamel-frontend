<script lang="ts">
    import type { PageProps } from './$types';
    import CheckmarkCircleIcon from '$lib/assets/CheckmarkCircleIcon.svelte';
    import favicon from '$lib/assets/favicon.svg';

    let { data }: PageProps = $props();
    const teamsWithTasks = $derived(
        [...(data.teamsWithTasks ?? [])]
            .sort((a, b) => a.naisteam.localeCompare(b.naisteam, 'nb', { sensitivity: 'base' }))
            .map(team => ({
                ...team,
                tasksForTeam: [...team.tasksForTeam].sort((a, b) =>
                    a.dbname.localeCompare(b.dbname, 'nb', { sensitivity: 'base' })
                )
            }))
    );

    let selectedNaisTeam = $state('');
    const filteredTeams = $derived(
        selectedNaisTeam
            ? teamsWithTasks.filter(team => team.naisteam === selectedNaisTeam)
            : teamsWithTasks
    );
</script>

<div class="container">
    <h1 class="ds-heading" data-size="xl"  style="margin-bottom:var(--ds-size-4)">
        Alle registrerte databaser
    </h1>

    <!-- TODO: Drop? Or when filtered on naisTeam, only show that table? What about filtering DBMS?
    <div class="buddy-items" style="margin-bottom: 3rem;">
        <ds-field class="ds-field">
            <label class="ds-label">Filtrer på naisteam</label>
            <select class="ds-input" bind:value={selectedNaisTeam}>
                <option value="" disabled="" selected="">Velg naisteam …</option>
                {#each teamsWithTasks as team}
                    <option value={team.naisteam}>{team.naisteam}</option>
                {/each}
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
        <button class="ds-button" type="button">Filtrer</button>
    </div>
    -->

    <div style="margin-bottom: 3rem;">
        {#each teamsWithTasks as naisTeam (naisTeam.naisteam)}
            <details class="ds-details">
                <summary>{naisTeam.naisteam} ({naisTeam.tasksForTeam.length} tasks)</summary>
                <div>
                    <table class="ds-table">
                        <thead>
                        <tr>
                            <th>DBMS</th>
                            <th>Database</th>
                            <th>Overførings-tasks</th>
                            <th>Klar</th>
                            <th>Sett logger</th>
                        </tr>
                        </thead>
                        <tbody>
                        {#each naisTeam.tasksForTeam as task (task.dbname)}
                            <tr>
                                <td>{task.teknologi}</td>
                                <td>{task.dbname}</td>
                                <td>
                                    <!-- TODO: Maybe add arkivlov -->
                                    {#if task.okonomi}
                                        <span class="ds-tag">Økonomi</span>
                                    {/if}

                                    {#if task.endringerUtenKrav && !task.okonomi}
                                        <span class="ds-tag">endringer</span>
                                    {/if}

                                    {#if task.loggingLeseoperasjoner}
                                        <span class="ds-tag" data-color="success">read</span>
                                    {/if}

                                    {#if !task.okonomi && !task.endringerUtenKrav && !task.loggingLeseoperasjoner}
                                        <span class="ds-tag" data-variant="default" data-color="neutral">ingen</span>
                                    {/if}
                                </td>
                                <td>
                                    {#if task.fiksa}
                                        <span aria-label="Fikset" role="img">
                                          <CheckmarkCircleIcon />
                                        </span>
                                    {:else}
                                        Nei
                                    {/if}
                                </td>
                                <td>
                                    {#if task.funnetLogger}
                                        <span aria-label="Ja" role="img">
                                          <CheckmarkCircleIcon />
                                        </span>
                                    {:else}
                                        Nei
                                    {/if}
                                </td>
                            </tr>
                        {/each}
                        </tbody>
                    </table>
                </div>
            </details>

        {/each}
    </div>
</div>