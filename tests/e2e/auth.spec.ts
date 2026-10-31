import { test, expect } from '../../src/fixtures';
import { buildUser } from '../../src/data/builders';
import { Navbar } from '../../src/components/navbar';
import { LoginPage } from '../../src/pages/login-page';
import { SignUpPage } from '../../src/pages/sign-up-page';

test.describe('authentication @smoke', () => {
  test('a new visitor can sign up and lands logged in', async ({ page }) => {
    const user = buildUser();
    const signUp = new SignUpPage(page);
    const navbar = new Navbar(page);

    await signUp.goto();
    await signUp.signUp(user);

    await expect(navbar.newArticleLink).toBeVisible();
    await expect(navbar.userMenu(user.username)).toBeVisible();
  });

  test('an existing user can log in', async ({ page, api }) => {
    const user = buildUser();
    await api.register(user);
    const login = new LoginPage(page);
    const navbar = new Navbar(page);

    await login.goto();
    await login.login({ email: user.email, password: user.password });

    await expect(navbar.userMenu(user.username)).toBeVisible();
  });

  test('logging in with an unknown email shows an error', async ({ page }) => {
    const login = new LoginPage(page);
    const navbar = new Navbar(page);

    await login.goto();
    await login.login({ email: 'nobody@example.test', password: 'Passw0rd!123' });

    await expect(login.errorMessage).toContainText(/not found/i);
    await expect(navbar.loginLink).toBeVisible();
  });
});
