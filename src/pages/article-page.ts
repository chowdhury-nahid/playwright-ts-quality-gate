import type { Locator, Page } from '@playwright/test';

export class ArticlePage {
  constructor(private readonly page: Page) {}

  async goto(slug: string): Promise<void> {
    await this.page.goto(`/#/article/${slug}`);
  }

  heading(title: string): Locator {
    return this.page.getByRole('heading', { level: 1, name: title });
  }

  /** Comments render in plain card elements; the app gives them no role or label. */
  comment(text: string): Locator {
    return this.page.locator('.card').filter({ hasText: text });
  }

  commentBox(): Locator {
    return this.page.getByRole('textbox', { name: 'Write a comment...' });
  }

  async postComment(text: string): Promise<void> {
    await this.commentBox().fill(text);
    await this.page.getByRole('button', { name: 'Post Comment' }).click();
  }

  /** The app asks "Want to delete the comment?" with a browser confirm dialog. The delete control is an icon-only button with no accessible name and is the only button in a comment card, so it is found inside the card. Only the author's own comments have it. */
  async deleteComment(text: string): Promise<void> {
    this.page.once('dialog', (dialog) => void dialog.accept());
    await this.comment(text).getByRole('button').click();
  }

  /** The app asks "Want to delete the article?" with a browser confirm dialog; Playwright dismisses it unless accepted. The page shows the button twice (banner and footer of the article), both do the same, so the first is used. */
  async deleteArticle(): Promise<void> {
    this.page.once('dialog', (dialog) => void dialog.accept());
    await this.page.getByRole('button', { name: 'Delete Article' }).first().click();
  }
}
