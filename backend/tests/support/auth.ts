import type { Test } from 'supertest';

export const TEST_ACCESS_TOKEN = 'dev:aisyah.rahman%40gmail.com:Aisyah%20Rahman';
export const OTHER_ACCESS_TOKEN = 'dev:other.user%40gmail.com:Other%20User';

export function withAuth(test: Test, token = TEST_ACCESS_TOKEN): Test {
  return test.set('Authorization', `Bearer ${token}`);
}

