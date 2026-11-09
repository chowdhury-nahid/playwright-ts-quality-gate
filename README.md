[![ci](https://github.com/chowdhury-nahid/playwright-ts-quality-gate/actions/workflows/ci.yml/badge.svg)](https://github.com/chowdhury-nahid/playwright-ts-quality-gate/actions/workflows/ci.yml)

# playwright-ts-quality-gate

TypeScript Playwright suite (API and UI) run against a pinned, self-hosted Conduit app, with a CI workflow that
lints, type-checks, starts the app and runs the tests.

Status: phase 5 of 5. The planned phases are built: the suite, the CI gate, the nightly and canary runs, the
test-agents experiment, and a weekly load test.
Design decisions are in `docs/decisions/`; the reasoning behind the tests is in [docs/STRATEGY.md](docs/STRATEGY.md).

## Run it

Needs Node 22, and either Docker or just network access.

    npm ci
    npm run sut:up          # Docker + Postgres. Without Docker: npm run sut:local
    npx playwright install chromium   # first time only
    npx playwright test

Stop the app with `npm run sut:down` (Docker, also wipes data) or `npm run sut:local:stop`.

## What is tested

Latest green CI run on `main` with all of the tests below: [36 passed in 12.9s](https://github.com/chowdhury-nahid/playwright-ts-quality-gate/actions/runs/41971019463) (Docker + Postgres, Chromium).

- `tests/api/`: 21 API tests. Accounts, article authorization, comments, favorites, follows and the feed, filters
  and paging, and 4 expected-failure tests for known app defects.
- `tests/hybrid/`: 4 tests where the API sets up state and the UI checks it.
- `tests/e2e/`: 11 UI tests (sign up, login, bad login, publish, own profile list, favorite, logout, saved-login check,
  an article page's structure as an accessibility snapshot, posting a comment, deleting a comment).
  They look at lists scoped to their own data, not the shared global feed, so the global feed has no UI test (see
  `docs/decisions/0005-tests-do-not-read-shared-lists.md`).
- [docs/STRATEGY.md](docs/STRATEGY.md): what is tested at which level, and what is left out.
- [docs/AGENTS-LOG.md](docs/AGENTS-LOG.md) and [docs/FEATURES.md](docs/FEATURES.md): see "Test agents and new features" below.
- [docs/FINDINGS.md](docs/FINDINGS.md): six findings in the app under test. F1 to F4 are tests that assert the correct
  behaviour and are marked as expected failures, so the build turns red the day the app is fixed. F5 (a new article has
  no author for a few milliseconds, which breaks two list endpoints in that gap) is intermittent, and F6 (the article
  list costs more the more articles it returns) is about speed, so those are covered by a polling test and the load test.
- App under test: [TonyMckes/conduit-realworld-example-app](https://github.com/TonyMckes/conduit-realworld-example-app),
  pinned by commit in `sut/.env` (MIT licence). It uses hash routing, so URLs look like `/#/login`.

## Quality gate

- **Live report:** https://chowdhury-nahid.github.io/playwright-ts-quality-gate/ is rebuilt from `main` on every push.
- **The check is enforced.** A ruleset on `main` requires the `test` job to pass, so changes reach `main` through pull
  requests whose CI is green.
- **A flaky test fails the build.** CI retries a failed test once to keep its trace, but a test that passes only on
  retry fails the run ([ADR 0003](docs/decisions/0003-fail-on-flaky-tests.md)).
- **The gate was shown failing on a real regression.** [Pull request #8](https://github.com/chowdhury-nahid/playwright-ts-quality-gate/pull/8)
  removes the check that stops one user editing another's article. CI went red with
  [1 failed, 32 passed](https://github.com/chowdhury-nahid/playwright-ts-quality-gate/actions/runs/41428147851): the failing
  test is `only the author can update an article` (`Expected: 403`, `Received: 200`). The pull request is closed, not merged.
- **Nightly run** (`.github/workflows/nightly.yml`): Chromium, Firefox and WebKit in parallel, shuffled, every test run
  three times, with the three reports merged into one. Its first run caught a flaky test, which turned out to be a
  race on a shared list; the fix and the reasoning are in [ADR 0005](docs/decisions/0005-tests-do-not-read-shared-lists.md).
  The second run passed on all three browsers.
- **Canary** (`.github/workflows/canary.yml`): the suite runs daily against the next Playwright release channel and
  opens an issue, with the version tested, when it fails.
- **Load test** (`.github/workflows/perf.yml`, `perf/`): a k6 script runs every Monday and on demand against the same
  Dockerised app, at a fixed 16 browse iterations a second, which is half of where the app stopped coping on CI (flat to
  16 a second, first trouble at 32, saturated by 48). The latency budgets are measured, not guessed: the highest p95 in
  eight clean runs plus 50 percent. The gate was seen to fail (a 1 ms budget turned the run red on exactly that
  threshold, [run 42551891216](https://github.com/chowdhury-nahid/playwright-ts-quality-gate/actions/runs/42551891216)) and
  to pass with the real budgets. It does not block merges, because shared runners differ enough to turn a build red
  for no reason ([ADR 0006](docs/decisions/0006-load-test-runs-weekly-at-half-the-knee.md)). The tables and every run link are in
  [perf/README.md](perf/README.md).
- **Dependency updates:** Dependabot proposes weekly updates for npm and GitHub Actions; each is judged by its CI result.
- **No sharding yet**, with the measurements behind that choice in [ADR 0004](docs/decisions/0004-no-sharding-yet.md).

## Test agents and new features

- **Test agents:** [docs/AGENTS-LOG.md](docs/AGENTS-LOG.md) records five runs of Playwright's planner, generator and healer on
  the comments feature, each reviewed against a fixed checklist and against deliberate defects. The short version: the
  agents explored the app accurately, none of the generated tests had been run by its author, and when the app was at fault
  the healer said so and then marked the test `fixme`, which would have kept the build green. Two reviewed tests were kept.
  The rules this led to are in [docs/STRATEGY.md](docs/STRATEGY.md).
- **Playwright features:** [docs/FEATURES.md](docs/FEATURES.md) lists what the suite uses (with the release and the proof) and what
  was looked at and left out, and why.

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
- `perf/` the k6 load test, its own tsconfig, and the measured numbers behind its thresholds
- `sut/` the app under test (Docker Compose for CI, a no-Docker mode for local use)
- `docs/` strategy, findings, the agents log, the features log and `decisions/` (architecture decision records)
