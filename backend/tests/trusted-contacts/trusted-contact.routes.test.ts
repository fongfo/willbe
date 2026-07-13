import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/db/client';
import { withAuth } from '../support/auth';

describe('Trusted Contact routes (/api/trusted-contacts)', () => {
  beforeEach(async () => {
    await prisma.trustedContact.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/trusted-contacts', () => {
    it('creates a trusted contact and returns 201 with the created record', async () => {
      const app = createApp();

      const res = await withAuth(request(app).post('/api/trusted-contacts')).send({
        name: 'Imran Rahman',
        relation: 'SPOUSE',
        role: 'PRIMARY',
        phone: '+60123456789',
        email: 'imran@example.com',
        detail: 'Lives nearby, has spare keys'
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Imran Rahman');
      expect(res.body.data.relation).toBe('SPOUSE');
      expect(res.body.data.role).toBe('PRIMARY');
      expect(res.body.data.verificationStatus).toBe('PENDING');
      expect(typeof res.body.data.id).toBe('string');
      expect(res.body.data.id.length).toBeGreaterThan(0);
    });

    it('returns 400 with an error message when name is missing', async () => {
      const app = createApp();

      const res = await withAuth(request(app).post('/api/trusted-contacts')).send({
        relation: 'SPOUSE',
        role: 'PRIMARY',
        phone: '+60123456789'
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(typeof res.body.error).toBe('string');
      expect(res.body.error.length).toBeGreaterThan(0);
    });

    it('returns 400 with an error message when phone is invalid', async () => {
      const app = createApp();

      const res = await withAuth(request(app).post('/api/trusted-contacts')).send({
        name: 'Imran Rahman',
        relation: 'SPOUSE',
        role: 'PRIMARY',
        phone: 'not-a-phone'
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when verificationStatus is included in the body', async () => {
      const app = createApp();

      const res = await withAuth(request(app).post('/api/trusted-contacts')).send({
        name: 'Imran Rahman',
        relation: 'SPOUSE',
        role: 'PRIMARY',
        phone: '+60123456789',
        verificationStatus: 'VERIFIED'
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/trusted-contacts', () => {
    it('returns 200 with an array of trusted contacts', async () => {
      const app = createApp();

      const res = await withAuth(request(app).get('/api/trusted-contacts'));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/trusted-contacts/:id', () => {
    it('returns a 404 envelope when the id does not exist', async () => {
      const app = createApp();

      const res = await withAuth(
        request(app).get('/api/trusted-contacts/550e8400-e29b-41d4-a716-446655440000')
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when the id is malformed', async () => {
      const app = createApp();

      const res = await withAuth(request(app).get('/api/trusted-contacts/not-a-uuid'));

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 200 with the record when it exists', async () => {
      const app = createApp();
      const created = await withAuth(request(app).post('/api/trusted-contacts')).send({
        name: 'Sara Abdullah',
        relation: 'SIBLING',
        role: 'BACKUP',
        phone: '+60187654321'
      });

      const res = await withAuth(
        request(app).get(`/api/trusted-contacts/${created.body.data.id}`)
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Sara Abdullah');
    });
  });

  describe('PATCH /api/trusted-contacts/:id', () => {
    it('returns 400 when the body is empty', async () => {
      const app = createApp();

      const res = await withAuth(
        request(app).patch('/api/trusted-contacts/550e8400-e29b-41d4-a716-446655440000')
      )
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when the id is malformed', async () => {
      const app = createApp();

      const res = await withAuth(request(app).patch('/api/trusted-contacts/not-a-uuid'))
        .send({ name: 'New Name' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when the body attempts to set verificationStatus directly', async () => {
      const app = createApp();
      const created = await withAuth(request(app).post('/api/trusted-contacts')).send({
        name: 'Nur Rahman',
        relation: 'CHILD',
        role: 'BACKUP',
        phone: '+60112223333'
      });

      const res = await withAuth(
        request(app).patch(`/api/trusted-contacts/${created.body.data.id}`)
      )
        .send({ verificationStatus: 'VERIFIED' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 when the id is well-formed but does not exist', async () => {
      const app = createApp();

      const res = await withAuth(
        request(app).patch('/api/trusted-contacts/550e8400-e29b-41d4-a716-446655440000')
      )
        .send({ name: 'New Name' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns 200 with the updated record when it exists', async () => {
      const app = createApp();
      const created = await withAuth(request(app).post('/api/trusted-contacts')).send({
        name: 'Sara Abdullah',
        relation: 'SIBLING',
        role: 'BACKUP',
        phone: '+60187654321'
      });

      const res = await withAuth(
        request(app).patch(`/api/trusted-contacts/${created.body.data.id}`)
      )
        .send({ name: 'Sara A. Rahman' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Sara A. Rahman');
    });
  });

  describe('DELETE /api/trusted-contacts/:id', () => {
    it('returns a 404 envelope when the id does not exist', async () => {
      const app = createApp();

      const res = await withAuth(
        request(app).delete('/api/trusted-contacts/550e8400-e29b-41d4-a716-446655440000')
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when the id is malformed', async () => {
      const app = createApp();

      const res = await withAuth(request(app).delete('/api/trusted-contacts/not-a-uuid'));

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 204 and removes the record when it exists', async () => {
      const app = createApp();
      const created = await withAuth(request(app).post('/api/trusted-contacts')).send({
        name: 'Nur Rahman',
        relation: 'CHILD',
        role: 'BACKUP',
        phone: '+60112223333'
      });

      const res = await withAuth(
        request(app).delete(`/api/trusted-contacts/${created.body.data.id}`)
      );
      const afterDelete = await withAuth(
        request(app).get(`/api/trusted-contacts/${created.body.data.id}`)
      );

      expect(res.status).toBe(204);
      expect(afterDelete.status).toBe(404);
    });
  });

  describe('POST /api/trusted-contacts/:id/verify', () => {
    it('returns 200 with verificationStatus VERIFIED when the contact exists', async () => {
      const app = createApp();
      const created = await withAuth(request(app).post('/api/trusted-contacts')).send({
        name: 'Imran Rahman',
        relation: 'SPOUSE',
        role: 'PRIMARY',
        phone: '+60123456789'
      });

      const res = await withAuth(
        request(app).post(`/api/trusted-contacts/${created.body.data.id}/verify`)
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verificationStatus).toBe('VERIFIED');
    });

    it('returns a 404 envelope when the id does not exist', async () => {
      const app = createApp();

      const res = await withAuth(
        request(app).post('/api/trusted-contacts/550e8400-e29b-41d4-a716-446655440000/verify')
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when the id is malformed', async () => {
      const app = createApp();

      const res = await withAuth(
        request(app).post('/api/trusted-contacts/not-a-uuid/verify')
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
