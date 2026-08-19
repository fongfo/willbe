import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/db/client';
import { EmergencyAccessStatus } from '../../src/generated/prisma/enums';
import { withAuth } from '../support/auth';

const OWNER_ACCESS_TOKEN = 'dev:wb54-owner%40example.com:WB54%20Owner';
const CONTACT_ACCESS_TOKEN = 'dev:wb54-contact%40example.com:WB54%20Contact';
const OTHER_CONTACT_ACCESS_TOKEN = 'dev:wb54-other%40example.com:WB54%20Other';

async function createVerifiedContact(app = createApp()) {
  const created = await withAuth(
    request(app).post('/api/trusted-contacts'),
    OWNER_ACCESS_TOKEN
  ).send({
    name: 'Imran Rahman',
    relation: 'SPOUSE',
    role: 'PRIMARY',
    phone: '+60123456789',
    email: 'wb54-contact@example.com'
  });
  const bound = await withAuth(
    request(app).post(`/api/trusted-contacts/${created.body.data.id}/bind`),
    CONTACT_ACCESS_TOKEN
  );
  return {
    app,
    trustedContactId: bound.body.data.id as string,
    ownerUserId: bound.body.data.ownerUserId as string
  };
}

async function createCoolingOffRequest(app = createApp()) {
  const context = await createVerifiedContact(app);
  const access = await withAuth(
    request(app).post('/api/emergency-access/contact/requests'),
    CONTACT_ACCESS_TOKEN
  ).send({
    ownerUserId: context.ownerUserId,
    trustedContactId: context.trustedContactId,
    reason: 'UNREACHABLE',
    reasonDetail: 'The planner has been unreachable for several days.',
    confirmed: true
  });
  return {
    ...context,
    requestId: access.body.data.id as string
  };
}

