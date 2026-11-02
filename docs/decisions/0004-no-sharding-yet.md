# 0004: No sharding yet

Status: accepted, 2026-11-02

## Context
The spec sketched a four-way sharded run. Measured on CI run 41178521902 (Docker + Postgres, Chromium): the job
took about 99 seconds, of which the tests took 4. The rest is installing dependencies (21s), installing the
browser (14s), building and starting the app (41s) and stopping it (11s).

## Decision
Pull requests and `main` run the whole suite in one job. Sharding it would repeat the 41s app build and the browser
install per shard and save about nothing. The genuine parallelism in this repo is the nightly browser matrix
(Chromium, Firefox, WebKit), whose blob reports are merged into one HTML report with `merge-reports`.

## Consequences
- Revisit when the tests take longer than the set-up (for example more than a few minutes). Then add
  `--shard` and the same blob-merge job the nightly workflow already uses.
- The numbers above are from a real run; update them when the suite or the set-up changes.
