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
| Social: comments, favorites, follows, feed | Engagement features; wrong counts or leaked permissions erode trust quietly. | Medium: state changes in several places | API (rules, idempotence, ownership of comments, feed membership), hybrid (API creates state, UI shows it), UI (post a comment and see it after a reload, delete your own comment) |
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
  rule against fixed sleeps was demonstrated on a deliberate violation, the hybrid test that checks an author
  disappears from a feed was shown failing when the unfollow step was removed, and the fail-on-flaky gate was shown
  failing on a deliberately flaky test (ADR 0003).

## What is deliberately not tested, and why

- **Visual appearance and pixel layout.** The app is a sample app with a stock theme; screenshots would add
  maintenance and little signal.
- **Every browser on every change.** Pull requests and `main` run on Chromium. A nightly run covers Chromium,
  Firefox and WebKit, shuffled, with every test repeated three times, and merges the three reports into one.
- **The global feed.** It is a shared list of the newest 3 articles from all users (finding F1), so a reliable
  assertion about it is not possible while other tests write to it. UI tests look at lists scoped to their own data
  (see ADR 0005). The API tests cover listing and filtering.
- **Accessibility and security scanning.** Valuable, but they are separate disciplines with their own tooling.
  Out of scope here; ownership checks are covered, penetration testing is not.
- **Performance as part of the functional suite.** Load is tested by a separate k6 script on its own schedule (see
  "Performance" below), because a load test and a functional test fail for different reasons and want different
  cadences.
- **Email, password reset, payments.** The app has none of them.
- **The app's own internals.** Tests treat the app as a black box through its API and UI.

## Defects found, and how they are handled

Four defects in the app (F1 to F4 in FINDINGS.md) are recorded as tests that assert the correct behaviour and are
marked as expected failures. The build stays green while the defect exists and turns red the day it is fixed, so the
suite notices when the world changes. Each was shown to fail for its stated reason before being marked as expected. A
known defect is never hidden by skipping a test or loosening an assertion.

Two findings are handled differently because a `test.fail()` test is the wrong tool for them. F5 (a new article has no
author for a few milliseconds) is intermittent: an expected-failure test would turn the build red every time the app
behaved. The test that met it polls instead of reading once, and the load test carries a named tolerance for it. F6
(the article list costs more the more articles it returns) is about speed, and a latency assertion in the functional
suite would be flaky, so the load test's list budget is its check.

## Flakiness policy

In place today:
- Waiting is done on conditions (auto-waiting, web-first assertions, polling). Fixed sleeps are banned by a lint
  rule that fails the build.
- CI retries a failed test once, only to keep the trace of the first failure. A test that passes only on retry
  fails the run (ADR 0003). Locally there are no retries.
- A nightly run shuffles the test order and repeats every test three times on three browsers, to expose hidden
  dependencies between tests and browser-specific behaviour.
- Tests were run repeatedly against a database that already held data, to check they do not depend on a clean one.
- This works: the first nightly run flagged a test as flaky and failed. The cause was a shared list (the global
  feed shows only the newest 3 articles of all users), so another test could push the article off the page. It was
  reproduced locally, fixed by reading lists scoped to the test's own data, and written up in ADR 0005. The retry
  alone would have hidden it.
- The second case could not be reproduced. A pull request's CI run failed on `an article created by a user appears
  in that author's article list`: the author's list came back empty straight after a successful create, and the test
  passed on retry (run 42478221401). Two probes in CI, 40 sequential and 300 concurrent create-then-read pairs, were
  both green, so the cause stayed a suspicion. The test now polls the same assertion, which tolerates a delay and
  still fails if the article never appears; no sleep, no skip, no weaker assertion. The finding is F5, with the
  limits of what is known. Later the load test met the same mechanism from the other side (a list read returning a
  500 in the same gap), and a local experiment that widened the gap reproduced both symptoms.

Not built yet:
- A test that cannot be fixed quickly is quarantined: marked with a reason and an issue, excluded from the gate,
  and tracked with a time limit. Quarantine is not deletion and not a fixed sleep.

## Performance

A k6 script in `perf/`, run by `.github/workflows/perf.yml` every Monday and on demand. The numbers, run links and
the arithmetic behind every threshold are in `perf/README.md` and ADR 0006; this section is the reasoning.

- **What is loaded, and why.** The read path a visitor walks (the article list, then one article, then its comments)
  at a fixed rate, plus a create every two seconds. The list is the expensive read: at the same load it took about 30
  ms on average against about 4 ms for one article and under 2 ms for its comments (run 42550827057). Its source runs
  several queries for every article it returns, one after another, so its cost grows with the page size (F6).
