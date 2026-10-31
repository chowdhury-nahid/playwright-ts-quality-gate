# Findings

Defects found in the app under test (TonyMckes/conduit-realworld-example-app at the commit pinned in `sut/.env`)
while writing this suite. Each is covered by an expected-failure test in `tests/api/known-defects.spec.ts`: the
test asserts the correct behaviour, is marked `test.fail()`, and will turn the build red on the day the app is fixed.
The reference is the RealWorld API specification:
https://realworld-docs.netlify.app/specifications/backend/endpoints/

These are findings about the sample app, not about this repo's tests.

| Id | Finding | Evidence | Severity (my judgement) |
|---|---|---|---|
| F1 | Article lists return 3 articles by default; the spec says the default `limit` is 20. | `GET /api/articles?author=<user>` returns 3 of 5 | Low. Clients that do not pass `limit` silently see a truncated list. |
| F2 | `offset` behaves as a page number, not a count of articles to skip; the spec says offset skips that many articles. | With `limit=2`, `offset=1` returns articles 3 and 4 instead of 2 and 3; `offset=2` returns article 5 | Medium. A client paging by record offset skips and misses data. |
| F3 | A username that is already taken is accepted (201), creating a second user with the same username. A duplicate email is rejected (422). The spec page I retrieved does not state username uniqueness, so this is an inconsistency, not a confirmed violation. | `POST /api/users` twice with the same username | Medium. Profile URLs and `?author=` lookups become ambiguous. |
| F4 | `PUT /api/user` without a `password` returns 500 `data and salt arguments required`. The spec lists email, username, password, image, bio as accepted fields and marks none required. | `PUT /api/user` with `{"user":{"bio":"x"}}` | High for a profile page: editing only your bio crashes. A 500 on valid input is a defect whatever the spec says. |

## Reproduce

Start the app (`npm run sut:local`), register a user to get a token, then:

    curl -s -X PUT localhost:3001/api/user -H 'content-type: application/json' \
      -H "Authorization: Token $TOKEN" -d '{"user":{"bio":"x"}}'

returns `{"errors":{"body":["data and salt arguments required"]}}` with status 500 (F4). The other three are
reproduced by the tests themselves: remove `.fail` from a test and run it.

## Behaviour that is not a defect but surprises test authors

- The app uses hash routing (`/#/login`); `/login` returns a JSON 404.
- Deleting an article asks for confirmation through a browser `confirm` dialog. Playwright dismisses dialogs by
  default, so a test must accept it explicitly.
- Both feeds show 3 articles per page by default (see F1), so a UI test that expects a card must make sure the
  article is among the newest.
