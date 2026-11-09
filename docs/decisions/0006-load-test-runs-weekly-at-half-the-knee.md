# 0006: The load test runs weekly at half the measured knee and does not gate merges

Status: accepted, 2026-11-09

## Context
The suite had no performance signal. A load test needs three decisions that a functional test does not: how hard to
push, what counts as too slow, and whether a slow result may block a merge.

Measured on CI (ubuntu-latest, with the app, Postgres in Docker and k6 on the same machine, k6 2.3.0), at 4, 8, 16,
32, 48 and 64 browse iterations a second for 60 seconds each (table and run links in `perf/README.md`):
- Latency is flat from 4 to 16 a second (list p95 31 to 52 ms across eight runs).
- Trouble starts at 32: one run dropped iterations (later traced to too few pre-allocated users in the script) and
  another failed 0.5 percent of list reads.
- By 48 the app is saturated: list p95 near 2 seconds, hundreds of dropped iterations, 6 to 8 percent of list reads
  failing.
- Runner speed varies a lot. The same 32 a second workload showed a list average of 41 ms on one runner and 20 ms on
  another.

The first local measurement (SQLite in memory, one process) suggested the opposite shape: list throughput capped at
about 25 requests a second however many connections were used. That does not carry over. On Postgres the list is
waiting on the database and stays flat to 16 a second.

## Decision
- The load is a fixed arrival rate of 16 browse iterations a second (about 48 requests a second), half of the measured
  knee of 32. A ramp to failure would measure where the cliff is, and the cliff moves with the runner.
- Thresholds are measured, not chosen. Each duration budget is the highest p(95) seen in any clean run at or below the
  gate rate, plus 50 percent, rounded up to 5 ms: list 80, article 15, comments 5, create 75. Failures are not
  tolerated on article, comments and create, and no iteration may be dropped. The article list tolerates under 1
  percent of reads failing, because of finding F5: the app writes an article's author after creating it, so a list
  read in that gap returns a 500: 0 or 1 of about 960 list reads in each of the three repeats at this rate. Zero
  tolerance would fail about as often as it passed; 1 percent is ten times the worst measured at 16 a second and still fails at 48 and 64.
- It runs weekly, Mondays 03:23 UTC, and on demand. It is not a required check in the `protect main` ruleset.
- k6 is pinned to the version the measurements used (2.3.0). Dependabot does not watch it, so it is bumped by hand.

## Consequences
- A performance regression shows up within a week, or in a pull request if someone dispatches the workflow on its
  branch. A regression smaller than the headroom (about 50 percent) is invisible, by design: runner variance of that
  size is normal here.
- A red run never blocks a merge, so someone has to look at it. The weekly cadence keeps the signal rare enough to
  be worth looking at.
- The 1 percent tolerance on list reads hides a real defect up to that level. It is a named, temporary tolerance:
  remove it when F5 is fixed.
- Numbers belong to this set-up (app, database and load generator on one shared runner). They say whether the app
  got slower, not what it can carry.

## Alternatives considered
- A required check on every pull request. Rejected: runner variance of the size measured here would produce red builds
  that say nothing about the change.
- A ramp to failure. Rejected: the knee moved between runners, so it cannot be a threshold.
- Thresholds from the three repeat runs alone. Rejected: the create endpoint has 31 samples a run and one earlier run
  reached 47 ms against 10 to 20 ms in the repeats, so three runs would have set a budget that fails by chance.
- Zero tolerance on every request. Rejected for the list endpoint only, for the reason in the decision.
- Averaging runs into one number. Rejected: the spread between runs is what sets the headroom.
