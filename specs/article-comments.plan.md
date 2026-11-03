# Article comments test plan

## Application Overview

Conduit (RealWorld) article page comments at /#/article/<slug>. Scope: posting a comment and deleting your own comment. Observed: textbox "Write a comment...", button "Post Comment"; comments render as plain `.card` elements (no role) with a nameless icon button for delete inside the card footer, only for the author's own comments; delete shows a confirm dialog "Want to delete the comment?"; empty list shows "There are no comments yet...". Tests use authedTest (logged in as workerUser), create the article and any seed comments through the API, and use builders for unique text. Dialogs must be accepted explicitly.

## Test Scenarios

### 1. Article comments

**Seed:** `tests/seed.spec.ts`

#### 1.1. a logged-in user can post a comment on an article

**File:** `tests/agents/article-comments.spec.ts`

**Steps:**
  1. Create an article via api.createArticle as workerUser; open /#/article/<slug>
    - expect: Comment form is visible with 'Write a comment...' textbox and 'Post Comment' button
  2. Fill the textbox with a unique comment body and click 'Post Comment'
    - expect: A comment card containing the text appears and is visible
    - expect: The textbox is cleared
    - expect: api.listComments(slug) contains exactly that comment body by workerUser

#### 1.2. a posted comment persists after reload

**File:** `tests/agents/article-comments.spec.ts`

**Steps:**
  1. Create article via API, post a comment through the UI, reload the page
    - expect: The comment card is still visible after reload

#### 1.3. posting an empty comment does not add a comment

**File:** `tests/agents/article-comments.spec.ts`

**Steps:**
  1. Create article via API, open it, click 'Post Comment' with empty textbox (negative)
    - expect: 'There are no comments yet...' remains visible or no comment card appears
    - expect: api.listComments(slug) is empty. If the app adds an empty comment, report it as a defect and keep the assertion

#### 1.4. a user can delete their own comment

**File:** `tests/agents/article-comments.spec.ts`

**Steps:**
  1. Create article and a comment by workerUser via api.addComment; open the article
    - expect: Comment card visible with a delete (icon) button
  2. Register dialog handler that accepts, click the delete button in the comment card
    - expect: Confirm message is 'Want to delete the comment?'
    - expect: Comment card disappears
    - expect: api.listComments(slug) no longer contains it

#### 1.5. dismissing the delete confirmation keeps the comment

**File:** `tests/agents/article-comments.spec.ts`

**Steps:**
  1. Same setup as delete; dismiss the confirm dialog explicitly
    - expect: Comment card remains visible
    - expect: The comment still exists via API

#### 1.6. another user's comment has no delete button

**File:** `tests/agents/article-comments.spec.ts`

**Steps:**
  1. Create article as workerUser; otherUser (fixture) adds a comment via api.addComment; open the article as workerUser
    - expect: The other user's comment card is visible
    - expect: It contains no button, so it cannot be deleted by workerUser

#### 1.7. deleting one comment leaves other comments intact

**File:** `tests/agents/article-comments.spec.ts`

**Steps:**
  1. Create article, add two comments by workerUser via API, open article, delete the first through the UI
    - expect: Deleted comment gone, the second still visible
