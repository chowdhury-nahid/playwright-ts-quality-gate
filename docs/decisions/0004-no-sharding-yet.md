# 0004: No sharding yet

Status: accepted, 2026-11-02

## Context
The spec sketched a four-way sharded run. Measured on three green CI runs (Docker + Postgres, Chromium): the tests
took 4.0s, 6.1s and 9.4s, inside a job of roughly 1.5 to 2 minutes (the slowest run: 127s in total). The rest is
installing dependencies (21 to 36s), installing the browser (14 to 20s), building and starting the app (about 41s)
and stopping it (about 10s). Runner speed varies from run to run, so these are ranges, not constants.

## Decision
Pull requests and `main` run the whole suite in one job. Sharding it would repeat the 41s app build and the browser
install per shard and save about nothing. The genuine parallelism in this repo is the nightly browser matrix
(Chromium, Firefox, WebKit), whose blob reports are merged into one HTML report with `merge-reports`.

## Consequences
- Revisit when the tests take longer than the set-up (for example more than a few minutes). Then add
  `--shard` and the same blob-merge job the nightly workflow already uses.
- The numbers above are from real runs (41178521902, 41185095836, 41411893061); update them when the suite or the set-up changes.
