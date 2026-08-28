# Loggkamel frontend

Frontend for å registrere, se og endre overførings-tasks for loggkamel. 
Loggkamel overfører SQL-logger fra on-prem databaser til Nais' lagringsløsning og [Gjennomgang av auditlogger (GAAL)](https://audit-approval.iap.nav.cloud.nais.io/).

Kontakt oss på Slack
* [#team-sikkerhetstjenesten](https://nav-it.slack.com/archives/C09KKNS0RJS) for alt angående loggkamel og frontenden
* [nais-database-auditlogging](https://nav-it.slack.com/archives/C0A29KP884T) for Nais' lagringsløsning og [GAAL](https://audit-approval.iap.nav.cloud.nais.io/)

## Tech stack
* [SvelteKit](https://kit.svelte.dev/)
* [Designsystemet.no](https://designsystemet.no/)
* Typescript

## Kjøre lokalt

Anbefaler pnpm og `pnpm config --global set minimumReleaseAge 4320`, se [Navs security playbook](https://sikkerhet.nav.no/docs/sikker-utvikling/supply-chain/#npm--nodejs).

Install dependencies with `pnpm install` (or `npm install` or `yarn`). Then start development server:

```sh
pnpm run dev

# or start the server and open the app in a new browser tab
pnpm run dev --open
```

To create a production version of your app:

```sh
pnpm run build
```

You can preview the production build with `pnpm run preview`.

New project with SvelteKit:

```sh
# create a new project
npx sv create my-app
```
