import { prisma } from '../../src/db/client';
import { EmergencyAccessRepository } from '../../src/emergency-access/emergency-access.repository';
import { EmergencyAccessStatus } from '../../src/generated/prisma/enums';

const NOW = new Date('2026-08-19T00:00:00.000Z');

async function createFixture() {
  const owner = await prisma.user.create({
    data: {
      privyUserId: 'dev:wb54-repo-owner@example.com',
      email: 'wb54-repo-owner@example.com',
      name: 'WB54 Repo Owner'
    }
  });
  const contactUser = await prisma.user.create({
    data: {
      privyUserId: 'dev:wb54-repo-contact@example.com',
      email: 'wb54-repo-contact@example.com',
      name: 'WB54 Repo Contact'
    }
  });
  const trustedContact = await prisma.trustedContact.create({
    data: {
      userId: owner.id,
      contactUserId: contactUser.id,
      name: 'Imran Rahman',
      relation: 'SPOUSE',
      role: 'PRIMARY',
      phone: '+60123456789',
      email: 'wb54-repo-contact@example.com',
      verificationStatus: 'VERIFIED'
    }
  });
  return { owner, contactUser, trustedContact };
}

describe('EmergencyAccessRepository', () => {
  const repository = new EmergencyAccessRepository();

  beforeEach(async () => {
    await prisma.emergencyAccessAuditEvent.deleteMany();
    await prisma.emergencyAccessRequest.deleteMany();
    await prisma.trustedContact.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('returns null when the open-request unique guard rejects a duplicate', async () => {
    const { owner, contactUser, trustedContact } = await createFixture();
    const input = {
      ownerUserId: owner.id,
      trustedContactId: trustedContact.id,
      reason: 'UNREACHABLE' as const,
      confirmed: true as const
    };

    const first = await repository.createCoolingOffRequest(contactUser.id, input, {
      now: NOW,
      coolingOffEndsAt: new Date('2026-08-20T00:00:00.000Z')
    });
    const duplicate = await repository.createCoolingOffRequest(contactUser.id, input, {
      now: NOW,
      coolingOffEndsAt: new Date('2026-08-20T00:00:00.000Z')
    });

    expect(first?.status).toBe('COOLING_OFF');
    expect(duplicate).toBeNull();
  });

  it('conditionally updates status and skips stale transitions', async () => {
    const { owner, contactUser, trustedContact } = await createFixture();
    const request = await repository.createCoolingOffRequest(
      contactUser.id,
      {
        ownerUserId: owner.id,
        trustedContactId: trustedContact.id,
        reason: 'ACCIDENT',
        confirmed: true
      },
      {
        now: NOW,
        coolingOffEndsAt: new Date('2026-08-20T00:00:00.000Z')
      }
    );

    const stale = await repository.transitionStatus(
      request?.id ?? '',
      owner.id,
      { status: EmergencyAccessStatus.SUSPENDED, closedAt: NOW },
      'OWNER_REVOKED',
      {},
      [EmergencyAccessStatus.ACTIVE]
    );
    const activated = await repository.transitionStatus(
      request?.id ?? '',
      owner.id,
      {
        status: EmergencyAccessStatus.ACTIVE,
        activatedAt: NOW,
        expiresAt: new Date('2026-08-22T00:00:00.000Z')
      },
      'ACCESS_ACTIVATED',
      {},
      [EmergencyAccessStatus.COOLING_OFF]
    );
    const auditEvents = await repository.findAuditEvents(request?.id ?? '');

    expect(stale).toBeNull();
    expect(activated?.status).toBe('ACTIVE');
    expect(auditEvents.map((event) => event.eventType)).toEqual([
      'ACCESS_REQUESTED',
      'OWNER_NOTIFIED',
      'COOLING_OFF_STARTED',
      'ACCESS_ACTIVATED'
    ]);
  });

  it('requires the requester and current verified binding for contact reads', async () => {
    const { owner, contactUser, trustedContact } = await createFixture();
    const request = await repository.createCoolingOffRequest(
      contactUser.id,
      {
        ownerUserId: owner.id,
        trustedContactId: trustedContact.id,
        reason: 'OTHER',
        confirmed: true
      },
      {
        now: NOW,
        coolingOffEndsAt: new Date('2026-08-20T00:00:00.000Z')
      }
    );

    const visible = await repository.findByIdForContact(contactUser.id, request?.id ?? '');
    await prisma.trustedContact.update({
      where: { id: trustedContact.id },
      data: { verificationStatus: 'PENDING' }
    });
    const hidden = await repository.findByIdForContact(contactUser.id, request?.id ?? '');

    expect(visible?.id).toBe(request?.id);
    expect(hidden).toBeNull();
  });

  it('returns the latest contact request in verified assignments', async () => {
    const { owner, contactUser, trustedContact } = await createFixture();
    const request = await repository.createCoolingOffRequest(
      contactUser.id,
      {
        ownerUserId: owner.id,
        trustedContactId: trustedContact.id,
        reason: 'UNREACHABLE',
        confirmed: true
      },
      {
        now: NOW,
        coolingOffEndsAt: new Date('2026-08-20T00:00:00.000Z')
      }
    );

    const assignments = await repository.findAssignments(contactUser.id);

    expect(assignments).toHaveLength(1);
    expect(assignments[0]?.emergencyAccessRequests?.[0]?.id).toBe(request?.id);
    expect(assignments[0]?.user).not.toHaveProperty('email');
  });

  it('marks expired active latest requests as expired in contact context', async () => {
    const { owner, contactUser, trustedContact } = await createFixture();
    const request = await repository.createCoolingOffRequest(
      contactUser.id,
      {
        ownerUserId: owner.id,
        trustedContactId: trustedContact.id,
        reason: 'UNREACHABLE',
        confirmed: true
      },
      {
        now: NOW,
        coolingOffEndsAt: new Date('2026-08-20T00:00:00.000Z')
      }
    );
    await prisma.emergencyAccessRequest.update({
      where: { id: request?.id ?? '' },
      data: {
        status: EmergencyAccessStatus.ACTIVE,
        activatedAt: new Date('2026-08-18T00:00:00.000Z'),
        expiresAt: new Date('2026-08-18T01:00:00.000Z')
      }
    });

    const assignments = await repository.findAssignments(contactUser.id, NOW);

    expect(assignments[0]?.emergencyAccessRequests?.[0]?.status).toBe('EXPIRED');
  });

  it('requires active, unexpired contact access before returning handover context', async () => {
    const { owner, contactUser, trustedContact } = await createFixture();
    const request = await repository.createCoolingOffRequest(
      contactUser.id,
      {
        ownerUserId: owner.id,
        trustedContactId: trustedContact.id,
        reason: 'SERIOUS_ILLNESS',
        confirmed: true
      },
      {
        now: NOW,
        coolingOffEndsAt: new Date('2026-08-20T00:00:00.000Z')
      }
    );

    const beforeActive = await repository.findActiveByIdForContact(
      contactUser.id,
      request?.id ?? '',
      NOW
    );
    await prisma.emergencyAccessRequest.update({
      where: { id: request?.id ?? '' },
      data: {
        status: EmergencyAccessStatus.ACTIVE,
        activatedAt: NOW,
        expiresAt: new Date('2026-08-20T00:00:00.000Z')
      }
    });
    const active = await repository.findActiveByIdForContact(
      contactUser.id,
      request?.id ?? '',
      NOW
    );
    const expired = await repository.findActiveByIdForContact(
      contactUser.id,
      request?.id ?? '',
      new Date('2026-08-21T00:00:00.000Z')
    );

    expect(beforeActive).toBeNull();
    expect(active?.ownerUserId).toBe(owner.id);
    expect(expired).toBeNull();
  });

  it('records an audit event for contact handover views', async () => {
    const { owner, contactUser, trustedContact } = await createFixture();
    const request = await repository.createCoolingOffRequest(
      contactUser.id,
      {
        ownerUserId: owner.id,
        trustedContactId: trustedContact.id,
        reason: 'ACCIDENT',
        confirmed: true
      },
      {
        now: NOW,
        coolingOffEndsAt: new Date('2026-08-20T00:00:00.000Z')
      }
    );

    await repository.recordAuditEvent(
      request?.id ?? '',
      contactUser.id,
      'HANDOVER_VIEWED',
      { ownerUserId: owner.id }
    );
    const events = await repository.findAuditEvents(request?.id ?? '');

    expect(events.map((event) => event.eventType)).toContain('HANDOVER_VIEWED');
  });
});
