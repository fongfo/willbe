import { EmergencyAccessStatus } from '../../src/generated/prisma/enums';
import type {
  EmergencyAccessAuditEventModel,
  EmergencyAccessRequestModel
} from '../../src/generated/prisma/models';
import { EmergencyAccessService } from '../../src/emergency-access/emergency-access.service';
import type {
  EmergencyAccessRequestWithContact,
  TrustedContactAccessAssignment
} from '../../src/emergency-access/emergency-access.repository';

const NOW = new Date('2026-08-19T00:00:00.000Z');
const OWNER_ID = '550e8400-e29b-41d4-a716-446655440000';
const CONTACT_USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const CONTACT_ID = '550e8400-e29b-41d4-a716-446655440002';
const REQUEST_ID = '550e8400-e29b-41d4-a716-446655440003';

interface MockRepository {
  findVerifiedAssignment: jest.Mock;
  findAssignments: jest.Mock;
  findOpenForTrustedContact: jest.Mock;
  createCoolingOffRequest: jest.Mock;
  findOwnerRequests: jest.Mock;
  findByIdForOwner: jest.Mock;
  findByIdForContact: jest.Mock;
  transitionStatus: jest.Mock;
  findAuditEvents: jest.Mock;
}

function makeRequest(
  status: EmergencyAccessStatus = EmergencyAccessStatus.COOLING_OFF
): EmergencyAccessRequestModel {
  return {
    id: REQUEST_ID,
    ownerUserId: OWNER_ID,
    trustedContactId: CONTACT_ID,
    requesterUserId: CONTACT_USER_ID,
    reason: 'UNREACHABLE',
    reasonDetail: null,
    status,
    ownerNotifiedAt: NOW,
    coolingOffEndsAt: new Date('2026-08-20T00:00:00.000Z'),
    activatedAt: null,
    expiresAt: null,
    closedAt: null,
    createdAt: NOW,
    updatedAt: NOW
  };
}

function makeAssignment(
  overrides: Partial<TrustedContactAccessAssignment> = {}
): TrustedContactAccessAssignment {
  return {
    id: CONTACT_ID,
    userId: OWNER_ID,
    contactUserId: CONTACT_USER_ID,
    name: 'Imran Rahman',
    relation: 'SPOUSE',
    role: 'PRIMARY',
    phone: '+60123456789',
    email: 'imran@example.com',
    verificationStatus: 'VERIFIED',
    detail: null,
    createdAt: NOW,
    updatedAt: NOW,
    user: { id: OWNER_ID, name: 'Aisyah Rahman' },
    ...overrides
  };
}

function createRepository(): MockRepository {
  return {
    findVerifiedAssignment: jest.fn().mockResolvedValue(makeAssignment()),
    findAssignments: jest.fn().mockResolvedValue([]),
    findOpenForTrustedContact: jest.fn().mockResolvedValue(null),
    createCoolingOffRequest: jest.fn().mockResolvedValue(makeRequest()),
    findOwnerRequests: jest.fn().mockResolvedValue([]),
    findByIdForOwner: jest.fn().mockResolvedValue(makeRequest()),
    findByIdForContact: jest.fn().mockResolvedValue({
      ...makeRequest(),
      trustedContact: {
        id: CONTACT_ID,
        name: 'Imran Rahman',
        relation: 'SPOUSE',
        role: 'PRIMARY',
        phone: '+60123456789',
        email: 'imran@example.com',
        verificationStatus: 'VERIFIED'
      }
    } satisfies EmergencyAccessRequestWithContact),
    transitionStatus: jest.fn().mockResolvedValue(makeRequest()),
    findAuditEvents: jest.fn().mockResolvedValue([] as EmergencyAccessAuditEventModel[])
  };
}

