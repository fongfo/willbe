import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/db/client';

describe('Auth routes (/api/auth)', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('returns 401 when no token is provided', async () => {
    const app = createApp();

    const res = await request(app).post('/api/auth/session').send({});

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 when the bearer token is invalid', async () => {
    const app = createApp();

    const res = await request(app)
      .post('/api/auth/session')
      .set('Authorization', 'Bearer invalid')
      .send({});

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('upserts a user session from a valid local embedded-wallet token', async () => {
    const app = createApp();

    const res = await request(app)
      .post('/api/auth/session')
      .set('Authorization', 'Bearer dev:aisyah.rahman%40gmail.com:Aisyah%20Rahman')
      .send({});
    const users = await prisma.user.findMany();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('aisyah.rahman@gmail.com');
    expect(res.body.data.user.walletAddress).toMatch(/^0x[a-f0-9]{40}$/);
    expect(users).toHaveLength(1);
  });
});
