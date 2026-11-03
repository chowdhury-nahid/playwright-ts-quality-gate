# Article Comments Test Plan

## Application Overview

Conduit (RealWorld) article comments: posting a comment on an article page and deleting your own comment. Explored at http://localhost:3001/#/article/<slug> as a logged-in user. Comment form: textbox "Write a comment..." and button "Post Comment". Empty state text: "There are no comments yet...". A posted comment renders in a .card with the text, author link, date and an unnamed icon-only delete button; deleting opens a confirm dialog "Want to delete the comment?". Posting an empty comment does nothing. Each test creates its own article (via API helper or editor) and uses the authed worker user; start from a fresh article with no comments.

## Test Scenarios

### 1. Article comments

**Seed:** `tests/seed.spec.ts`

#### 1.1. Empty article shows no-comments message

**File:** `tests/agents/article-comments.spec.ts`

**Steps:**
  1. Create a new article via API and open /#/article/<slug>
    - expect: Text 'There are no comments yet...' is visible
    - expect: Textbox 'Write a comment...' and button 'Post Comment' are visible

#### 1.2. Logged-in user can post a comment

**File:** `tests/agents/article-comments.spec.ts`

**Steps:**
  1. Open a fresh article, fill 'Write a comment...' with a unique text, click 'Post Comment'
    - expect: The comment text appears in a comment card with the author's username
    - expect: 'There are no comments yet...' disappears
    - expect: The comment textbox is cleared

#### 1.3. Multiple comments are all listed

**File:** `tests/agents/article-comments.spec.ts`

**Steps:**
  1. Post two comments with different unique texts
    - expect: Both comments are visible on the page

#### 1.4. Posted comment persists after reload

**File:** `tests/agents/article-comments.spec.ts`

**Steps:**
  1. Post a comment, then reload the page
    - expect: The comment is still visible

#### 1.5. Empty comment is not posted

**File:** `tests/agents/article-comments.spec.ts`

**Steps:**
  1. On a fresh article click 'Post Comment' with an empty textbox
    - expect: No comment card is added
    - expect: 'There are no comments yet...' remains visible

#### 1.6. User can delete their own comment

**File:** `tests/agents/article-comments.spec.ts`

**Steps:**
  1. Post a comment, click its icon-only delete button, accept the confirm dialog 'Want to delete the comment?'
    - expect: The comment disappears
    - expect: 'There are no comments yet...' is shown again

#### 1.7. Dismissing the delete confirmation keeps the comment

**File:** `tests/agents/article-comments.spec.ts`

**Steps:**
  1. Post a comment, click its delete button, dismiss the confirm dialog
    - expect: The comment remains visible

#### 1.8. Other users' comments have no delete button

**File:** `tests/agents/article-comments.spec.ts`

**Steps:**
  1. Create a comment on an article via API as a second user, then open the article as the worker user
    - expect: The comment is visible
    - expect: The comment card has no delete button
