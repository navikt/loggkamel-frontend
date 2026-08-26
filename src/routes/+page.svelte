<script lang="ts">
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();
    const examplesArray = $derived(data.examplesArray);
</script>

<div class="container">
    <h1 class="ds-heading" data-size="xl" style="margin-bottom:var(--ds-size-5);">Logg-overføring til GCP</h1>
    <!--<p>Length {examplesArray.length}</p>-->

    {#if examplesArray.length === 0}
        <p>Ingen databaser registrert på mine naisteam (eller ingen naisteam).
            <a href="/register" class="ds-link">Registrer database</a> eller se
            <a href="/all-tasks" class="ds-link">alle registrerte databaser</a>.
        </p>
    {:else}
        <table class="ds-table">
            <caption>Databaser registrert på mine naisteam</caption>
            <thead>
            <tr>
                <th aria-sort="none">
                    <button type="button">Team</button>
                </th>
                <th aria-sort="none">
                    <button type="button">DBMS</button>
                </th>
                <th aria-sort="none">
                    <button type="button">Database</button>
                </th>
                <th>Overførings-tasks</th>
                <th></th>
            </tr>
            </thead>
            <tbody>
            {#each examplesArray as row (row.name)}
                <tr>
                    <td>{row.id}</td>
                    <td>{row.name}</td>
                    <td>{row.username}</td>
                    <!--<td style="display: flex; gap: var(--ds-size-2);">
                        {#if tagKeys.every((key) => row[key] === 'False')}
                        <span
                                class="ds-tag"
                                data-variant="default"
                                data-color="neutral"
                        >Ingen</span>
                        {:else}
                            {#each tagEntries as [key, value] (key)}
                                {#if row[key] === 'True'}
                                    <span class="ds-tag">{value}</span>
                                {/if}
                            {/each}
                        {/if}
                    </td>-->
                    <td style="text-align: right;">
                        <a
                                class="ds-link"
                                id="row-link"
                                href="/endre"
                                target="_blank"
                                rel="noopener noreferrer"
                        >Endre</a>
                    </td>
                </tr>
            {/each}
            </tbody>
        </table>
    {/if}

    <h2 class="ds-heading" data-size="m" style="margin-bottom:var(--ds-size-4); margin-top: 3rem;">
        Forklaring av overførings-tasks
    </h2>
    <p> <span class="ds-tag" style="margin-right: 0.5rem;">Økonomi</span>
        Databasen er et økonomi- eller hjelpesystem, endringslogger overføres (DML, DCL og DDL, ). Lagres i 11 år.
    </p>
    <p> <span class="ds-tag" style="margin-right: 0.5rem;">Arkivlov</span>
        Databasen skal forvaltes som arkiv (iht. arkivforskrifta § 5), endringslogger overføres (DML, DCL og DDL). Lagres i 11 år.
    </p>
    <p> <span class="ds-tag" style="margin-right: 0.5rem;">read</span>
        SELECT-logger overføres til naisteamets Default log bucket (standard-lagringstid på 30 dager), og videresendes ikke av Nais.
    </p>
    <p> <span class="ds-tag" data-variant="default" data-color="neutral" style="margin-right: 0.5rem;">Ingen</span>
        Tasks slettet eller registrert uten tasks (så loggkamel kan ignorere loggene).
    </p>
</div>
