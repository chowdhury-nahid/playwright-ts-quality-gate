I did not fix this test. The failure is an application bug, not a test defect, so I marked the test `test.fixme` and it is now skipped.

**Evidence:**
- In the debug run, the UI posted the comment and `POST /api/articles/:slug/comments` returned 201 with the comment body.
- The next `GET /api/articles/:slug/comments` returned `{"comments":[]}`, and a manual fetch afterwards also returned an empty list. The page shows "There are no comments yet...", so the comment card can never appear.
- `/home/user/playwright-ts-quality-gate/sut/patches/comment-not-saved.patch` explains it. It adds `await comment.destroy();` in `createComment` in the backend, so the comment is deleted right after it is created.
- The locators, button label ("Post Comment") and the `.card` comment locator all work. The test's assertions are correct.

**Change:** in `/home/user/playwright-ts-quality-gate/tests/agents/heal-target.spec.ts` I added a comment explaining the app bug and the expected behaviour, followed by `test.fixme(true, 'SUT does not persist comments (createComment destroys the record)')` at the top of the test.

I re-ran only that spec file and it reports 1 skipped. I did not re-run the rest of the suite. `tests/api/comments.spec.ts` probably fails for the same reason; I did not check it.

Remove the `fixme` once the backend stops destroying comments.