describe('EmergencyAccessService', () => {
  let repository: MockRepository;
  let service: EmergencyAccessService;

  beforeEach(() => {
    repository = createRepository();
    service = new EmergencyAccessService(repository, () => NOW);
  });

  it('creates a cooling-off request for a verified bound contact', async () => {
    await service.createRequest(CONTACT_USER_ID, {
      ownerUserId: OWNER_ID,
      trustedContactId: CONTACT_ID,
      reason: 'UNREACHABLE',
      confirmed: true
    });

    expect(repository.findVerifiedAssignment).toHaveBeenCalledWith(
      CONTACT_USER_ID,
      CONTACT_ID
    );
    expect(repository.createCoolingOffRequest).toHaveBeenCalledWith(
      CONTACT_USER_ID,
      expect.objectContaining({ ownerUserId: OWNER_ID, trustedContactId: CONTACT_ID }),
      {
        now: NOW,
        coolingOffEndsAt: new Date('2026-08-20T00:00:00.000Z')
      }
    );
  });

  it('rejects unverified or unbound contacts', async () => {
    repository.findVerifiedAssignment.mockResolvedValue(null);

    await expect(
      service.createRequest(CONTACT_USER_ID, {
        ownerUserId: OWNER_ID,
        trustedContactId: CONTACT_ID,
        reason: 'ACCIDENT',
        confirmed: true
      })
    ).rejects.toMatchObject({ status: 403 });
  });

  it('rejects a request for the wrong owner plan', async () => {
    repository.findVerifiedAssignment.mockResolvedValue(
      makeAssignment({ userId: '550e8400-e29b-41d4-a716-446655440099' })
    );

    await expect(
      service.createRequest(CONTACT_USER_ID, {
        ownerUserId: OWNER_ID,
        trustedContactId: CONTACT_ID,
        reason: 'ACCIDENT',
        confirmed: true
      })
    ).rejects.toMatchObject({ status: 403 });
  });

  it('rejects duplicate open requests', async () => {
    repository.findOpenForTrustedContact.mockResolvedValue(makeRequest());

    await expect(
      service.createRequest(CONTACT_USER_ID, {
        ownerUserId: OWNER_ID,
        trustedContactId: CONTACT_ID,
        reason: 'ACCIDENT',
        confirmed: true
      })
    ).rejects.toMatchObject({ status: 409 });
  });

  it('allows a new request when the previous request is terminal', async () => {
    repository.findOpenForTrustedContact.mockResolvedValue(
      makeRequest(EmergencyAccessStatus.REJECTED_BY_OWNER)
    );

    await service.createRequest(CONTACT_USER_ID, {
      ownerUserId: OWNER_ID,
      trustedContactId: CONTACT_ID,
      reason: 'ACCIDENT',
      confirmed: true
    });

    expect(repository.createCoolingOffRequest).toHaveBeenCalled();
  });

  it('maps database duplicate-open-request conflicts to 409', async () => {
    repository.createCoolingOffRequest.mockResolvedValue(null);

    await expect(
      service.createRequest(CONTACT_USER_ID, {
        ownerUserId: OWNER_ID,
        trustedContactId: CONTACT_ID,
        reason: 'ACCIDENT',
        confirmed: true
      })
    ).rejects.toMatchObject({ status: 409 });
  });

  it('returns contact request details for the bound contact', async () => {
    const result = await service.getContactRequest(CONTACT_USER_ID, REQUEST_ID);

    expect(result.id).toBe(REQUEST_ID);
    expect(repository.findByIdForContact).toHaveBeenCalledWith(CONTACT_USER_ID, REQUEST_ID);
  });

  it('returns 404 when a contact request is not bound to the contact', async () => {
    repository.findByIdForContact.mockResolvedValue(null);

    await expect(
      service.getContactRequest(CONTACT_USER_ID, REQUEST_ID)
    ).rejects.toMatchObject({ status: 404 });
  });

  it('allows owner rejection during cooling off', async () => {
    await service.rejectOwnerRequest(OWNER_ID, REQUEST_ID);

    expect(repository.transitionStatus).toHaveBeenCalledWith(
      REQUEST_ID,
      OWNER_ID,
      {
        status: EmergencyAccessStatus.REJECTED_BY_OWNER,
        closedAt: NOW
      },
      'OWNER_REJECTED',
      {},
      [
        EmergencyAccessStatus.REQUESTED,
        EmergencyAccessStatus.COOLING_OFF,
        EmergencyAccessStatus.SECONDARY_REVIEW
      ]
    );
  });

  it('returns 409 when a concurrent update wins before owner rejection', async () => {
    repository.transitionStatus.mockResolvedValue(null);

    await expect(service.rejectOwnerRequest(OWNER_ID, REQUEST_ID)).rejects.toMatchObject({
      status: 409
    });
  });

  it('blocks owner rejection after access is active', async () => {
    repository.findByIdForOwner.mockResolvedValue(makeRequest(EmergencyAccessStatus.ACTIVE));

    await expect(service.rejectOwnerRequest(OWNER_ID, REQUEST_ID)).rejects.toMatchObject({
      status: 409
    });
  });

  it('returns 404 when the owner cannot access the request', async () => {
    repository.findByIdForOwner.mockResolvedValue(null);

    await expect(service.rejectOwnerRequest(OWNER_ID, REQUEST_ID)).rejects.toMatchObject({
      status: 404
    });
  });

  it('allows owner revoke only for active access', async () => {
    repository.findByIdForOwner.mockResolvedValue(makeRequest(EmergencyAccessStatus.ACTIVE));

    await service.revokeOwnerRequest(OWNER_ID, REQUEST_ID);

    expect(repository.transitionStatus).toHaveBeenCalledWith(
      REQUEST_ID,
      OWNER_ID,
      {
        status: EmergencyAccessStatus.SUSPENDED,
        closedAt: NOW
      },
      'OWNER_REVOKED',
      {},
      [EmergencyAccessStatus.ACTIVE]
    );
  });

  it('returns 409 when a concurrent update wins before owner revoke', async () => {
    repository.findByIdForOwner.mockResolvedValue(makeRequest(EmergencyAccessStatus.ACTIVE));
    repository.transitionStatus.mockResolvedValue(null);

    await expect(service.revokeOwnerRequest(OWNER_ID, REQUEST_ID)).rejects.toMatchObject({
      status: 409
    });
  });

  it('blocks owner revoke before access is active', async () => {
    await expect(service.revokeOwnerRequest(OWNER_ID, REQUEST_ID)).rejects.toMatchObject({
      status: 409
    });
  });

  it('allows the contact to close active access', async () => {
    repository.findByIdForContact.mockResolvedValue({
      ...makeRequest(EmergencyAccessStatus.ACTIVE),
      trustedContact: {
        id: CONTACT_ID,
        name: 'Imran Rahman',
        relation: 'SPOUSE',
        role: 'PRIMARY',
        phone: '+60123456789',
        email: 'imran@example.com',
        verificationStatus: 'VERIFIED'
      }
    } satisfies EmergencyAccessRequestWithContact);

    await service.closeContactRequest(CONTACT_USER_ID, REQUEST_ID);

    expect(repository.transitionStatus).toHaveBeenCalledWith(
      REQUEST_ID,
      CONTACT_USER_ID,
      {
        status: EmergencyAccessStatus.CLOSED,
        closedAt: NOW
      },
      'ACCESS_CLOSED',
      {},
      [EmergencyAccessStatus.ACTIVE]
    );
  });

  it('returns 409 when a concurrent update wins before contact close', async () => {
    repository.findByIdForContact.mockResolvedValue({
      ...makeRequest(EmergencyAccessStatus.ACTIVE),
      trustedContact: {
        id: CONTACT_ID,
        name: 'Imran Rahman',
        relation: 'SPOUSE',
        role: 'PRIMARY',
        phone: '+60123456789',
        email: 'imran@example.com',
        verificationStatus: 'VERIFIED'
      }
    } satisfies EmergencyAccessRequestWithContact);
    repository.transitionStatus.mockResolvedValue(null);

    await expect(service.closeContactRequest(CONTACT_USER_ID, REQUEST_ID)).rejects.toMatchObject({
      status: 409
    });
  });

  it('blocks contact close before access is active', async () => {
    await expect(service.closeContactRequest(CONTACT_USER_ID, REQUEST_ID)).rejects.toMatchObject({
      status: 409
    });
  });

  it('activates a cooling-off request and sets an expiry', async () => {
    await service.activateForReview(OWNER_ID, REQUEST_ID);

    expect(repository.transitionStatus).toHaveBeenCalledWith(
      REQUEST_ID,
      OWNER_ID,
      {
        status: EmergencyAccessStatus.ACTIVE,
        activatedAt: NOW,
        expiresAt: new Date('2026-08-22T00:00:00.000Z')
      },
      'ACCESS_ACTIVATED',
      {},
      [EmergencyAccessStatus.COOLING_OFF, EmergencyAccessStatus.SECONDARY_REVIEW]
    );
  });

  it('returns 409 when a concurrent update wins before activation', async () => {
    repository.transitionStatus.mockResolvedValue(null);

    await expect(service.activateForReview(OWNER_ID, REQUEST_ID)).rejects.toMatchObject({
      status: 409
    });
  });

  it('blocks activation from unsupported statuses', async () => {
    repository.findByIdForOwner.mockResolvedValue(makeRequest(EmergencyAccessStatus.ACTIVE));

    await expect(service.activateForReview(OWNER_ID, REQUEST_ID)).rejects.toMatchObject({
      status: 409
    });
  });

  it('expires active access after the expiry time', async () => {
    repository.findByIdForOwner.mockResolvedValue({
      ...makeRequest(EmergencyAccessStatus.ACTIVE),
      expiresAt: new Date('2026-08-18T00:00:00.000Z')
    });

    await service.expireIfNeeded(OWNER_ID, REQUEST_ID);

    expect(repository.transitionStatus).toHaveBeenCalledWith(
      REQUEST_ID,
      OWNER_ID,
      {
        status: EmergencyAccessStatus.EXPIRED,
        closedAt: NOW
      },
      'ACCESS_EXPIRED',
      {},
      [EmergencyAccessStatus.ACTIVE]
    );
  });

  it('returns 409 when a concurrent update wins before expiry', async () => {
    repository.findByIdForOwner.mockResolvedValue({
      ...makeRequest(EmergencyAccessStatus.ACTIVE),
      expiresAt: new Date('2026-08-18T00:00:00.000Z')
    });
    repository.transitionStatus.mockResolvedValue(null);

    await expect(service.expireIfNeeded(OWNER_ID, REQUEST_ID)).rejects.toMatchObject({
      status: 409
    });
  });

  it('does not expire active access before the expiry time', async () => {
    repository.findByIdForOwner.mockResolvedValue({
      ...makeRequest(EmergencyAccessStatus.ACTIVE),
      expiresAt: new Date('2026-08-20T00:00:00.000Z')
    });

    await expect(service.expireIfNeeded(OWNER_ID, REQUEST_ID)).resolves.toBeNull();
  });

  it('delegates contact context and audit event lookups', async () => {
    await service.listContactContext(CONTACT_USER_ID);
    await service.listOwnerRequests(OWNER_ID);
    await service.auditEvents(REQUEST_ID);

    expect(repository.findAssignments).toHaveBeenCalledWith(CONTACT_USER_ID);
    expect(repository.findOwnerRequests).toHaveBeenCalledWith(OWNER_ID);
    expect(repository.findAuditEvents).toHaveBeenCalledWith(REQUEST_ID);
  });
});
