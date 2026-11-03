# Test conventions for this repo

Read this before writing or changing a test. It is plain text for people and for agents.

- Use the suite's fixtures from `src/fixtures`: `test`, `authedTest`, `expect`. `authedTest` starts the browser logged in as `workerUser`; `otherUser` is a second user; `api` is the typed API client.
- Create test data through the API client (`api.createArticle`, `api.addComment`), not by clicking through the UI. Use the builders in `src/data/builders.ts` for unique titles and bodies. Do not build unique values from `Date.now()`.
- Use the page objects in `src/pages` and the components in `src/components`. If a locator is needed in more than one test, add it to a page object. Page objects have no assertions; tests do.
- Locators: prefer role, label, placeholder, then text. Name the reason in a comment when a CSS selector is the only choice. The app has no test ids.
- Every locator must match one element. If it matches two, narrow it; do not add `.first()` or `.last()` to make a strict-mode error go away unless you say why.
- Assertions are web-first (`await expect(locator).toBeVisible()`). No `waitForTimeout`, no `networkidle`, no `force: true`.
- Assert only on data the test created. Never assert on shared lists such as the global feed, which shows only the newest 3 articles of all users.
- Each test is independent: it creates what it needs and does not rely on another test or on an empty database.
- Run the test you wrote against the running app before you hand it back. A test that was never run does not count.
- Never skip, `test.fixme`, or loosen a test to make it pass. If the app looks wrong, report it and leave the test asserting the correct behaviour.
- The app shows a browser confirm dialog before deleting: accept it explicitly.
- Hash routing: pages are at `/#/...`.
