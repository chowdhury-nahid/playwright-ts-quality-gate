// Load test for the app under test's read path, plus a low rate write.
//
// Shape: a fixed arrival rate, not a ramp to failure. On the CI runner (Postgres in Docker, k6 on the same machine)
// latency is flat from 4 to 16 browse iterations a second and the app saturates between 32 and 48, so the default
// rate is 16, half of the measured knee. A ramp would measure where that cliff is, and it moves with the runner;
// a fixed rate measures latency at a load the app can serve.
//
// Thresholds live in `options.thresholds` and come from measured CI runs, recorded in perf/README.md. Never guess one.
import http from 'k6/http';
import { check, fail, sleep } from 'k6';
import type { Options } from 'k6/options';

const BASE_URL = __ENV.PERF_BASE_URL ?? 'http://localhost:3001';
const SEED_ARTICLES = Number(__ENV.PERF_SEED_ARTICLES ?? '10');
const RATE = Number(__ENV.PERF_RATE ?? '16');
const DURATION = __ENV.PERF_DURATION ?? '60s';
// A browse iteration lasts about 0.55 s (half a second of think time plus three fast requests), so holding a rate of
// R a second needs about 0.55 * R virtual users. The cap has to sit above that, or k6 drops iterations because it ran
// out of users, which looks like the app saturating and is not.
const MAX_VUS = Number(__ENV.PERF_MAX_VUS ?? '40');
// Users the browse scenario starts with. k6 can add users mid-run up to MAX_VUS, but initialising one takes time and
// iterations that arrive meanwhile are dropped. Run 42549197714 at 32 a second (about 18 users needed, 10 allocated,
// 40 allowed) dropped 13 of about 1,920 iterations with no sign of the app struggling. Allocating about one user per
// iteration a second up front gives roughly twice the users needed (16 at the default rate of 16).
const PRE_ALLOCATED_VUS = Math.min(MAX_VUS, Math.max(10, Math.ceil(RATE)));
const JSON_HEADERS = { 'Content-Type': 'application/json' };

export interface SetupData {
  token: string;
  slugs: string[];
}

interface UserResponse {
  user: { token: string };
}

interface ArticleResponse {
  article: { slug: string };
}

interface SummaryData {
  metrics: Record<string, { values: Record<string, number> }>;
}

export const options: Options = {
  scenarios: {
    browse: {
      executor: 'constant-arrival-rate',
      exec: 'browse',
      rate: RATE,
      timeUnit: '1s',
      duration: DURATION,
      preAllocatedVUs: PRE_ALLOCATED_VUS,
      maxVUs: MAX_VUS,
    },
    write: {
      executor: 'constant-arrival-rate',
      exec: 'write',
      rate: 1,
      timeUnit: '2s',
      duration: DURATION,
      preAllocatedVUs: 2,
      maxVUs: 10,
    },
  },
  // Budgets, measured. Each duration budget is the highest p(95) seen in any clean run at or below the gate rate, plus
  // 50 percent for runner variance, rounded up to 5 ms. Latency is flat from 4 to 16 iterations a second, so the runs
  // at 4 and 8 count as evidence for 16. Eight runs on ubuntu-latest, k6 2.3.0 (full table in perf/README.md):
  //   rate 4:  42481092609, 42481752828, 42548210448    rate 8:  42548562614
  //   rate 16: 42548894571, 42550567521, 42550827057, 42551092862
  // Highest p(95), milliseconds: list 51.83, article 6.84, comments 2.41, create 47.46.
  // Create has only 31 samples a run, so its p(95) is set by the second slowest request, hence the wide budget.
  //
  // Failures: none tolerated on article, comments and create. The article list tolerates under 1 percent. The app
  // creates an article and writes its author afterwards (finding F5 in docs/FINDINGS.md), so a list read that lands in
  // that window returns a 500. At the gate rate that cost 0 or 1 of about 960 list reads in each of the three repeats
  // (0.1 percent at most), 10 of 1,921 at 32 a second and 6 to 8 percent at 48 and 64. Zero tolerance would flap at the
  // gate rate; 1 percent still fails when the defect gets ten times worse. Remove the tolerance when the app is fixed.
  //
  // No dropped iterations: k6 dropping iterations at the gate rate means the app could not keep up.
  thresholds: {
    'http_req_duration{endpoint:articles_list}': ['p(95)<1'],
    'http_req_duration{endpoint:article}': ['p(95)<15'],
    'http_req_duration{endpoint:comments}': ['p(95)<5'],
    'http_req_duration{endpoint:create_article}': ['p(95)<75'],
    'http_req_failed{endpoint:articles_list}': ['rate<0.01'],
    'http_req_failed{endpoint:article}': ['rate==0'],
    'http_req_failed{endpoint:comments}': ['rate==0'],
    'http_req_failed{endpoint:create_article}': ['rate==0'],
    dropped_iterations: ['count==0'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'p(95)', 'p(99)', 'max'],
};

const unique = (): string => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

// A failed request has to say which one it was. The first run reported one failure in 765 requests and the summary
// could not tell which endpoint it came from, which is no use when the threshold is going to be "none of them".
const expectStatus = (label: string, res: { status: number; body: unknown }, allowed: number[]): boolean => {
  const ok = allowed.includes(res.status);
  if (!ok) {
    console.error(`${label} returned ${res.status}, expected one of ${allowed.join(' or ')}: ${String(res.body).slice(0, 300)}`);
  }
  return ok;
};

// One registration and one article seed for the whole test: the app hashes passwords, so logging in per iteration
// would measure the hash, not the application.
export function setup(): SetupData {
  const id = unique();
  const user = { username: `perf${id}`, email: `perf${id}@example.test`, password: 'Passw0rd!123' };
  const registered = http.post(`${BASE_URL}/api/users`, JSON.stringify({ user }), { headers: JSON_HEADERS });
  if (registered.status !== 200 && registered.status !== 201) {
    fail(`setup: register returned ${registered.status}: ${String(registered.body).slice(0, 200)}`);
  }
  const token = (registered.json() as unknown as UserResponse).user.token;

  const slugs: string[] = [];
  for (let i = 0; i < SEED_ARTICLES; i += 1) {
    const article = {
      title: `Perf article ${id} ${i}`,
      description: 'seeded by the load test',
      body: 'Body seeded by the load test.',
      tagList: ['qa', 'perf'],
    };
    const created = http.post(`${BASE_URL}/api/articles`, JSON.stringify({ article }), {
      headers: { ...JSON_HEADERS, Authorization: `Token ${token}` },
    });
    if (created.status !== 200 && created.status !== 201) {
      fail(`setup: create article ${i} returned ${created.status}: ${String(created.body).slice(0, 200)}`);
    }
    slugs.push((created.json() as unknown as ArticleResponse).article.slug);
  }
  if (slugs.length !== SEED_ARTICLES) {
    fail(`setup: seeded ${slugs.length} articles, expected ${SEED_ARTICLES}`);
  }
  waitUntilSeedIsReadable(user.username);
  return { token, slugs };
}

// The app answers a create before it has finished writing the article's author (finding F5 in docs/FINDINGS.md).
// While that write is pending, the author filtered list omits the article and the plain article list returns a 500
// (`toAppend.hasFollower is not a function`). The first three load runs each failed exactly one request, the first
// one, 0.3 seconds in, because the first browse iteration read the list while the last seeded article was still in
// that window. That is the app's defect, but it is triggered by the test's own set-up, so the set-up waits until the
// app can serve what it just wrote. Later requests, from the write scenario, are left exposed on purpose: if the
// window opens there, it is a real finding and the correctness thresholds will say so.
function waitUntilSeedIsReadable(username: string): void {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const list = http.get(`${BASE_URL}/api/articles?limit=10&offset=0`);
    const mine = http.get(`${BASE_URL}/api/articles?author=${username}&limit=${SEED_ARTICLES}`);
    const count = mine.status === 200 ? (mine.json('articlesCount') as number) : -1;
    if (list.status === 200 && count === SEED_ARTICLES) {
      console.log(`setup: seeded articles readable after ${attempt} extra checks`);
      return;
    }
    sleep(0.1);
  }
  fail(`setup: ${SEED_ARTICLES} seeded articles were not readable after 10 seconds`);
}

