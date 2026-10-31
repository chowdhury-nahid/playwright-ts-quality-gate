import { test, expect } from '@playwright/test';
import { ConduitApi } from '../../src/api/client';
import { buildUser } from '../../src/data/builders';

test.describe('auth API', () => {
  test('registering a user returns a token', async ({ request }) => {
    const api = new ConduitApi(request);
    const input = buildUser();

    const user = await api.register(input);

    expect(user.username).toBe(input.username);
    expect(user.email).toBe(input.email);
    expect(user.token).toBeTruthy();
  });

  test('a registered user can log in', async ({ request }) => {
    const api = new ConduitApi(request);
    const input = buildUser();
    await api.register(input);

    const user = await api.login({ email: input.email, password: input.password });

    expect(user.email).toBe(input.email);
    expect(user.token).toBeTruthy();
  });

  test('logging in with an unknown email is rejected', async ({ request }) => {
    const api = new ConduitApi(request);

    const res = await api.loginRaw({ email: 'nobody@example.test', password: 'Passw0rd!123' });

    expect(res.ok()).toBe(false);
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });
});
