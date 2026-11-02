[![ci](https://github.com/chowdhury-nahid/playwright-ts-quality-gate/actions/workflows/ci.yml/badge.svg)](https://github.com/chowdhury-nahid/playwright-ts-quality-gate/actions/workflows/ci.yml)

# playwright-ts-quality-gate

TypeScript Playwright suite (API and UI) run against a pinned, self-hosted Conduit app, with a CI workflow that
lints, type-checks, starts the app and runs the tests.

Status: phase 2 of 5. Not built yet: sharded reports, flaky-test gate, live report page, cross-browser nightly run.
Design decisions are in `docs/decisions/`; the reasoning behind the tests is in [docs/STRATEGY.md](docs/STRATEGY.md).

## Run it

Needs Node 22, and either Docker or just network access.

    npm ci
    npm run sut:up          # Docker + Postgres. Without Docker: npm run sut:local
    npx playwright install chromium   # first time only
    npx playwright test

Stop the app with `npm run sut:down` (Docker, also wipes data) or `npm run sut:local:stop`.

## What is tested

Latest green CI run: [33 passed in 6.1s](https://github.com/chowdhury-nahid/playwright-ts-quality-gate/actions/runs/41185095836) (Docker + Postgres, Chromium).

- `tests/api/`: 21 API tests. Accounts, article authorization, comments, favorites, follows and the feed, filters
  and paging, and 4 expected-failure tests for known app defects.
- `tests/hybrid/`: 4 tests where the API sets up state and the UI checks it.
- `tests/e2e/`: 8 UI tests on Chromium (sign up, login, bad login, publish, feed, favorite, logout, saved-login check).
- [docs/STRATEGY.md](docs/STRATEGY.md): what is tested at which level, and what is left out.
- [docs/FINDINGS.md](docs/FINDINGS.md): four defects found in the app under test. Each is a test that asserts the
  correct behaviour and is marked as an expected failure, so the build turns red the day the app is fixed.
- App under test: [TonyMckes/conduit-realworld-example-app](https://github.com/TonyMckes/conduit-realworld-example-app),
  pinned by commit in `sut/.env` (MIT licence). It uses hash routing, so URLs look like `/#/login`.

## How this was built

Built with Claude Code. I directed the design and the checks; Claude Code wrote most of the code. Every lint rule
and every expected-failure test was shown failing before it was trusted (see `docs/STRATEGY.md`), and the decisions
behind the structure are recorded in `docs/decisions/`.

## Layout

- `src/api/` typed API client (the only code that makes HTTP calls)
- `src/fixtures/` anonymous and logged-in test fixtures
- `src/pages/`, `src/components/` page objects, no assertions
- `tests/api/`, `tests/hybrid/`, `tests/e2e/` the tests, grouped by level
- `src/data/` builders for unique test data
- `sut/` the app under test (Docker Compose for CI, a no-Docker mode for local use)
- `docs/` strategy, findings and `decisions/` (architecture decision records)
