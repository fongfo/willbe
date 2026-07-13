import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/db/client';

describe('authenticated plan routes', () => {
  beforeEach(async () => {
    await prisma.reviewSetting.deleteMany();
    await prisma.assetReference.deleteMany();
    await prisma.trustedContact.deleteMany();
    await prisma.familyMember.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it.each([
    '/api/family-members',
    '/api/trusted-contacts',
    '/api/asset-references',
    '/api/review-settings',
    '/api/readiness',
    '/api/handover'
  ])('returns 401 for anonymous GET %s', async (path) => {
    const app = createApp();

    const res = await request(app).get(path);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, error: 'Missing access token' });
  });
});

