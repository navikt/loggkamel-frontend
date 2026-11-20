# Loggkamel frontend

This SvelteKit 3 / Svelte 5 / TypeScript application manages tasks for transferring
on-prem database SQL audit logs through the Loggkamel backend to Nais storage and
GAAL (audit-log review). Database technologies use the API values `POSTGRESQL` and
`DB2`.

## Commands

Use pnpm and the committed `pnpm-lock.yaml`. CI uses Node.js 24 and pnpm 11.22.0.
Private GitHub packages require `NODE_AUTH_TOKEN` with `read:packages` and access
to the `navikt` organization. Follow the README's user-level npm configuration;
do not persist the token in the repository. The README recommends
`pnpm config --global set minimumReleaseAge 4320`.

| Task | Command |
| --- | --- |
| Install locked dependencies | `pnpm install --frozen-lockfile` |
| Start development server | `NAIS_CLUSTER_NAME=dev-gcp pnpm run dev` |
| Type-check Svelte and TypeScript | `pnpm run check` |
| Check formatting (the lint script is Prettier) | `pnpm run lint` |
| Format files | `pnpm run format` |
| Build | `pnpm run build` |
| Preview production build | `NAIS_CLUSTER_NAME=dev-gcp pnpm run preview` |
| Install Chromium for component tests | `pnpm exec playwright install chromium` |
| Run all unit and component tests once | `pnpm exec vitest run` |
| Run one server test file | `pnpm exec vitest run --project server src/routes/register/register-page-server.test.ts` |
| Run one test by name | `pnpm exec vitest run --project server src/routes/register/register-page-server.test.ts -t 'loads the naisteams available to the signed-in user'` |
| Run one component test file | `pnpm exec vitest run --project client src/routes/register/register-page.svelte.spec.ts` |
| Run unit/component tests, then E2E tests | `pnpm test` |
| Install Playwright browsers and run E2E tests | `pnpm run test:e2e` |
| Run one E2E file with browsers already installed | `pnpm exec playwright test src/routes/demo/playwright/page.svelte.e2e.ts` |

`pnpm run test:unit` starts Vitest in watch mode. In `vite.config.ts`, the
`client` project runs `*.svelte.{test,spec}.{js,ts}` in headless Chromium through
Playwright. The `server` project runs other `*.{test,spec}.{js,ts}` files in Node.
Every Vitest test must execute an assertion (`expect.requireAssertions`).
`playwright.config.ts` separately discovers `*.e2e.{ts,js}`, builds the app and
starts preview on port 4173 with `NAIS_CLUSTER_NAME=dev-gcp`.

## Architecture

- SvelteKit server loads and form actions in `src/routes/**/+page.server.ts`
  call the Loggkamel REST API. Pages receive typed `data` and `form` props;
  mutations use POST forms with `$app/forms`'s `enhance`, including named actions
  such as `?/complete`, `?/rerun` and `?/resolve`.
- The landing page loads the signed-in user's tasks from `/task/mine`.
  Registration fetches available teams from `/naisteam/mine` and creates tasks.
  Update selects an existing task by the `teknologi` and `dbname` query
  parameters, reloads the user's tasks and sends a PUT to `/task`.
  `/all-tasks` is a separate overview grouped by team.
- `/rerun` manages failed pulls. `/backfill` manages requested backfill and
  cold-storage tasks. These administrative pages show `BackendAccessNotice`;
  the backend enforces membership in the Sikkerhetstjenesten team.
- `/backfill/download/+server.ts` proxies DB2 cold-storage ZIP downloads. It
  streams the upstream body, forwards cancellation through `request.signal`,
  disables caching and rejects upstream redirects. Preserve streaming rather
  than buffering the archive or sending the browser directly to the backend.
- `src/lib/types.ts` contains shared backend response types (`TeamTask`,
  `TeamsWithTasks`, `RerunPull`). Preserve the API's Norwegian field names and
  status strings rather than translating them.

