<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import "@digdir/designsystemet-web";
	import "../app.css";
	import "@digdir/designsystemet-css";
	import "@digdir/designsystemet-css/theme";

	import NavBar from '$lib/NavBar.svelte';

	let { children } = $props();
</script>

<NavBar />

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
