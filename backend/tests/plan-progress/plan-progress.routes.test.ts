import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/db/client';
import { OTHER_ACCESS_TOKEN, withAuth } from '../support/auth';

describe('Plan progress routes (/api/plan-progress)', () => {
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

  it('returns zero completed setup steps without exposing plan details', async () => {
    const app = createApp();

    const res = await withAuth(request(app).get('/api/plan-progress'));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: {
        completedSetupSteps: 0,
        hasFamilyMembers: false,
        hasTrustedContacts: false,
        hasAssetReferences: false,
        hasCheckInSetup: false
      }
    });
  });

  it('returns aggregate progress after setup data is saved', async () => {
    const app = createApp();

    await withAuth(request(app).post('/api/family-members'))
      .send({ name: 'Mei Ling', relation: 'SELF' });
    await withAuth(request(app).post('/api/trusted-contacts')).send({
      name: 'Jane Tan',
      relation: 'OTHER',
      role: 'PRIMARY',
      phone: '+60123456789'
    });
    await withAuth(request(app).post('/api/asset-references')).send({
      name: 'Maybank folder',
      category: 'BANK',
      locationHint: 'Home cabinet',
      detail: 'Should not appear in plan progress'
    });
    await withAuth(request(app).put('/api/review-settings')).send({
      checkInFrequency: 'EVERY_6_MONTHS',
      connectedProviders: ['GOOGLE_DRIVE']
    });

    const res = await withAuth(request(app).get('/api/plan-progress'));

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      completedSetupSteps: 4,
      hasFamilyMembers: true,
      hasTrustedContacts: true,
      hasAssetReferences: true,
      hasCheckInSetup: true
    });
    expect(JSON.stringify(res.body)).not.toContain('Mei Ling');
    expect(JSON.stringify(res.body)).not.toContain('Home cabinet');
    expect(JSON.stringify(res.body)).not.toContain('Should not appear');
  });

  it('assesses only the authenticated user plan progress', async () => {
    const app = createApp();

    await withAuth(request(app).post('/api/family-members'), OTHER_ACCESS_TOKEN).send({
      name: 'Other',
      relation: 'SELF'
    });

    const owner = await withAuth(request(app).get('/api/plan-progress'));
    const other = await withAuth(
      request(app).get('/api/plan-progress'),
      OTHER_ACCESS_TOKEN
    );

    expect(owner.body.data.completedSetupSteps).toBe(0);
    expect(other.body.data.completedSetupSteps).toBe(1);
  });
});
