import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/db/client';
import { OTHER_ACCESS_TOKEN, withAuth } from '../support/auth';

describe('Readiness routes (/api/readiness)', () => {
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

  it('returns 200 with a score and the full gap list for an empty plan', async () => {
    const app = createApp();

    const res = await withAuth(request(app).get('/api/readiness'));

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

    await withAuth(request(app).post('/api/family-members'))
      .send({ name: 'Mei Ling', relation: 'SELF' });
    await withAuth(request(app).post('/api/family-members'))
      .send({ name: 'Wei', relation: 'SPOUSE' });

    await withAuth(request(app).post('/api/trusted-contacts')).send({
      name: 'Jane Tan',
      relation: 'OTHER',
      role: 'PRIMARY',
      phone: '+60123456789',
      detail: 'Family lawyer'
    });
    await withAuth(request(app).post('/api/trusted-contacts')).send({
      name: 'Ahmad',
      relation: 'SIBLING',
      role: 'BACKUP',
      phone: '+60129999999'
    });

    await withAuth(request(app).post('/api/asset-references'))
      .send({ name: 'Maybank', category: 'BANK', detail: 'Beneficiary nominated' });
    await withAuth(request(app).post('/api/asset-references')).send({
      name: 'Condo',
      category: 'PROPERTY'
    });
    await withAuth(request(app).post('/api/asset-references'))
      .send({ name: 'Prudential', category: 'INSURANCE' });

    await withAuth(request(app).put('/api/review-settings'))
      .send({ checkInFrequency: 'EVERY_6_MONTHS', connectedProviders: ['GOOGLE_DRIVE'] });

    const res = await withAuth(request(app).get('/api/readiness'));

    expect(res.status).toBe(200);
    expect(res.body.data.gaps).toEqual([]);
    expect(res.body.data.score).toBe(96);
  });

  it('assesses only the authenticated user plan data', async () => {
    const app = createApp();

    await withAuth(request(app).post('/api/family-members')).send({
      name: 'Owner',
      relation: 'SELF'
    });
    await withAuth(request(app).post('/api/family-members'), OTHER_ACCESS_TOKEN).send({
      name: 'Other',
      relation: 'SELF'
    });
    await withAuth(request(app).post('/api/family-members'), OTHER_ACCESS_TOKEN).send({
      name: 'Other Spouse',
      relation: 'SPOUSE'
    });

    const owner = await withAuth(request(app).get('/api/readiness'));
    const other = await withAuth(request(app).get('/api/readiness'), OTHER_ACCESS_TOKEN);

    expect(owner.body.data.gaps.map((gap: { code: string }) => gap.code)).toContain(
      'ADD_FAMILY_MEMBER'
    );
    expect(other.body.data.gaps.map((gap: { code: string }) => gap.code)).not.toContain(
      'ADD_FAMILY_MEMBER'
    );
  });
});
