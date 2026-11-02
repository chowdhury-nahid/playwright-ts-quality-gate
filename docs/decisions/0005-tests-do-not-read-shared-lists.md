# 0005: Tests do not read shared lists

Status: accepted, 2026-11-02

## Context
The first nightly run (run 41414220120) failed on its Chromium job. The fail-on-flaky gate (ADR 0003) reported
"98 passed, 1 flaky": `a published article appears in the global feed` failed on its first attempt and passed on
retry. The two other browsers passed.

The global feed lists the 3 newest articles from all users (finding F1 in `docs/FINDINGS.md`). The Chromium job also
runs the API tests, which create articles all the time, so a concurrent test can push another test's article off
the first page between "create" and "look".

Reproduced locally with 6 workers, shuffled, each test five times: on one of three runs two tests were flaky, the
global-feed test and `favoriting an article from the feed increments its count`, both for the same reason.

## Decision
A test that looks for an article it created reads a list that only its own worker writes to: the author's profile
("My Articles", newest first), not the global feed. The API test queries by author, not the unfiltered list.
The suite no longer has a UI test for the global feed. It is a shared, mutable list with a page size of 3, so a
reliable assertion about it is not possible against a shared database.

## Consequences
- The gate did its job: the instability was found by the nightly shuffle and repeat and by `failOnFlakyTests`, not
  hidden by the retry that made it pass.
- Coverage of the global feed is given up on purpose and is stated in `docs/STRATEGY.md`.
- General rule for this suite: assert on data the test created, through a view scoped to that data.
