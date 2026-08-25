<script lang="ts">
</script>

<nav class="nav-bar">
    <a
            rel="noreferrer"
            href="/"
            class="ds-button"
            data-variant="tertiary"
            data-size="lg"
    >Loggkamel</a>
    <div class="nav-bar-inner" aria-label="Side-navigasjon">
        <div class="nav-bar-inner">
            <a
                    rel="noreferrer"
                    href="/all-tasks"
                    class="ds-button"
                    data-variant="tertiary"
                    data-color="neutral"
            >Alle registreringer</a>
            <a
                    rel="noreferrer"
                    href="/about"
                    class="ds-button"
                    data-variant="tertiary"
                    data-color="neutral"
            >Om loggkamel</a>
        </div>
        <a
                rel="noreferrer"
                href="/register"
                class="ds-button"
        >Registrer database</a>
    </div>
    <details class="hamburger-menu">
        <summary class="ds-button" data-variant="tertiary" aria-label="Side-navigasjon"></summary>
        <div>
            <a class="ds-button" data-variant="tertiary" href="/all-tasks">Alle registreringer</a>
            <a class="ds-button" data-variant="tertiary" href="/register">Registrer database</a>
            <a class="ds-button" data-variant="tertiary" href="/about">Om loggkamel</a>
        </div>
    </details>
</nav>

<style>
    .nav-bar {
        display: flex;
        padding-bottom: 1rem;
    }

    .nav-bar-inner {
        display: flex;
        align-items: center;
        width: 100%;
        overflow: hidden;
    }

    .hamburger-menu {
        display: none;
    }

    @media (max-width: 45rem) {
        .nav-bar-inner {
            display: none;
        }

        .hamburger-menu {
            display: flex;
            width: 100%;
            justify-content: flex-end;
        }
        .hamburger-menu > summary::after {
            content: "☰";
        }
        .hamburger-menu[open] > summary::after {
            content: "╳";
        }
    }
</style>