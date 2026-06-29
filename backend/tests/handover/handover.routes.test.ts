import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/db/client';

describe('Handover routes (/api/handover)', () => {
  beforeEach(async () => {
    await prisma.assetReference.deleteMany();
    await prisma.trustedContact.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('returns 200 with an empty handover view when no data exists', async () => {
    const app = createApp();

    const res = await request(app).get('/api/handover');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.contacts).toEqual([]);
    expect(res.body.data.locations).toEqual([]);
    expect(res.body.data.steps).toEqual([]);
  });

  it('assembles contacts and locations end-to-end without leaking sensitive detail', async () => {
    const app = createApp();

    await request(app).post('/api/trusted-contacts').send({
      name: 'Imran Rahman',
      relation: 'SPOUSE',
      role: 'PRIMARY',
      phone: '+60123456789'
    });
    await request(app).post('/api/trusted-contacts').send({
      name: 'Sara Abdullah',
      relation: 'SIBLING',
      role: 'BACKUP',
      phone: '+60132221188'
    });

    await request(app).post('/api/asset-references').send({
      name: 'Maybank — main account',
      category: 'BANK',
      locationHint: '▸ Drive ▸ Family ▸ Banking',
      detail: 'AccountNo SENSITIVE-ACCT-XYZ balance RM250000'
    });
    await request(app).post('/api/asset-references').send({
      name: 'DBS Singapore account',
      category: 'BANK'
    });

    const res = await request(app).get('/api/handover');

    expect(res.status).toBe(200);
    expect(res.body.data.contacts.map((c: { name: string }) => c.name)).toEqual([
      'Imran Rahman',
      'Sara Abdullah'
    ]);
    expect(res.body.data.summary).toEqual({
      contactCount: 2,
      locationCount: 2,
      documentedCount: 1
    });
    expect(res.body.data.steps.length).toBeGreaterThan(0);
    // The sensitive asset detail must never appear in the handover payload.
    expect(JSON.stringify(res.body)).not.toContain('SENSITIVE-ACCT-XYZ');
    expect(JSON.stringify(res.body)).not.toContain('250000');
  });
});
