import { test, expect } from '@playwright/test';
import { ConduitApi } from '../../src/api/client';
import { buildArticle, buildUser } from '../../src/data/builders';

// TEMPORARY diagnostic, not part of the suite, removed before this pull request merges.
// It reproduces the race behind the flaky "appears in that author's article list" failure and says what the
// app's state is when the race is lost: whether the created article has an author yet.
test('race probe: a created article is at once visible in its author list', async ({ request }) => {
  const api = new ConduitApi(request);
  const author = await api.register(buildUser());

  const attempts: { slug: string; hit: boolean; authorOfSingle: unknown; singleStatus: number }[] = [];
  for (let i = 0; i < 40; i += 1) {
    const created = await api.createArticle(author.token, buildArticle());
    const { articles } = await api.searchArticles({ author: author.username, limit: 50 });
    const single = await api.send('GET', `/api/articles/${created.slug}`);
    const body = (await single.json()) as { article?: { author?: unknown } };
    attempts.push({
      slug: created.slug,
      hit: articles.map((a) => a.slug).includes(created.slug),
      authorOfSingle: body.article?.author ?? null,
      singleStatus: single.status(),
    });
  }

  const misses = attempts.filter((a) => !a.hit);
  expect(misses, `misses: ${JSON.stringify(misses, null, 2)}`).toHaveLength(0);
});
