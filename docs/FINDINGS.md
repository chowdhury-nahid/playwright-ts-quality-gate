# Findings

Defects found in the app under test (TonyMckes/conduit-realworld-example-app at the commit pinned in `sut/.env`)
while writing this suite. Each of F1 to F4 is covered by an expected-failure test in
`tests/api/known-defects.spec.ts`: the test asserts the correct behaviour, is marked `test.fail()`, and will turn the
build red on the day the app is fixed. F5 is intermittent and F6 is about speed, so each is handled differently; see
its row.
The reference is the RealWorld API specification:
https://realworld-docs.netlify.app/specifications/backend/endpoints/

These are findings about the sample app, not about this repo's tests.

| Id | Finding | Evidence | Severity (my judgement) |
|---|---|---|---|
| F1 | Article lists return 3 articles by default; the spec says the default `limit` is 20. | `GET /api/articles?author=<user>` returns 3 of 5 | Low. Clients that do not pass `limit` silently see a truncated list. |
| F2 | `offset` behaves as a page number, not a count of articles to skip; the spec says offset skips that many articles. | With `limit=2`, `offset=1` returns articles 3 and 4 instead of 2 and 3; `offset=2` returns article 5 | Medium. A client paging by record offset skips and misses data. |
| F3 | A username that is already taken is accepted (201), creating a second user with the same username. A duplicate email is rejected (422). The spec page I retrieved does not state username uniqueness, so this is an inconsistency, not a confirmed violation. | `POST /api/users` twice with the same username | Medium. Profile URLs and `?author=` lookups become ambiguous. |
| F4 | `PUT /api/user` without a `password` returns 500 `data and salt arguments required`. The spec lists email, username, password, image, bio as accepted fields and marks none required. | `PUT /api/user` with `{"user":{"bio":"x"}}` | High for a profile page: editing only your bio crashes. A 500 on valid input is a defect whatever the spec says. |
| F5 | A newly created article has no author for a few milliseconds. `createArticle` creates the article, adds its tags, and only then writes the author with `article.setAuthor(loggedUser)`, without waiting for that write to finish. While it is pending, the list filtered by author leaves the article out (it joins on the author), and the plain list returns a 500, `toAppend.hasFollower is not a function`, because the follower helper treats an article without an author as if it were a user. Both clear within a second. | Local experiment: with the author write delayed by 800 ms in a local copy of the app, one create (201) was followed at once by the plain list returning that 500 and the author list returning no articles, and 1.5 seconds later both were fine. In CI: run 42478221401 (the author list empty right after a successful create, passed on retry); and the load test's failed list reads carry the same message and stack trace (`appendFollowers`, `allArticles`): 0 or 1 of about 960 list reads at 16 iterations a second, 10 of 1,921 at 32, 138 of 2,360 at 48 and 195 of 2,487 at 64. Two probes (40 sequential and 300 concurrent create-then-read pairs, runs 42478893058 and 42479399548) did not catch it. | Medium, and it grows with load. A client that creates an article and then shows that author's list can miss it, and anyone loading the article list in that gap gets an error. The window was only widened locally; that the CI failures are this window is inferred from the identical error and stack trace. No expected-failure test, because the behaviour is intermittent: `tests/api/articles.spec.ts` polls the author list, and the load test tolerates under 1 percent of list reads failing, a tolerance to remove when this is fixed. |
| F6 | The cost of `GET /api/articles` grows with the number of articles returned. For every article in the page the controller runs six more queries, one after another (its tags, its author, whether the viewer follows the author, how many follow, whether the viewer favourited it, how many favourited it), so a page of 10 costs about 60 queries on top of the page query. | Locally, one request at a time on SQLite: about 49 ms at `limit=10` against about 8 ms at `limit=1`. In CI at 16 iterations a second (run 42550827057): list average 30.75 ms (p95 43.06) against 4.49 ms for one article and 1.70 ms for its comments. Under saturation (run 42549924216, 48 a second) list p95 was 1,965 ms and single article p95 215 ms. The six-queries claim is from the app's source (`allArticles`, `appendFollowers`, `appendFavorites`), not from a query log. | Medium. The default page in the UI asks for 10 articles, so every reader pays it, and it is the first thing to give way under load. No expected-failure test, since a latency assertion in the functional suite would be flaky: the load test's list budget is the check. |

## Reproduce

Start the app (`npm run sut:local`), register a user to get a token, then:

    curl -s -X PUT localhost:3001/api/user -H 'content-type: application/json' \
      -H "Authorization: Token $TOKEN" -d '{"user":{"bio":"x"}}'

returns `{"errors":{"body":["data and salt arguments required"]}}` with status 500 (F4). F1 to F3 are
reproduced by the tests themselves: remove `.fail` from a test and run it.

F5 is a gap of a few milliseconds, so the local copy of the app has to be slowed to see it. Delay the author write,
restart the app (`npm run sut:local:stop`, then `npm run sut:local`), register a user to get `$TOKEN` and `$USERNAME`,
create an article and read the lists at once:

    F=.sut-local/app/backend/controllers/articles.js
    sed -i 's/article.setAuthor(loggedUser);/setTimeout(() => article.setAuthor(loggedUser), 800);/' $F

    curl -s -X POST localhost:3001/api/articles -H 'content-type: application/json' \
      -H "Authorization: Token $TOKEN" -d '{"article":{"title":"probe","description":"d","body":"b","tagList":[]}}'
    curl -s localhost:3001/api/articles                      # 500: toAppend.hasFollower is not a function
    curl -s "localhost:3001/api/articles?author=$USERNAME"   # {"articles":[],"articlesCount":0}

Both calls are normal again about a second later. Undo the change with the reverse `sed`, then restart:

    sed -i 's/setTimeout(() => article.setAuthor(loggedUser), 800);/article.setAuthor(loggedUser);/' $F

This only slows the app down to make an existing gap visible; it does not add a defect. The patch is applied to the
local checkout in `.sut-local/` and never committed.

## Behaviour that is not a defect but surprises test authors

- The app uses hash routing (`/#/login`); `/login` returns a JSON 404.
- Deleting an article asks for confirmation through a browser `confirm` dialog. Playwright dismisses dialogs by
  default, so a test must accept it explicitly.
- Both feeds show 3 articles per page by default (see F1), so a UI test that expects a card must make sure the
  article is among the newest.
