import type { NewArticle, NewUser } from '../api/types';

let sequence = 0;

/** Unique across tests, workers and runs: time + process id + counter. */
const unique = (): string =>
  `${Date.now().toString(36)}${process.pid.toString(36)}${(sequence++).toString(36)}`;

export const buildUser = (overrides: Partial<NewUser> = {}): NewUser => {
  const id = unique();
  return {
    username: `user${id}`,
    email: `user${id}@example.test`,
    password: 'Passw0rd!123',
    ...overrides,
  };
};

export const buildArticle = (overrides: Partial<NewArticle> = {}): NewArticle => {
  const id = unique();
  return {
    title: `Article ${id}`,
    description: `About ${id}`,
    body: `Body of ${id}`,
    tagList: ['qa'],
    ...overrides,
  };
};

export const buildTag = (): string => `tag${unique()}`;
