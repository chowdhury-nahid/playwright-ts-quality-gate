import { test, expect } from '@playwright/test';
import { ConduitApi } from '../../src/api/client';
import { buildArticle, buildUser } from '../../src/data/builders';

// TEMPORARY diagnostic, not part of the suite, removed before this pull request merges.
//
// Attempt 1 (40 sequential create-then-read pairs) passed in CI, so the window is rarer than 1 in 40. This attempt
// mirrors the flaky test exactly, 10 at a time: register an author, create one article, read that author's list the
// moment the create answers. If the suspected cause is right, contention on the database connection pool is what
// widens the gap between the create answering and the article's author being written, so ten at once should find it.
// Each miss records what the article looked like when read by slug at that moment.
test('race probe: a new author\'s first article is at once in their list, under contention', async ({ request }) => {
  test.setTimeout(4 * 60 * 1000);
  const api = new ConduitApi(request);

  const misses: { slug: string; round: number; listSize: number; authorOfSingle: unknown }[] = [];
  let attempts = 0;

  for (let round = 0; round < 30; round += 1) {
    await Promise.all(
      Array.from({ length: 10 }, async () => {
        const author = await api.register(buildUser());
        const created = await api.createArticle(author.token, buildArticle());
        const { articles } = await api.searchArticles({ author: author.username });
        attempts += 1;
        const hit = articles.map((a) => a.slug).includes(created.slug);
        const single = await api.send('GET', `/api/articles/${created.slug}`);
        const body = (await single.json()) as { article?: { author?: unknown } };
        misses.push(
          ...(hit
            ? []
            : [{ slug: created.slug, round, listSize: articles.length, authorOfSingle: body.article?.author ?? null }]),
        );
      }),
    );
  }

  expect(misses, `attempts: ${attempts}, misses: ${JSON.stringify(misses, null, 2)}`).toHaveLength(0);
});