// What a reader does: the list, then an article, then its comments.
export function browse(data: SetupData): void {
  const list = http.get(`${BASE_URL}/api/articles?limit=10&offset=0`, { tags: { endpoint: 'articles_list' } });
  check(list, { 'list returned 200': (r) => expectStatus('GET /api/articles', r, [200]) });

  const slug = data.slugs[Math.floor(Math.random() * data.slugs.length)];
  if (slug === undefined) {
    fail('browse: no seeded slug available');
  }

  const article = http.get(`${BASE_URL}/api/articles/${slug}`, { tags: { endpoint: 'article' } });
  check(article, { 'article returned 200': (r) => expectStatus(`GET /api/articles/${slug}`, r, [200]) });

  const comments = http.get(`${BASE_URL}/api/articles/${slug}/comments`, { tags: { endpoint: 'comments' } });
  check(comments, { 'comments returned 200': (r) => expectStatus(`GET /api/articles/${slug}/comments`, r, [200]) });

  sleep(0.5);
}

// A write at a much lower rate, so a regression on the write path is visible without flooding the database.
export function write(data: SetupData): void {
  const article = {
    title: `Perf write ${unique()}`,
    description: 'written during the load test',
    body: 'Body written during the load test.',
    tagList: ['perf'],
  };
  const created = http.post(`${BASE_URL}/api/articles`, JSON.stringify({ article }), {
    headers: { ...JSON_HEADERS, Authorization: `Token ${data.token}` },
    tags: { endpoint: 'create_article' },
  });
  check(created, { 'create returned 200 or 201': (r) => expectStatus('POST /api/articles', r, [200, 201]) });
}

// Writes the machine readable summary for the CI artifact and keeps a short human summary on stdout.
export function handleSummary(data: SummaryData): Record<string, string> {
  const line = (name: string): string => {
    const values = data.metrics[name]?.values;
    if (values === undefined) return `${name}: not recorded`;
    const parts = Object.entries(values)
      .map(([key, value]) => `${key}=${Number(value).toFixed(2)}`)
      .join(' ');
    return `${name}: ${parts}`;
  };
  // startsWith, not equality, so the per-endpoint sub-metrics are printed too. Run 42481092609 counted one failed
  // request in 762 and the printed summary could not say which endpoint, because `http_req_failed{endpoint:...}`
  // did not match an equality test.
  const names = Object.keys(data.metrics).filter(
    (name) =>
      name.startsWith('http_req_duration') ||
      name.startsWith('http_req_failed') ||
      name.startsWith('checks') ||
      name === 'http_reqs' ||
      name === 'dropped_iterations',
  );
  const text = ['', 'Load test summary (see the uploaded summary.json for everything):', ...names.map(line), ''].join(
    '\n',
  );
  return {
    'perf/results/summary.json': JSON.stringify(data, null, 2),
    stdout: text,
  };
}