- **A fixed rate, not a ramp to failure.** On the CI runner the app is flat up to 16 browse iterations a second, has
  its first trouble at 32 and is saturated by 48, so the gate runs at half the knee. A ramp would measure where the
  cliff is, and the cliff moves with the runner: the same load gave a list average of 41 ms on one runner and 20 ms
  on another.
- **Thresholds are measured, not chosen.** Each latency budget is the highest p95 in any clean run at or below the
  gate rate plus 50 percent, rounded up to 5 ms. Failures are not tolerated, except that the article list may fail
  under 1 percent of reads, a named and temporary tolerance for F5 that is removed when the app is fixed. The gate was
  seen to fail: a 1 ms budget turned the job red on exactly that threshold, then the real value turned it green again.
- **It does not gate merges.** Shared runners differ enough (a list average of 41 ms against 20 ms for the same
  load) to turn the build red for reasons unrelated to a change. A red run is looked at, not enforced (ADR 0006).
- **What it cannot see.** A regression smaller than the headroom, about 50 percent. Anything beyond one app instance
  and one shared machine. The browser, login (the app hashes passwords, which would swamp the numbers) and soak or
  spike profiles are not load tested.
- **A correction I made on the way.** The first local measurement, on SQLite, said throughput is flat however many
  connections are used. On Postgres in CI that was wrong: latency is flat up to 16 a second and then the app
  saturates. Local load numbers are not carried over to CI.

## Using AI test agents

Playwright's test agents (planner, generator, healer) were tried on the comments feature and the record is in [AGENTS-LOG.md](AGENTS-LOG.md). The rules below are the ones that record supports; nothing here is a claim about agents in general.

- **Agent-written tests are reviewed like any other contribution.** They stay out of CI (the main config does not read `tests/agents/`) until a person has read the locators, run the test and kept it. Both generator runs produced at least one test that failed on the unmodified app, and none of the generators had run their own test.
- **A test is trusted only after it has been shown failing.** The review breaks the feature on purpose (the patches in `docs/agents/patches/`) and checks that the right tests fail. A test that passes against a broken app is dropped.
- **An agent may not hide a defect.** The healer marked a test `test.fixme` when the app was at fault. The diagnosis was honest, but the suite would have gone green on a skipped test. A known defect stays an expected failure with the correct assertion (see "Defects found"), and any `fixme`, skip or loosened assertion an agent writes is reviewed as a possible hidden defect.
- **Healing a locator after a real UI change is acceptable, healing an assertion is not.** The healer fixed a renamed button by changing one locator. Anything beyond a locator, or a change that makes a failing test pass without the product changing, needs a person.
- **Give the agents the repo's conventions.** With a short conventions file the generated tests used the page objects, builders and fixtures, with no wrong locators. Without it they found the fixtures too, but two of eight tests had locators that matched the wrong or too many elements, and comment text came from the clock.
- **Treat an agent's explanation of a cause as a hypothesis.** When the healer could not read the answer from the checkout, it named a wrong cause and labelled it unconfirmed.
- **Small evidence.** One feature, one reviewer, one run each. The rules above are what to do next time, not a measurement.

Comments now have UI coverage: two tests, adapted from the agents' output and changed by hand, each shown failing when the feature it covers is broken.

## Trade-offs I made

- **Few UI tests over many.** More UI tests would feel safer and be slower and flakier. The API and hybrid tests
  cover the rules, so the UI tests only prove the journeys.
- **A self-hosted app over a public demo site.** It costs set-up work (Docker, a pinned version) and buys a CI gate
  that can fail honestly, plus the ability to show a deliberate regression turning the build red.
- **Defects as expected failures over a bug list alone.** A list goes stale. A test that flips red when the defect
  is fixed does not.
- **Speed versus coverage in CI.** Pull requests and `main` run the whole suite on one browser in one job. The
  tests take seconds inside a job of about two minutes, most of which is installing and starting the app, so
  sharding would repeat the slow part for no gain (ADR 0004). The parallelism that is worth having is the nightly
  run across three browsers. Sharding will be added when the tests outgrow the set-up time.
- **A weekly load test over a merge gate.** A required performance check would be red or green depending on which
  shared runner a pull request got. A weekly run with measured headroom is noisier to read but honest about it, and
  it costs the ability to block a slow change at review time.
- **A tolerance for one app defect over zero tolerance.** The load test accepts under 1 percent of article list reads
  failing, because the app produces 0 or 1 such failures in a run of about 960 reads on its own. Zero tolerance
  would have been red in four of the five latest runs at the gate rate, which teaches people to ignore it.