## Server configuration and authentication

`src/env.ts` declares `NAIS_CLUSTER_NAME` using SvelteKit's `defineEnvVars`.
`src/lib/server/loggkamel-config.ts` reads it from `$app/env/private` and lazily
caches the backend base URL, `/api/v1` URL and Azure OBO audience.
`src/hooks.server.ts` validates this configuration at server startup but skips
validation while building. Runtime requires `dev-gcp` or `prod-gcp`; missing or
unsupported values throw rather than defaulting to an environment.

Use `getLoggkamelConfig()` for backend URLs. The hosts are
`loggkamel.intern.dev.nav.no` and `loggkamel.intern.nav.no`, matching the outbound
hosts in `.nais/dev-gcp.json` and `.nais/prod-gcp.json`.

Nais enables the Azure login sidecar with automatic login.
`getAuthenticatedHeaders(request)` in `src/lib/server/authenticated-headers.ts`
extracts and validates the incoming token with `@navikt/oasis`, then exchanges it
for an Azure on-behalf-of token for Loggkamel. Reuse its discriminated
`ok` result and `authErrors` messages for authenticated server calls. Keep these
helpers and tokens server-side. The existing `/all-tasks` loader calls its
overview endpoint without this helper.

Authenticated loaders/actions use `cache: 'no-store'`. Loaders return an explicit
error alongside page data; actions use SvelteKit `fail` for failures and return
success data for inline feedback. Expected network (`TypeError`) and JSON
(`SyntaxError`) failures are handled separately from unexpected exceptions,
which are rethrown.

## Svelte and UI conventions

- Use Svelte 5 runes (`$props`, `$state`, `$derived`), typed route props from
  `./$types`, and event attributes such as `onclick`. `vite.config.ts` forces
  runes for project files but deliberately leaves `node_modules` unchanged.
- Internal imports use the package import alias `#lib/...`, configured in
  `package.json`, usually with explicit `.ts` or `.svelte` extensions.
  Environment imports use `$app/env` and `$app/env/private`.
- The UI uses Digdir's Designsystemet.no, not Aksel. `+layout.svelte` imports
  `@digdir/designsystemet-web`, its CSS and theme globally. Follow the existing
  `ds-*` CSS classes, `<ds-field>` elements, `data-*` variants and `--ds-*` tokens.
  Shared layout helpers (`container`, `container small`, `buddy-items`) live in
  `src/app.css`.
- Registration and update enforce the same logging-choice invariant:
  `endringerUtenKrav` cannot coexist with `okonomi` or `arkivforskrift`.
  Both the interactive checkbox state and server actions enforce this.
  Update only switches between `backfill-requested` and
  `cold-storage-requested` while a task is in one of those requested states;
  other backfill states are preserved.

## Tests and deployment

Server tests are colocated with routes/helpers and invoke loaders/actions with
mocked request events and `fetch`. They mock authentication with `vi.hoisted`
and `vi.mock`; the server project's shared `src/lib/server/test-setup.ts`
provides a mocked `dev-gcp` environment. Component tests use
`vitest-browser-svelte`'s `render`, `page` from `vitest/browser` and
`expect.element`, not Playwright's E2E test API.

The reusable `.github/workflows/build-and-push.yml` installs locked dependencies,
checks Prettier formatting, installs Chromium, runs `pnpm test`, builds the app
and publishes the Docker image. SvelteKit's Node adapter produces `build/`.
The Dockerfile copies that prebuilt output and installs production dependencies;
it does not compile the app. Keep `build/` included in the Docker context.

Pull requests from this repository deploy to `dev-gcp`. Main deploys to both
`dev-gcp` and `prod-gcp`. Both workflows render `.nais/naiserator.yaml` with
`.nais/<cluster>.json` and the built image. The container runs `build/index.js`
on port 8080; Nais readiness and liveness probes use `/health`.
