# 0003: Fail the build on a test that only passes on retry

Status: accepted, 2026-11-02

## Context
Retries make a build green by hiding unstable tests. A test that needs a second attempt is telling you something:
a missing wait on a condition, shared data, or a product race.

## Decision
In CI the suite runs with one retry and `failOnFlakyTests`. The retry still happens, so the trace of the first
failure is kept, but a test that passes only on retry fails the run. Retries use `retryStrategy: 'isolated'`, so
the second attempt does not inherit state from the first. Locally there are no retries.

## Evidence
A throwaway test that fails on its first attempt and passes on retry (it checks `testInfo.retry`):

- Without the gate: exit code 0, the run reports it as flaky (`1 flaky`, followed by the test name).
- With the gate: exit code 1, the run fails with the same `1 flaky` line.

## Consequences
- A flaky test cannot sit in the suite unnoticed. The fix is to find the cause; the quarantine route in
  STRATEGY.md is the only alternative, and it is tracked.
- A pull request that makes a test flaky is red even though a retry would have passed.
