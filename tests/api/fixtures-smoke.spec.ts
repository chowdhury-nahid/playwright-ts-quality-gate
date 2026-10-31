import { authedTest as test, expect } from '../../src/fixtures';

test('the worker user can create an article through the api fixture', async ({ api, workerUser }) => {
  const created = await api.createArticle(workerUser.token, {
    title: `Fixture smoke ${Date.now()}`,
    description: 'smoke',
    body: 'smoke',
    tagList: [],
  });

  expect(created.author.username).toBe(workerUser.username);
});
