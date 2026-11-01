# Test strategy

Strategy for the Conduit app under test (a blogging platform: accounts, articles, comments, favorites, follows).
It explains what is tested, at which level, and why, including what is left out. Numbers are not repeated here:
the latest counts and results are in the linked CI run in the README.

Each section says what is in place today and what is planned, so nothing here claims more than the repo does.

## What the product is for, and what hurts if it breaks

| Area | Why it matters | Likelihood of breaking (my judgement) | Where it is covered |
|---|---|---|---|
| Accounts: register, log in, stay logged in | Everything else needs an identity. A broken login locks every user out. | Medium: token handling and validation are easy to get wrong | API (validation, rejection paths), UI (sign up, log in, bad login, saved login, log out) |
| Authoring: create, edit, delete articles | The core content flow. Authorization mistakes let one user change another's work. | Medium to high: ownership checks are per endpoint | API (create, validation, ownership on update and delete), UI (publish), hybrid (delete in the UI, verify in the API) |
| Social: comments, favorites, follows, feed | Engagement features; wrong counts or leaked permissions erode trust quietly. | Medium: state changes in several places | API (rules, idempotence, ownership of comments, feed membership), hybrid (API creates state, UI shows it) |
| Discovery: lists, tags, filters, paging | How readers find content. Wrong paging silently hides articles. | High: the app has paging defects today (see FINDINGS.md) | API (filters, explicit limit), expected-failure tests for the known paging defects |
| Profile editing | Users expect to change their bio without surprises. | High: crashes on a valid request today (see FINDINGS.md) | Expected-failure test for the known crash |

## The split between levels, and the reasoning

- **API tests carry most of the weight.** The rules that matter (who may change what, validation, idempotence,
  filters) live in the API. API tests are fast, need no browser and do not flake on timing, so they can be many.
- **UI tests are few and answer one question: can a person complete the main journeys?** Sign up, log in,
  publish, find an article, favorite, log out. They are slower and break for reasons unrelated to the product
  (rendering, timing), so each one has to earn its place.
- **Hybrid tests cover the seams.** The API sets up state quickly and reliably, and the UI check proves the screen
  shows it. This avoids driving long UI set-up paths just to reach one assertion, and it is where the
  front-end/back-end contract actually breaks.
- **Test data is created per test through the API with unique values.** No test depends on another test or on a
  clean database, so the suite is safe to run in parallel and against a database that already holds data.
- **A check must be able to fail.** Before a lint rule or an assertion is trusted, it is shown failing: the
  rule against fixed sleeps was demonstrated on a deliberate violation, and the hybrid test that checks an author
  disappears from a feed was shown failing when the unfollow step was removed.

## What is deliberately not tested, and why

- **Visual appearance and pixel layout.** The app is a sample app with a stock theme; screenshots would add
  maintenance and little signal.
- **Every browser.** Today the suite runs on Chromium. Firefox and WebKit are planned for a nightly run, where the
  cost of a slower job does not slow pull requests.
- **Accessibility and security scanning.** Valuable, but they are separate disciplines with their own tooling.
  Out of scope here; ownership checks are covered, penetration testing is not.
- **Performance and load.** Planned as a later, separate piece (a load test in CI), not mixed in here.
- **Email, password reset, payments.** The app has none of them.
- **The app's own internals.** Tests treat the app as a black box through its API and UI.

## Defects found, and how they are handled

Four defects in the app (see FINDINGS.md) are recorded as tests that assert the correct behaviour and are marked as
expected failures. The build stays green while the defect exists and turns red the day it is fixed, so the suite
notices when the world changes. Each was shown to fail for its stated reason before being marked as expected. A known
defect is never hidden by skipping a test or loosening an assertion.

## Flakiness policy

In place today:
- Waiting is done on conditions (auto-waiting, web-first assertions, polling). Fixed sleeps are banned by a lint
  rule that fails the build.
- Retries are not used to make a build green. Locally there are none.
- Tests were run repeatedly against a database that already held data, to check they do not depend on a clean one.

Planned for the next phase, not built yet:
- CI fails on a test that passes only on retry, instead of hiding it behind retries.
- A nightly run repeats the quick tests many times and runs tests in random order to expose hidden dependencies.
- A test that cannot be fixed quickly is quarantined: marked with a reason and an issue, excluded from the gate,
  and tracked with a time limit. Quarantine is not deletion and not a fixed sleep.

## Trade-offs I made

- **Few UI tests over many.** More UI tests would feel safer and be slower and flakier. The API and hybrid tests
  cover the rules, so the UI tests only prove the journeys.
- **A self-hosted app over a public demo site.** It costs set-up work (Docker, a pinned version) and buys a CI gate
  that can fail honestly, plus the ability to show a deliberate regression turning the build red.
- **Defects as expected failures over a bug list alone.** A list goes stale. A test that flips red when the defect
  is fixed does not.
- **Speed versus coverage in CI.** Today every push runs the whole suite on one browser, which is fast enough that a
  split would add complexity for no gain. When the suite grows or more browsers are added, pull requests will run a
  fast subset and the full matrix will run after merge and nightly; that split will be justified with measured
  timings, not assumed.
