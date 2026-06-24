import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/db/client';

describe('Family Member routes (/api/family-members)', () => {
  beforeEach(async () => {
    await prisma.familyMember.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/family-members', () => {
    // This is the designated first RED test: the route is not mounted yet, so this
    // currently fails with a 404 instead of the expected 201. That failure is the
    // correct RED state for this phase.
    it('creates a family member and returns 201 with the created record', async () => {
      const app = createApp();

      const res = await request(app).post('/api/family-members').send({
        name: 'Aisyah Rahman',
        relation: 'SELF',
        detail: 'Primary owner · Kuala Lumpur'
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Aisyah Rahman');
      expect(res.body.data.relation).toBe('SELF');
      expect(typeof res.body.data.id).toBe('string');
      expect(res.body.data.id.length).toBeGreaterThan(0);
    });

    it('returns 400 with an error message when name is missing', async () => {
      const app = createApp();

      const res = await request(app).post('/api/family-members').send({
        relation: 'SELF'
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(typeof res.body.error).toBe('string');
      expect(res.body.error.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/family-members', () => {
    it('returns 200 with an array of family members', async () => {
      const app = createApp();

      const res = await request(app).get('/api/family-members');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/family-members/:id', () => {
    it('returns a 404 envelope when the id does not exist', async () => {
      const app = createApp();

      const res = await request(app).get(
        '/api/family-members/550e8400-e29b-41d4-a716-446655440000'
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when the id is malformed', async () => {
      const app = createApp();

      const res = await request(app).get('/api/family-members/not-a-uuid');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 200 with the record when it exists', async () => {
      const app = createApp();
      const created = await request(app)
        .post('/api/family-members')
        .send({ name: 'Imran Rahman', relation: 'SPOUSE' });

      const res = await request(app).get(`/api/family-members/${created.body.data.id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Imran Rahman');
    });
  });

  describe('PATCH /api/family-members/:id', () => {
    it('returns 400 when the body is empty', async () => {
      const app = createApp();

      const res = await request(app)
        .patch('/api/family-members/550e8400-e29b-41d4-a716-446655440000')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when the id is malformed', async () => {
      const app = createApp();

      const res = await request(app)
        .patch('/api/family-members/not-a-uuid')
        .send({ name: 'New Name' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 when the id is well-formed but does not exist', async () => {
      const app = createApp();

      const res = await request(app)
        .patch('/api/family-members/550e8400-e29b-41d4-a716-446655440000')
        .send({ name: 'New Name' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns 200 with the updated record when it exists', async () => {
      const app = createApp();
      const created = await request(app)
        .post('/api/family-members')
        .send({ name: 'Sara Abdullah', relation: 'SIBLING' });

      const res = await request(app)
        .patch(`/api/family-members/${created.body.data.id}`)
        .send({ name: 'Sara A. Rahman' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Sara A. Rahman');
    });
  });

  describe('DELETE /api/family-members/:id', () => {
    it('returns a 404 envelope when the id does not exist', async () => {
      const app = createApp();

      const res = await request(app).delete(
        '/api/family-members/550e8400-e29b-41d4-a716-446655440000'
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when the id is malformed', async () => {
      const app = createApp();

      const res = await request(app).delete('/api/family-members/not-a-uuid');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 204 and removes the record when it exists', async () => {
      const app = createApp();
      const created = await request(app)
        .post('/api/family-members')
        .send({ name: 'Nur Rahman', relation: 'CHILD' });

      const res = await request(app).delete(`/api/family-members/${created.body.data.id}`);
      const afterDelete = await request(app).get(`/api/family-members/${created.body.data.id}`);

      expect(res.status).toBe(204);
      expect(afterDelete.status).toBe(404);
    });
  });
});
