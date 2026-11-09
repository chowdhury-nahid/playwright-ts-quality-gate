# Load test

One k6 script, `articles-browse.ts`, run by `.github/workflows/perf.yml` every Monday and on demand. It is not a
required check for merging; the reasons are in `docs/decisions/0006-load-test-runs-weekly-at-half-the-knee.md`.

## What it does

`setup()` registers one user and seeds ten articles, then waits until the app can read them back. Two scenarios run
side by side for 60 seconds:

- `browse`, at 16 iterations a second: the article list (`limit=10`), then one article, then its comments, with half
  a second of think time. That is about 48 requests a second.
- `write`, at one iteration every two seconds: create an article.

Every request carries an `endpoint` tag (`articles_list`, `article`, `comments`, `create_article`), and each endpoint
has its own thresholds. Login happens once, in `setup()`: the app hashes passwords, so logging in per iteration would
measure the hash.

## Why a fixed rate, and why 16

The rate is half of where the app stops coping, measured on the CI runner (ubuntu-latest: app, Postgres and k6 share
one machine; k6 2.3.0). Each row is one 60 second run on `main` unless noted. List p95 is in milliseconds.

| Browse rate | Run | List p95 | Dropped iterations | Failed list reads | Reading |
|---|---|---|---|---|---|
| 4 | [42548210448](https://github.com/chowdhury-nahid/playwright-ts-quality-gate/actions/runs/42548210448) (branch) | 51.83 | 0 | 0 of 241 | flat |
| 8 | [42548562614](https://github.com/chowdhury-nahid/playwright-ts-quality-gate/actions/runs/42548562614) | 45.56 | 0 | 0 of 481 | flat |
| 16 | [42548894571](https://github.com/chowdhury-nahid/playwright-ts-quality-gate/actions/runs/42548894571) | 40.56 | 0 | 0 of 961 | flat |
| 32 | [42549197714](https://github.com/chowdhury-nahid/playwright-ts-quality-gate/actions/runs/42549197714) | 69.34 | 13 | 0 of 1907 | first trouble. The drops came from too few pre-allocated users in the script, fixed afterwards |
| 32 | [42550273090](https://github.com/chowdhury-nahid/playwright-ts-quality-gate/actions/runs/42550273090) | 26.74 | 0 | 10 of 1921 | a faster runner. No drops, but 0.5 percent of list reads failed |
| 48 | [42549924216](https://github.com/chowdhury-nahid/playwright-ts-quality-gate/actions/runs/42549924216) | 1964.93 | 521 | 138 of 2360 | saturated |
| 64 | [42549563847](https://github.com/chowdhury-nahid/playwright-ts-quality-gate/actions/runs/42549563847) (branch) | 2572.24 | 1354 | 195 of 2487 | saturated |

Latency is flat from 4 to 16 a second. Trouble starts at 32 and the app is saturated by 48. So the knee is 32 and the
gate runs at half, 16. A ramp to failure would have measured the cliff instead, and the same 32 a second workload
showed a list average of 41 ms on one runner and 20 ms on another, so where the cliff sits moves with the runner.

## Where the thresholds come from

Each duration budget is the highest p(95) seen in any clean run at or below the gate rate, plus 50 percent for runner
variance, rounded up to 5 ms. Eight runs qualify, because latency is flat from 4 to 16 a second. All figures in
milliseconds.

| Run | Rate | List | Article | Comments | Create |
|---|---|---|---|---|---|
| [42481092609](https://github.com/chowdhury-nahid/playwright-ts-quality-gate/actions/runs/42481092609) | 4 | 36.93 | 4.90 | 1.75 | 47.46 |
| [42481752828](https://github.com/chowdhury-nahid/playwright-ts-quality-gate/actions/runs/42481752828) | 4 | 46.60 | 6.84 | 2.36 | 16.34 |
| [42548210448](https://github.com/chowdhury-nahid/playwright-ts-quality-gate/actions/runs/42548210448) | 4 | 51.83 | 6.28 | 2.41 | 16.27 |
| [42548562614](https://github.com/chowdhury-nahid/playwright-ts-quality-gate/actions/runs/42548562614) | 8 | 45.56 | 5.91 | 2.12 | 13.41 |
| [42548894571](https://github.com/chowdhury-nahid/playwright-ts-quality-gate/actions/runs/42548894571) | 16 | 40.56 | 5.30 | 1.81 | 15.07 |
| [42550567521](https://github.com/chowdhury-nahid/playwright-ts-quality-gate/actions/runs/42550567521) | 16 | 42.38 | 5.79 | 2.03 | 16.14 |
| [42550827057](https://github.com/chowdhury-nahid/playwright-ts-quality-gate/actions/runs/42550827057) | 16 | 43.06 | 5.85 | 2.17 | 19.78 |
| [42551092862](https://github.com/chowdhury-nahid/playwright-ts-quality-gate/actions/runs/42551092862) | 16 | 30.91 | 4.03 | 1.47 | 10.24 |
| **Highest** | | 51.83 | 6.84 | 2.41 | 47.46 |
| **Plus 50 percent** | | 77.75 | 10.26 | 3.62 | 71.19 |
| **Budget (p95 under)** | | 80 | 15 | 5 | 75 |

The last three runs are the repeats at the gate rate on `main`. The 16 a second run before them used the earlier
script, which sent the same requests. Across the three repeats the widest spread, worst p95 over best, is 1.93 times
on create and 1.39 to 1.48 on the rest, so the runs agree well enough to set budgets. Create has only 31 samples a run,
so its p95 is set by the second slowest request, which is why one run reached 47 ms.

Failures: none tolerated on article, comments and create. The article list tolerates under 1 percent of reads
failing, because of an app defect (finding F5 in `docs/FINDINGS.md`): the app creates an article and writes its
author afterwards, and a list read that lands in that gap returns a 500. At the gate rate that cost 0 or 1 of about
960 list reads in each of three repeats, so zero tolerance would fail about as often as it passed, while 1 percent is
ten times the worst of those and well under the 6 and 8 percent seen when saturated. Remove the tolerance when the app
is fixed. No iteration may be dropped.

## The gate was seen to fail

A threshold is only worth claiming once it has gone red. On the branch for this change the list budget was set to
1 ms and the job failed on that threshold: PROOF_FAIL_RUN. With the real budgets restored the same job passed:
PROOF_PASS_RUN.

## What this does not show

- Absolute numbers belong to this setup: app, Postgres and k6 on one shared runner. They are not capacity figures
  for the app.
- Runner variance is large. The same load produced a list average of 41 ms on one runner and 20 ms on another. The
  50 percent headroom is for that, and it also means a regression smaller than about 50 percent is invisible.
- The failure counts are small (0 to 10 per run) and the link between the app's author write and the failed reads is
  an inference from the app's source plus a local experiment (see F5), not something a run proved.
- Local numbers are not comparable. `npm run sut:local` runs SQLite in one process, where the article list was capped
  at about 25 requests a second whatever the number of connections. On Postgres in CI the same list stays flat to 16
  a second and then saturates, so the local flat-throughput shape does not carry over to CI.

## Running it yourself

k6 has to be installed (https://grafana.com/docs/k6/latest/set-up/install-k6/). Start the app, then:

    npm run sut:up
    npm run perf
    npm run sut:down

`PERF_RATE`, `PERF_DURATION`, `PERF_MAX_VUS`, `PERF_SEED_ARTICLES` and `PERF_BASE_URL` override the defaults. The
summary is written to `perf/results/summary.json`.
