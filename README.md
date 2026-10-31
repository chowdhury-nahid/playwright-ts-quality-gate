# playwright-ts-quality-gate

TypeScript Playwright suite (API and UI) run against a pinned, self-hosted Conduit app, with a CI workflow that
lints, type-checks, starts the app and runs the tests.

Status: phase 1 of 5. Not built yet: sharded reports, flaky-test gate, live report page, strategy document.
Design decisions are in `docs/decisions/`.

## Run it

Needs Node 22, and either Docker or just network access.

    npm ci
    npm run sut:up          # Docker + Postgres. Without Docker: npm run sut:local
    npx playwright install chromium   # first time only
    npx playwright test

Stop the app with `npm run sut:down` (Docker, also wipes data) or `npm run sut:local:stop`.

## What is tested

- `tests/api/`: 5 API tests (registration, login, rejected login, article creation, fixture check).
- `tests/e2e/`: 8 UI tests on Chromium (sign up, login, bad login, publish, feed, favorite, logout, saved-login check).
- App under test: [TonyMckes/conduit-realworld-example-app](https://github.com/TonyMckes/conduit-realworld-example-app),
  pinned by commit in `sut/.env` (MIT licence). It uses hash routing, so URLs look like `/#/login`.

## Layout

- `src/api/` typed API client (the only code that makes HTTP calls)
- `src/fixtures/` anonymous and logged-in test fixtures
- `src/pages/`, `src/components/` page objects, no assertions
- `src/data/` builders for unique test data
- `sut/` the app under test (Docker Compose for CI, a no-Docker mode for local use)
- `docs/decisions/` architecture decision records
