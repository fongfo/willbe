import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/db/client';

describe('Readiness routes (/api/readiness)', () => {
  beforeEach(async () => {
    await prisma.reviewSetting.deleteMany();
    await prisma.assetReference.deleteMany();
    await prisma.trustedContact.deleteMany();
    await prisma.familyMember.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('returns 200 with a score and the full gap list for an empty plan', async () => {
    const app = createApp();

    const res = await request(app).get('/api/readiness');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.score).toBe('number');
    expect(Array.isArray(res.body.data.gaps)).toBe(true);
    expect(res.body.data.gaps.length).toBeGreaterThan(0);
    expect(res.body.data.gaps[0]).toHaveProperty('code');
    expect(res.body.data.gaps[0]).toHaveProperty('category');
    expect(res.body.data.gaps[0]).toHaveProperty('scoreImpact');
  });

  it('reflects saved data end-to-end: a fully prepared plan scores 96 with no gaps', async () => {
    const app = createApp();

    await request(app)
      .post('/api/family-members')
      .send({ name: 'Mei Ling', relation: 'SELF' });
    await request(app)
      .post('/api/family-members')
      .send({ name: 'Wei', relation: 'SPOUSE' });

    await request(app).post('/api/trusted-contacts').send({
      name: 'Jane Tan',
      relation: 'OTHER',
      role: 'PRIMARY',
      phone: '+60123456789',
      detail: 'Family lawyer'
    });
    await request(app).post('/api/trusted-contacts').send({
      name: 'Ahmad',
      relation: 'SIBLING',
      role: 'BACKUP',
      phone: '+60129999999'
    });

    await request(app)
      .post('/api/asset-references')
      .send({ name: 'Maybank', category: 'BANK', detail: 'Beneficiary nominated' });
    await request(app).post('/api/asset-references').send({ name: 'Condo', category: 'PROPERTY' });
    await request(app)
      .post('/api/asset-references')
      .send({ name: 'Prudential', category: 'INSURANCE' });

    await request(app)
      .put('/api/review-settings')
      .send({ checkInFrequency: 'EVERY_6_MONTHS', connectedProviders: ['GOOGLE_DRIVE'] });

    const res = await request(app).get('/api/readiness');

    expect(res.status).toBe(200);
    expect(res.body.data.gaps).toEqual([]);
    expect(res.body.data.score).toBe(96);
  });
});
