import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/db/client';
import { withAuth } from '../support/auth';

const IMRAN_ACCESS_TOKEN = 'dev:imran%40example.com:Imran%20Rahman';

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
      expect(res.body.data).not.toHaveProperty('inviteTokenHash');
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

  describe('GET /api/trusted-contacts/assigned-plans', () => {
    it('returns only plans bound to the authenticated contact account', async () => {
      const app = createApp();
      const ownerContact = await withAuth(request(app).post('/api/trusted-contacts')).send({
        name: 'Imran Rahman',
        relation: 'SPOUSE',
        role: 'PRIMARY',
        phone: '+60123456789',
        email: 'imran@example.com'
      });
      const invite = await withAuth(
        request(app).post(`/api/trusted-contacts/${ownerContact.body.data.id}/invite`)
      );
      await withAuth(
        request(app).post(`/api/trusted-contacts/${ownerContact.body.data.id}/bind`),
        IMRAN_ACCESS_TOKEN
      ).send({ inviteToken: invite.body.data.inviteToken });

      const res = await withAuth(
        request(app).get('/api/trusted-contacts/assigned-plans'),
        IMRAN_ACCESS_TOKEN
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toEqual(
        expect.objectContaining({
          id: ownerContact.body.data.id,
          ownerUserId: expect.any(String),
          name: 'Imran Rahman',
          verificationStatus: 'VERIFIED'
        })
      );
      expect(res.body.data[0].planner).toEqual(
        expect.objectContaining({
          name: 'Aisyah Rahman',
          email: 'aisyah.rahman@gmail.com'
        })
      );
      expect(res.body.data[0]).not.toHaveProperty('detail');
    });

    it('does not return unbound trusted contacts', async () => {
      const app = createApp();
      await withAuth(request(app).post('/api/trusted-contacts')).send({
        name: 'Imran Rahman',
        relation: 'SPOUSE',
        role: 'PRIMARY',
        phone: '+60123456789',
        email: 'imran@example.com'
      });

      const res = await withAuth(
        request(app).get('/api/trusted-contacts/assigned-plans'),
        IMRAN_ACCESS_TOKEN
      );

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
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

  describe('POST /api/trusted-contacts/:id/invite', () => {
    it('creates a single-use invitation token for an owned trusted contact', async () => {
      const app = createApp();
      const created = await withAuth(request(app).post('/api/trusted-contacts')).send({
        name: 'Imran Rahman',
        relation: 'SPOUSE',
        role: 'PRIMARY',
        phone: '+60123456789',
        email: 'imran@example.com'
      });

      const res = await withAuth(
        request(app).post(`/api/trusted-contacts/${created.body.data.id}/invite`)
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.inviteToken).toBe('string');
      expect(res.body.data.inviteToken.length).toBeGreaterThan(24);
      expect(res.body.data.expiresAt).toEqual(expect.any(String));
      expect(res.body.data.contact.inviteSentAt).toEqual(expect.any(String));
      expect(res.body.data.contact.inviteTokenExpiresAt).toEqual(expect.any(String));
      expect(res.body.data.contact).not.toHaveProperty('inviteTokenHash');

      const stored = await prisma.trustedContact.findUnique({
        where: { id: created.body.data.id }
      });
      expect(stored?.inviteTokenHash).toEqual(expect.stringMatching(/^[a-f0-9]{64}$/));
      expect(stored?.inviteTokenHash).not.toBe(res.body.data.inviteToken);
    });

    it('rejects invite creation when the trusted contact has no email', async () => {
      const app = createApp();
      const created = await withAuth(request(app).post('/api/trusted-contacts')).send({
        name: 'Nur Rahman',
        relation: 'CHILD',
        role: 'BACKUP',
        phone: '+60112223333'
      });

      const res = await withAuth(
        request(app).post(`/api/trusted-contacts/${created.body.data.id}/invite`)
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('does not allow another planner to invite a contact they do not own', async () => {
      const app = createApp();
      const created = await withAuth(request(app).post('/api/trusted-contacts')).send({
        name: 'Imran Rahman',
        relation: 'SPOUSE',
        role: 'PRIMARY',
        phone: '+60123456789',
        email: 'imran@example.com'
      });

      const res = await withAuth(
        request(app).post(`/api/trusted-contacts/${created.body.data.id}/invite`),
        'dev:other.owner%40example.com:Other%20Owner'
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/trusted-contacts/:id/invite/revoke', () => {
    it('revokes an unused invitation token for an owned trusted contact', async () => {
      const app = createApp();
      const created = await withAuth(request(app).post('/api/trusted-contacts')).send({
        name: 'Imran Rahman',
        relation: 'SPOUSE',
        role: 'PRIMARY',
        phone: '+60123456789',
        email: 'imran@example.com'
      });
      await withAuth(
        request(app).post(`/api/trusted-contacts/${created.body.data.id}/invite`)
      );

      const res = await withAuth(
        request(app).post(`/api/trusted-contacts/${created.body.data.id}/invite/revoke`)
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.inviteSentAt).toBeNull();
      expect(res.body.data.inviteTokenExpiresAt).toBeNull();
      expect(res.body.data.inviteTokenUsedAt).toBeNull();
      expect(res.body.data).not.toHaveProperty('inviteTokenHash');

      const stored = await prisma.trustedContact.findUnique({
        where: { id: created.body.data.id }
      });
      expect(stored?.inviteTokenHash).toBeNull();
      expect(stored?.inviteSentAt).toBeNull();
    });

    it('does not allow another planner to revoke a contact invite they do not own', async () => {
      const app = createApp();
      const created = await withAuth(request(app).post('/api/trusted-contacts')).send({
        name: 'Imran Rahman',
        relation: 'SPOUSE',
        role: 'PRIMARY',
        phone: '+60123456789',
        email: 'imran@example.com'
      });

      const res = await withAuth(
        request(app).post(`/api/trusted-contacts/${created.body.data.id}/invite/revoke`),
        'dev:other.owner%40example.com:Other%20Owner'
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('rejects revoking an invite after the contact account is verified', async () => {
      const app = createApp();
      const created = await withAuth(request(app).post('/api/trusted-contacts')).send({
        name: 'Imran Rahman',
        relation: 'SPOUSE',
        role: 'PRIMARY',
        phone: '+60123456789',
        email: 'imran@example.com'
      });
      const invite = await withAuth(
        request(app).post(`/api/trusted-contacts/${created.body.data.id}/invite`)
      );
      await withAuth(
        request(app).post(`/api/trusted-contacts/${created.body.data.id}/bind`),
        IMRAN_ACCESS_TOKEN
      ).send({ inviteToken: invite.body.data.inviteToken });

      const res = await withAuth(
        request(app).post(`/api/trusted-contacts/${created.body.data.id}/invite/revoke`)
      );

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
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
    it('returns 410 because contacts must now verify from their own account', async () => {
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

      expect(res.status).toBe(410);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('contact account');
    });

    it('returns 410 even when the id does not exist so owners cannot verify contacts', async () => {
      const app = createApp();

      const res = await withAuth(
        request(app).post('/api/trusted-contacts/550e8400-e29b-41d4-a716-446655440000/verify')
      );

      expect(res.status).toBe(410);
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

  describe('POST /api/trusted-contacts/:id/bind', () => {
    it('binds and verifies a trusted contact when the invite token and authenticated email match', async () => {
      const app = createApp();
      const created = await withAuth(request(app).post('/api/trusted-contacts')).send({
        name: 'Imran Rahman',
        relation: 'SPOUSE',
        role: 'PRIMARY',
        phone: '+60123456789',
        email: 'imran@example.com'
      });
      const invite = await withAuth(
        request(app).post(`/api/trusted-contacts/${created.body.data.id}/invite`)
      );

      const res = await withAuth(
        request(app).post(`/api/trusted-contacts/${created.body.data.id}/bind`),
        IMRAN_ACCESS_TOKEN
      ).send({ inviteToken: invite.body.data.inviteToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verificationStatus).toBe('VERIFIED');
      expect(res.body.data.ownerUserId).toEqual(expect.any(String));
      expect(res.body.data).not.toHaveProperty('detail');
      expect(res.body.data).not.toHaveProperty('contactUserId');
      expect(res.body.data).not.toHaveProperty('inviteTokenHash');
      const stored = await prisma.trustedContact.findUnique({
        where: { id: created.body.data.id }
      });
      expect(stored?.inviteTokenUsedAt).toBeTruthy();
    });

    it('rejects binding when the authenticated email does not match', async () => {
      const app = createApp();
      const created = await withAuth(request(app).post('/api/trusted-contacts')).send({
        name: 'Imran Rahman',
        relation: 'SPOUSE',
        role: 'PRIMARY',
        phone: '+60123456789',
        email: 'imran@example.com'
      });
      const invite = await withAuth(
        request(app).post(`/api/trusted-contacts/${created.body.data.id}/invite`)
      );

      const res = await withAuth(
        request(app).post(`/api/trusted-contacts/${created.body.data.id}/bind`),
        'dev:sara%40example.com:Sara%20Abdullah'
      ).send({ inviteToken: invite.body.data.inviteToken });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rejects binding a contact that is already bound to another user', async () => {
      const app = createApp();
      const created = await withAuth(request(app).post('/api/trusted-contacts')).send({
        name: 'Imran Rahman',
        relation: 'SPOUSE',
        role: 'PRIMARY',
        phone: '+60123456789',
        email: 'imran@example.com'
      });
      const invite = await withAuth(
        request(app).post(`/api/trusted-contacts/${created.body.data.id}/invite`)
      );
      const otherUser = await prisma.user.create({
        data: {
          privyUserId: 'dev:other-imran-binding',
          email: 'imran@example.com',
          name: 'Other Imran'
        }
      });
      await prisma.trustedContact.update({
        where: { id: created.body.data.id },
        data: { contactUserId: otherUser.id }
      });

      const res = await withAuth(
        request(app).post(`/api/trusted-contacts/${created.body.data.id}/bind`),
        IMRAN_ACCESS_TOKEN
      ).send({ inviteToken: invite.body.data.inviteToken });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('rejects binding without an invite token', async () => {
      const app = createApp();
      const created = await withAuth(request(app).post('/api/trusted-contacts')).send({
        name: 'Imran Rahman',
        relation: 'SPOUSE',
        role: 'PRIMARY',
        phone: '+60123456789',
        email: 'imran@example.com'
      });

      const res = await withAuth(
        request(app).post(`/api/trusted-contacts/${created.body.data.id}/bind`),
        IMRAN_ACCESS_TOKEN
      ).send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects a reused invite token after successful binding', async () => {
      const app = createApp();
      const created = await withAuth(request(app).post('/api/trusted-contacts')).send({
        name: 'Imran Rahman',
        relation: 'SPOUSE',
        role: 'PRIMARY',
        phone: '+60123456789',
        email: 'imran@example.com'
      });
      const invite = await withAuth(
        request(app).post(`/api/trusted-contacts/${created.body.data.id}/invite`)
      );

      await withAuth(
        request(app).post(`/api/trusted-contacts/${created.body.data.id}/bind`),
        IMRAN_ACCESS_TOKEN
      ).send({ inviteToken: invite.body.data.inviteToken });
      const reused = await withAuth(
        request(app).post(`/api/trusted-contacts/${created.body.data.id}/bind`),
        IMRAN_ACCESS_TOKEN
      ).send({ inviteToken: invite.body.data.inviteToken });

      expect(reused.status).toBe(409);
      expect(reused.body.success).toBe(false);
    });

    it('rejects an expired invite token', async () => {
      const app = createApp();
      const created = await withAuth(request(app).post('/api/trusted-contacts')).send({
        name: 'Imran Rahman',
        relation: 'SPOUSE',
        role: 'PRIMARY',
        phone: '+60123456789',
        email: 'imran@example.com'
      });
      const invite = await withAuth(
        request(app).post(`/api/trusted-contacts/${created.body.data.id}/invite`)
      );
      await prisma.trustedContact.update({
        where: { id: created.body.data.id },
        data: { inviteTokenExpiresAt: new Date('2000-01-01T00:00:00.000Z') }
      });

      const res = await withAuth(
        request(app).post(`/api/trusted-contacts/${created.body.data.id}/bind`),
        IMRAN_ACCESS_TOKEN
      ).send({ inviteToken: invite.body.data.inviteToken });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rejects an invalid invite token', async () => {
      const app = createApp();
      const created = await withAuth(request(app).post('/api/trusted-contacts')).send({
        name: 'Imran Rahman',
        relation: 'SPOUSE',
        role: 'PRIMARY',
        phone: '+60123456789',
        email: 'imran@example.com'
      });
      await withAuth(
        request(app).post(`/api/trusted-contacts/${created.body.data.id}/invite`)
      );

      const res = await withAuth(
        request(app).post(`/api/trusted-contacts/${created.body.data.id}/bind`),
        IMRAN_ACCESS_TOKEN
      ).send({ inviteToken: 'invalid-token-value-that-is-long-enough' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when the id is malformed', async () => {
      const app = createApp();

      const res = await withAuth(
        request(app).post('/api/trusted-contacts/not-a-uuid/bind'),
        IMRAN_ACCESS_TOKEN
      ).send({ inviteToken: 'valid-token-value-that-is-long-enough' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/trusted-contacts/bind-invite', () => {
    it('binds and verifies a trusted contact using only the invite token', async () => {
      const app = createApp();
      const created = await withAuth(request(app).post('/api/trusted-contacts')).send({
        name: 'Imran Rahman',
        relation: 'SPOUSE',
        role: 'PRIMARY',
        phone: '+60123456789',
        email: 'imran@example.com'
      });
      const invite = await withAuth(
        request(app).post(`/api/trusted-contacts/${created.body.data.id}/invite`)
      );

      const res = await withAuth(
        request(app).post('/api/trusted-contacts/bind-invite'),
        IMRAN_ACCESS_TOKEN
      ).send({ inviteToken: invite.body.data.inviteToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(created.body.data.id);
      expect(res.body.data.verificationStatus).toBe('VERIFIED');
      expect(res.body.data.ownerUserId).toEqual(expect.any(String));
      expect(res.body.data).not.toHaveProperty('inviteTokenHash');
    });

    it('rejects token-only binding when the authenticated email does not match', async () => {
      const app = createApp();
      const created = await withAuth(request(app).post('/api/trusted-contacts')).send({
        name: 'Imran Rahman',
        relation: 'SPOUSE',
        role: 'PRIMARY',
        phone: '+60123456789',
        email: 'imran@example.com'
      });
      const invite = await withAuth(
        request(app).post(`/api/trusted-contacts/${created.body.data.id}/invite`)
      );

      const res = await withAuth(
        request(app).post('/api/trusted-contacts/bind-invite'),
        'dev:sara%40example.com:Sara%20Abdullah'
      ).send({ inviteToken: invite.body.data.inviteToken });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rejects token-only binding with an invalid token', async () => {
      const app = createApp();

      const res = await withAuth(
        request(app).post('/api/trusted-contacts/bind-invite'),
        IMRAN_ACCESS_TOKEN
      ).send({ inviteToken: 'invalid-token-value-that-is-long-enough' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
