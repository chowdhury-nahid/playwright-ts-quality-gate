import type { Page } from '@playwright/test';
import type { NewArticle } from '../api/types';

export class EditorPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/#/editor');
  }

  async publish(article: NewArticle): Promise<void> {
    await this.page.getByPlaceholder('Article Title').fill(article.title);
    await this.page.getByPlaceholder("What's this article about?").fill(article.description);
    await this.page.getByPlaceholder('Write your article (in markdown)').fill(article.body);
    // The tags field is a plain text input split on commas and spaces; Enter submits the form.
    if (article.tagList.length > 0) {
      await this.page.getByPlaceholder('Enter tags').fill(article.tagList.join(','));
    }
    await this.page.getByRole('button', { name: 'Publish Article' }).click();
  }
}
