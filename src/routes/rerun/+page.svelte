<script lang="ts">
    import type { PageProps } from './$types';
    import CheckmarkCircleIcon from "$lib/assets/CheckmarkCircleIcon.svelte";

    let { data }: PageProps = $props();
    /*const teamTasks = $derived(data.teamTasks);*/
</script>

<div class="container">
    <h1 class="ds-heading" data-size="xl" style="margin-bottom:var(--ds-size-5);">Pulls som trengs å rerun</h1>
</div>