// Load test for the app under test's read path, plus a low rate write.
//
// Shape: a fixed arrival rate, not a ramp to failure. The app serves the article list with a query per article,
// so throughput is flat and latency rises in proportion to concurrency. A gate that pushes the app past that point
// measures a cliff that moves between runs; a fixed rate measures latency at a load the app can serve.
//
// Thresholds live in `options.thresholds` and come from measured CI runs, recorded in perf/README.md. Never guess one.
import http from 'k6/http';
import { check, fail, sleep } from 'k6';
import type { Options } from 'k6/options';

const BASE_URL = __ENV.PERF_BASE_URL ?? 'http://localhost:3001';
const SEED_ARTICLES = Number(__ENV.PERF_SEED_ARTICLES ?? '10');
const RATE = Number(__ENV.PERF_RATE ?? '4');
const DURATION = __ENV.PERF_DURATION ?? '60s';
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
      preAllocatedVUs: 10,
      maxVUs: 40,
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
  // Discovery bounds, not budgets. k6 reports a tagged sub-metric in the end-of-test summary only if that
  // sub-metric carries a threshold, and the first run proved it: the summary held the overall duration and nothing
  // per endpoint. So every endpoint gets a bound that cannot fail, which makes its numbers appear. Measured budgets
  // replace these once three runs at the chosen rate exist, and then they are allowed to fail.
  thresholds: {
    'http_req_duration{endpoint:articles_list}': ['p(95)<60000'],
    'http_req_duration{endpoint:article}': ['p(95)<60000'],
    'http_req_duration{endpoint:comments}': ['p(95)<60000'],
    'http_req_duration{endpoint:create_article}': ['p(95)<60000'],
    'http_req_failed{endpoint:articles_list}': ['rate<=1'],
    'http_req_failed{endpoint:article}': ['rate<=1'],
    'http_req_failed{endpoint:comments}': ['rate<=1'],
    'http_req_failed{endpoint:create_article}': ['rate<=1'],
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
  return { token, slugs };
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
  const names = Object.keys(data.metrics).filter(
    (name) =>
      name.startsWith('http_req_duration') ||
      name === 'http_reqs' ||
      name === 'http_req_failed' ||
      name === 'checks' ||
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
