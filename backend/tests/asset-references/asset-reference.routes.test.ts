import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/db/client';

describe('Asset Reference routes (/api/asset-references)', () => {
  beforeEach(async () => {
    await prisma.assetReference.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/asset-references', () => {
    it('creates an asset reference and returns 201 with the created record', async () => {
      const app = createApp();

      const res = await request(app).post('/api/asset-references').send({
        name: 'Maybank Savings Account',
        category: 'BANK',
        locationHint: 'Top drawer, home office',
        detail: 'Joint account with spouse'
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Maybank Savings Account');
      expect(res.body.data.category).toBe('BANK');
      expect(typeof res.body.data.id).toBe('string');
      expect(res.body.data.id.length).toBeGreaterThan(0);
    });

    it('returns 400 with an error message when name is missing', async () => {
      const app = createApp();

      const res = await request(app).post('/api/asset-references').send({
        category: 'BANK'
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(typeof res.body.error).toBe('string');
      expect(res.body.error.length).toBeGreaterThan(0);
    });

    // Critical product/security constraint, exercised end-to-end through the HTTP
    // layer: a create request that smuggles a `password` field must never reach the
    // service/repository layer — it must be rejected at the validation boundary.
    it('returns 400 when the body contains a password field', async () => {
      const app = createApp();

      const res = await request(app).post('/api/asset-references').send({
        name: 'Maybank Savings Account',
        category: 'BANK',
        password: 'super-secret'
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/asset-references', () => {
    it('returns 200 with an array of asset references', async () => {
      const app = createApp();

      const res = await request(app).get('/api/asset-references');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/asset-references/:id', () => {
    it('returns a 404 envelope when the id does not exist', async () => {
      const app = createApp();

      const res = await request(app).get(
        '/api/asset-references/550e8400-e29b-41d4-a716-446655440000'
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when the id is malformed', async () => {
      const app = createApp();

      const res = await request(app).get('/api/asset-references/not-a-uuid');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 200 with the record when it exists', async () => {
      const app = createApp();
      const created = await request(app)
        .post('/api/asset-references')
        .send({ name: 'Tabung Haji Account', category: 'INVESTMENT' });

      const res = await request(app).get(`/api/asset-references/${created.body.data.id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Tabung Haji Account');
    });
  });

  describe('PATCH /api/asset-references/:id', () => {
    it('returns 400 when the body is empty', async () => {
      const app = createApp();

      const res = await request(app)
        .patch('/api/asset-references/550e8400-e29b-41d4-a716-446655440000')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when the id is malformed', async () => {
      const app = createApp();

      const res = await request(app)
        .patch('/api/asset-references/not-a-uuid')
        .send({ name: 'New Name' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 when the id is well-formed but does not exist', async () => {
      const app = createApp();

      const res = await request(app)
        .patch('/api/asset-references/550e8400-e29b-41d4-a716-446655440000')
        .send({ name: 'New Name' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns 200 with the updated record when it exists', async () => {
      const app = createApp();
      const created = await request(app)
        .post('/api/asset-references')
        .send({ name: 'Crypto Cold Wallet', category: 'CRYPTO' });

      const res = await request(app)
        .patch(`/api/asset-references/${created.body.data.id}`)
        .send({ name: 'Crypto Cold Wallet (Ledger)' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Crypto Cold Wallet (Ledger)');
    });
  });

  describe('DELETE /api/asset-references/:id', () => {
    it('returns a 404 envelope when the id does not exist', async () => {
      const app = createApp();

      const res = await request(app).delete(
        '/api/asset-references/550e8400-e29b-41d4-a716-446655440000'
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when the id is malformed', async () => {
      const app = createApp();

      const res = await request(app).delete('/api/asset-references/not-a-uuid');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 204 and removes the record when it exists', async () => {
      const app = createApp();
      const created = await request(app)
        .post('/api/asset-references')
        .send({ name: 'Vacant Land Title Deed', category: 'PROPERTY' });

      const res = await request(app).delete(`/api/asset-references/${created.body.data.id}`);
      const afterDelete = await request(app).get(
        `/api/asset-references/${created.body.data.id}`
      );

      expect(res.status).toBe(204);
      expect(afterDelete.status).toBe(404);
    });
  });
});