describe('Emergency access routes (/api/emergency-access)', () => {
  beforeEach(async () => {
    await prisma.emergencyAccessAuditEvent.deleteMany();
    await prisma.emergencyAccessRequest.deleteMany();
    await prisma.trustedContact.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('returns verified contact context without trusted contact private detail', async () => {
    const app = createApp();
    await createVerifiedContact(app);

    const res = await withAuth(
      request(app).get('/api/emergency-access/contact/context'),
      CONTACT_ACCESS_TOKEN
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].planner.name).toBe('WB54 Owner');
    expect(res.body.data[0].planner).not.toHaveProperty('email');
    expect(res.body.data[0]).not.toHaveProperty('detail');
    expect(res.body.data[0]).not.toHaveProperty('contactUserId');
  });

  it('creates a cooling-off request and audit events for a verified contact', async () => {
    const app = createApp();
    const { ownerUserId, trustedContactId } = await createVerifiedContact(app);

    const res = await withAuth(
      request(app).post('/api/emergency-access/contact/requests'),
      CONTACT_ACCESS_TOKEN
    ).send({
      ownerUserId,
      trustedContactId,
      reason: 'ACCIDENT',
      reasonDetail: 'Hospital called the family.',
      confirmed: true
    });
    const auditCount = await prisma.emergencyAccessAuditEvent.count({
      where: { accessRequestId: res.body.data.id }
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('COOLING_OFF');
    expect(res.body.data.ownerNotifiedAt).toEqual(expect.any(String));
    expect(res.body.data.coolingOffEndsAt).toEqual(expect.any(String));
    expect(auditCount).toBe(3);
  });

  it('rejects an unverified contact request', async () => {
    const app = createApp();
    const created = await withAuth(
      request(app).post('/api/trusted-contacts'),
      OWNER_ACCESS_TOKEN
    ).send({
      name: 'Imran Rahman',
      relation: 'SPOUSE',
      role: 'PRIMARY',
      phone: '+60123456789',
      email: 'wb54-contact@example.com'
    });
    const contact = await prisma.trustedContact.findUniqueOrThrow({
      where: { id: created.body.data.id }
    });

    const res = await withAuth(
      request(app).post('/api/emergency-access/contact/requests'),
      CONTACT_ACCESS_TOKEN
    ).send({
      ownerUserId: contact.userId,
      trustedContactId: created.body.data.id,
      reason: 'ACCIDENT',
      confirmed: true
    });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('rejects a request for the wrong owner', async () => {
    const app = createApp();
    const { trustedContactId } = await createVerifiedContact(app);
    const otherOwner = await withAuth(
      request(app).get('/api/trusted-contacts'),
      OTHER_CONTACT_ACCESS_TOKEN
    );

    const res = await withAuth(
      request(app).post('/api/emergency-access/contact/requests'),
      CONTACT_ACCESS_TOKEN
    ).send({
      ownerUserId: otherOwner.body.data.ownerUserId ?? '550e8400-e29b-41d4-a716-446655440000',
      trustedContactId,
      reason: 'UNREACHABLE',
      confirmed: true
    });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('rejects duplicate active or cooling-off requests', async () => {
    const app = createApp();
    const { ownerUserId, trustedContactId } = await createCoolingOffRequest(app);

    const res = await withAuth(
      request(app).post('/api/emergency-access/contact/requests'),
      CONTACT_ACCESS_TOKEN
    ).send({
      ownerUserId,
      trustedContactId,
      reason: 'SERIOUS_ILLNESS',
      confirmed: true
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('lets the owner list and reject a cooling-off request', async () => {
    const app = createApp();
    const { requestId } = await createCoolingOffRequest(app);

    const list = await withAuth(
      request(app).get('/api/emergency-access/owner/requests'),
      OWNER_ACCESS_TOKEN
    );
    const rejected = await withAuth(
      request(app).post(`/api/emergency-access/owner/requests/${requestId}/reject`),
      OWNER_ACCESS_TOKEN
    );
    const auditEvents = await prisma.emergencyAccessAuditEvent.findMany({
      where: { accessRequestId: requestId },
      orderBy: { createdAt: 'asc' }
    });

    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].trustedContact.name).toBe('Imran Rahman');
    expect(rejected.status).toBe(200);
    expect(rejected.body.data.status).toBe('REJECTED_BY_OWNER');
    expect(auditEvents.map((event) => event.eventType)).toContain('OWNER_REJECTED');
  });

  it('prevents a non-owner from rejecting the request', async () => {
    const app = createApp();
    const { requestId } = await createCoolingOffRequest(app);

    const res = await withAuth(
      request(app).post(`/api/emergency-access/owner/requests/${requestId}/reject`),
      OTHER_CONTACT_ACCESS_TOKEN
    );

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('lets the owner revoke active access', async () => {
    const app = createApp();
    const { requestId } = await createCoolingOffRequest(app);
    await prisma.emergencyAccessRequest.update({
      where: { id: requestId },
      data: {
        status: EmergencyAccessStatus.ACTIVE,
        activatedAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      }
    });

    const res = await withAuth(
      request(app).post(`/api/emergency-access/owner/requests/${requestId}/revoke`),
      OWNER_ACCESS_TOKEN
    );

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('SUSPENDED');
  });

  it('lets the owner activate a cooling-off request', async () => {
    const app = createApp();
    const { requestId } = await createCoolingOffRequest(app);

    const res = await withAuth(
      request(app).post(`/api/emergency-access/owner/requests/${requestId}/activate`),
      OWNER_ACCESS_TOKEN
    );
    const auditEvents = await prisma.emergencyAccessAuditEvent.findMany({
      where: { accessRequestId: requestId },
      orderBy: { createdAt: 'asc' }
    });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ACTIVE');
    expect(res.body.data.activatedAt).toEqual(expect.any(String));
    expect(res.body.data.expiresAt).toEqual(expect.any(String));
    expect(auditEvents.map((event) => event.eventType)).toContain('ACCESS_ACTIVATED');
  });

  it('lets a bound contact read and close active access', async () => {
    const app = createApp();
    const { requestId } = await createCoolingOffRequest(app);
    await prisma.emergencyAccessRequest.update({
      where: { id: requestId },
      data: {
        status: EmergencyAccessStatus.ACTIVE,
        activatedAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      }
    });

    const detail = await withAuth(
      request(app).get(`/api/emergency-access/contact/requests/${requestId}`),
      CONTACT_ACCESS_TOKEN
    );
    const closed = await withAuth(
      request(app).post(`/api/emergency-access/contact/requests/${requestId}/close`),
      CONTACT_ACCESS_TOKEN
    );

    expect(detail.status).toBe(200);
    expect(detail.body.data.status).toBe('ACTIVE');
    expect(closed.status).toBe(200);
    expect(closed.body.data.status).toBe('CLOSED');
  });

  it('blocks contact reads after the trusted contact is no longer verified', async () => {
    const app = createApp();
    const { requestId, trustedContactId } = await createCoolingOffRequest(app);
    await prisma.emergencyAccessRequest.update({
      where: { id: requestId },
      data: {
        status: EmergencyAccessStatus.ACTIVE,
        activatedAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      }
    });
    await prisma.trustedContact.update({
      where: { id: trustedContactId },
      data: { verificationStatus: 'PENDING' }
    });

    const res = await withAuth(
      request(app).get(`/api/emergency-access/contact/requests/${requestId}`),
      CONTACT_ACCESS_TOKEN
    );

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for malformed request ids', async () => {
    const app = createApp();

    const res = await withAuth(
      request(app).post('/api/emergency-access/owner/requests/not-a-uuid/reject'),
      OWNER_ACCESS_TOKEN
    );

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('requires the serious confirmation checkbox', async () => {
    const app = createApp();
    const { ownerUserId, trustedContactId } = await createVerifiedContact(app);

    const res = await withAuth(
      request(app).post('/api/emergency-access/contact/requests'),
      CONTACT_ACCESS_TOKEN
    ).send({
      ownerUserId,
      trustedContactId,
      reason: 'OTHER',
      confirmed: false
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
