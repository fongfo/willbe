import request from 'supertest';
import { createApp } from '../../src/app';

describe('Anchor routes (/api/anchors)', () => {
  const app = createApp();

  it('anchors a plan snapshot and returns only proof metadata', async () => {
    const res = await request(app)
      .post('/api/anchors')
      .send({
        ownerRef: 'routes-owner',
        snapshot: {
          familyMembers: [{ id: 'm1', relation: 'SPOUSE' }],
          assetReferences: [{ id: 'a1', category: 'BANK', locationHint: 'Dropbox' }]
        }
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ownerRef).toBe('routes-owner');
    expect(res.body.data.planRef).toMatch(/^0x[0-9a-f]{64}$/);
    expect(res.body.data.merkleRoot).toMatch(/^0x[0-9a-f]{64}$/);
    expect(res.body.data.version).toBe(1);
    expect(JSON.stringify(res.body)).not.toContain('Dropbox');
  });

  it('increments version on repeated anchoring for the same owner', async () => {
    await request(app)
      .post('/api/anchors')
      .send({ ownerRef: 'routes-repeat', snapshot: { version: 1 } });

    const res = await request(app)
      .post('/api/anchors')
      .send({ ownerRef: 'routes-repeat', snapshot: { version: 2 } });

    expect(res.status).toBe(201);
    expect(res.body.data.version).toBe(2);
  });

  it('returns the latest proof by ownerRef and 404 for unknown owners', async () => {
    const created = await request(app)
      .post('/api/anchors')
      .send({ ownerRef: 'routes-get', snapshot: { ok: true } });

    const found = await request(app).get('/api/anchors/routes-get');
    const missing = await request(app).get('/api/anchors/never-anchored');

    expect(found.status).toBe(200);
    expect(found.body.data.planHash).toBe(created.body.data.planHash);
    expect(missing.status).toBe(404);
  });

  it('rejects missing ownerRef, empty snapshots, unknown fields and sensitive keys', async () => {
    const missingOwner = await request(app).post('/api/anchors').send({ snapshot: {} });
    const emptySnapshot = await request(app)
      .post('/api/anchors')
      .send({ ownerRef: 'routes-invalid', snapshot: {} });
    const unknown = await request(app)
      .post('/api/anchors')
      .send({ ownerRef: 'routes-invalid', snapshot: { ok: true }, rawPlan: {} });
    const sensitive = await request(app)
      .post('/api/anchors')
      .send({ ownerRef: 'routes-invalid', snapshot: { secret: 'nope' } });

    expect(missingOwner.status).toBe(400);
    expect(emptySnapshot.status).toBe(400);
    expect(unknown.status).toBe(400);
    expect(sensitive.status).toBe(400);
    expect(sensitive.body.error).toContain('Sensitive field is not allowed');
  });
});
