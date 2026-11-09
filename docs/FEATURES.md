# Playwright features log

Which Playwright features this suite uses, which it looked at and left out, and why. Each statement was checked
against the installed Playwright (1.64.1) and the official release notes. "Proof" says how it was shown to work.

## Adopted

| Feature | Release | Where it is used | Proof |
|---|---|---|---|
| `toMatchAriaSnapshot` on a page region, with `page.ariaSnapshot()` to write the template | `page.ariaSnapshot()` 1.59 | `tests/e2e/articles.spec.ts`, "an article page keeps its structure" | Passes on the app; fails when the comment button is renamed (`Post Comment` expected, `Send` received). The first CI run failed because button names start with a space in the Docker build, so those two are matched by pattern. |
| Trace snapshots (`trace: { snapshots: { dom, aria, screen } }`) | 1.63 | `playwright.config.ts` | A deliberately failing test, old versus new setting: only the new trace holds an `aria/` folder with the accessibility tree before and after each action. The `npx playwright trace snapshot` command was not run (it needs a browser build the test machine lacked). |
| `locator.describe()` | 1.53 | Page objects and components: article card, favorite button, navbar user menu, login error list, comment card | A deliberately failing test, with and without: the failure message says `favorite button of article "..."` instead of the selector chain. |
| `failOnFlakyTests` | 1.52 | `playwright.config.ts` (on in CI) | A deliberately flaky test failed the run (ADR 0003); the nightly run later caught a real one (ADR 0005). |
| `retryStrategy: 'isolated'` | 1.62 | `playwright.config.ts` | Retries run, and the trace of the first failure is kept. |
| `--shuffle` and `--repeat-each` | `--shuffle` 1.64 | `.github/workflows/nightly.yml`; also used locally for stress runs | Found the shared-list race (ADR 0005). |
| Blob reporter and `merge-reports` | 1.37 | `.github/workflows/nightly.yml` (three browsers into one report) | The nightly run publishes one merged report. |
| Test agents (planner, generator, healer) | 1.56 | `.claude/agents`, `playwright.agents.config.ts`, `tests/seed.spec.ts` | See [AGENTS-LOG.md](AGENTS-LOG.md): five runs, with the review of each. |

## Looked at and not adopted

- **`test.describe.configure({ lock })`** (the `lock` option on `describe.configure` came in 1.64; test locks themselves in 1.63). Not needed: every worker has its own user and each test creates its own data, so tests do not contend for shared state. It would become useful if a test needed something that exists once, such as a single global setting.
- **`--only-changed`** (1.46). It works here: with a one-line change to `src/pages/article-page.ts` on a branch, `npx playwright test --only-changed=main --list` selected 33 of the 66 tests (the UI and hybrid tests in three browsers, 3 files) and skipped the API tests. It is a local convenience and is not used in CI, where the whole suite is cheap (about two minutes, ADR 0004).
- **`test.step` `params` and `subtitle`** (1.63). No reporter in this suite shows them, so there is no benefit yet.
- **`expect(page).toHaveURL()` with a predicate** (1.51). Not used: the two URL checks are regular expressions and read clearly.

## Tools outside Playwright

| Tool | Version | Where it is used | Notes |
|---|---|---|---|
| k6 | 2.3.0 | `perf/articles-browse.ts`, `.github/workflows/perf.yml` | Pinned in the workflow to the version every measured run used (`k6-version: '2.3.0'`), so the thresholds stay comparable. Dependabot does not watch it, so a bump is manual: re-run the load test, check the budgets in `perf/README.md` still hold, and update this line. k6 runs the TypeScript file directly but only strips the types. `perf/tsconfig.json` with `@types/k6` (2.3.1) type-checks it, and `npm run typecheck` runs both configs. The script imports nothing from `jslib.k6.io`, so the test has no runtime dependency on a CDN. |

## How this log is kept current

Dependabot proposes Playwright updates in its weekly pull requests. For each release it proposes, add a line here: what the release added that matters for this suite, and whether it was adopted or skipped, with the reason.
