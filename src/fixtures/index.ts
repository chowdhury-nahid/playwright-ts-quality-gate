import { test as base, request as pwRequest, expect } from '@playwright/test';
import { ConduitApi } from '../api/client';
import type { User } from '../api/types';
import { BASE_URL } from '../config';
import { buildUser } from '../data/builders';

type WorkerUser = User & { password: string };

export const test = base.extend<{ api: ConduitApi }>({
  api: async ({ request }, use) => {
    await use(new ConduitApi(request));
  },
});

export const authedTest = test.extend<object, { workerUser: WorkerUser }>({
  // One user per worker, created through the API (no UI login), so parallel workers never share state.
  workerUser: [
    async ({}, use) => {
      const request = await pwRequest.newContext({ baseURL: BASE_URL });
      const input = buildUser();
      const user = await new ConduitApi(request).register(input);
      await request.dispose();
      await use({ ...user, password: input.password });
    },
    { scope: 'worker' },
  ],

  // The app keeps its login in localStorage under "loggedUser"; seed it so `page` starts logged in.
  storageState: async ({ workerUser }, use) => {
    await use({
      cookies: [],
      origins: [
        {
          origin: new URL(BASE_URL).origin,
          localStorage: [
            {
              name: 'loggedUser',
              value: JSON.stringify({
                headers: { Authorization: `Token ${workerUser.token}` },
                isAuth: true,
                loggedUser: workerUser,
              }),
            },
          ],
        },
      ],
    });
  },
});

export { expect };
