import type { Locator, Page } from '@playwright/test';

export class Navbar {
  private readonly nav: Locator;

  constructor(private readonly page: Page) {
    this.nav = page.getByRole('navigation');
  }

  get newArticleLink(): Locator {
    return this.nav.getByRole('link', { name: 'New Article' });
  }

  get loginLink(): Locator {
    return this.nav.getByRole('link', { name: 'Login' });
  }

  get signUpLink(): Locator {
    return this.nav.getByRole('link', { name: 'Sign up' });
  }

  /** The dropdown toggle shows the username; it is a div, so match by text. */
  userMenu(username: string): Locator {
    return this.nav.getByText(username, { exact: true }).describe(`user menu of "${username}"`);
  }

  async logout(username: string): Promise<void> {
    await this.userMenu(username).click();
    await this.nav.getByText('Logout').click();
  }
}
