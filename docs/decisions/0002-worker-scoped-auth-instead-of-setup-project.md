# 0002: Authenticate once per worker through a fixture, not a shared setup project

Status: accepted, 2026-10-31

## Context
The usual pattern logs in once in a "setup" project and shares one saved storage state across all tests.
That shares one user (and its data) across parallel workers, which causes cross-test interference.

## Decision
A worker-scoped fixture (`workerUser`) registers one user per worker through the API. A `storageState` fixture
override seeds the app's localStorage login entry from that user. Tests that need a logged-out browser use the
plain `test`; logged-in tests use `authedTest`. `tests/e2e/authed-storage-state.spec.ts` checks that the override
really logs the page in.

## Consequences
- No UI login repeats, and no two workers share a user.
- Data created by one test is only visible to another if both run in the same worker. Tests therefore create
  their own data with builders and never read data they did not create.
- A setup project is not used. The design spec was amended to say so.
