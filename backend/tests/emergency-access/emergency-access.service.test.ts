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
import type { HandoverView } from '../../src/handover/handover.types';

const NOW = new Date('2026-08-19T00:00:00.000Z');
const OWNER_ID = '550e8400-e29b-41d4-a716-446655440000';
const CONTACT_USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const CONTACT_ID = '550e8400-e29b-41d4-a716-446655440002';
const REQUEST_ID = '550e8400-e29b-41d4-a716-446655440003';
const BACKUP_USER_ID = '550e8400-e29b-41d4-a716-446655440004';
const BACKUP_CONTACT_ID = '550e8400-e29b-41d4-a716-446655440005';

interface MockRepository {
  findSettings: jest.Mock;
  upsertSettings: jest.Mock;
  findVerifiedAssignment: jest.Mock;
  findVerifiedBackupContacts: jest.Mock;
  findAssignments: jest.Mock;
  findOpenForTrustedContact: jest.Mock;
  createCoolingOffRequest: jest.Mock;
  findOwnerRequests: jest.Mock;
  findByIdForOwner: jest.Mock;
  findByIdForContact: jest.Mock;
  findActiveByIdForContact: jest.Mock;
  findBackupReviewContext: jest.Mock;
  transitionStatus: jest.Mock;
  transitionStatusWithEvents: jest.Mock;
  recordAuditEvent: jest.Mock;
  recordContactHandoverView: jest.Mock;
  findAuditEvents: jest.Mock;
  findNotificationEvents: jest.Mock;
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
    inviteTokenHash: null,
    inviteTokenExpiresAt: null,
    inviteTokenUsedAt: null,
    inviteSentAt: null,
    detail: null,
    createdAt: NOW,
    updatedAt: NOW,
    user: { id: OWNER_ID, name: 'Aisyah Rahman' },
    ...overrides
  };
}

function createRepository(): MockRepository {
  return {
    findSettings: jest.fn().mockResolvedValue({ requireBackupConfirmation: true }),
    upsertSettings: jest.fn().mockResolvedValue({ requireBackupConfirmation: true }),
    findVerifiedAssignment: jest.fn().mockResolvedValue(makeAssignment()),
    findVerifiedBackupContacts: jest.fn().mockResolvedValue([
      {
        id: BACKUP_CONTACT_ID,
        contactUserId: BACKUP_USER_ID,
        name: 'Sara Abdullah',
        role: 'BACKUP'
      }
    ]),
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
    findActiveByIdForContact: jest.fn().mockResolvedValue({
      ...makeRequest(EmergencyAccessStatus.ACTIVE),
      expiresAt: new Date('2026-08-20T00:00:00.000Z'),
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
    findBackupReviewContext: jest.fn().mockResolvedValue({
      request: makeRequest(EmergencyAccessStatus.SECONDARY_REVIEW),
      backupContact: {
        id: BACKUP_CONTACT_ID,
        contactUserId: BACKUP_USER_ID,
        name: 'Sara Abdullah',
        role: 'BACKUP'
      }
    }),
    transitionStatus: jest.fn().mockResolvedValue(makeRequest()),
    transitionStatusWithEvents: jest.fn().mockResolvedValue(makeRequest()),
    recordAuditEvent: jest.fn().mockResolvedValue(undefined),
    recordContactHandoverView: jest.fn().mockResolvedValue(undefined),
    findAuditEvents: jest.fn().mockResolvedValue([] as EmergencyAccessAuditEventModel[]),
    findNotificationEvents: jest.fn().mockResolvedValue([])
  };
}

function makeHandoverView(): HandoverView {
  return {
    instruction: { message: 'Call Sara first.', firstSteps: ['Call Sara'] },
    family: [{ name: 'Amina', relation: 'CHILD', detail: null }],
    contacts: [
      {
        name: 'Sara',
        relation: 'SIBLING',
        role: 'PRIMARY',
        phone: '+60123456789',
        email: 'sara@example.com'
      }
    ],
    locations: [
      {
        name: 'Maybank folder',
        category: 'BANK',
        locationHint: 'Drive / Family / Banking',
        documented: true
      }
    ],
    steps: ['Call Sara'],
    summary: {
      contactCount: 1,
      familyMemberCount: 1,
      locationCount: 1,
      documentedCount: 1
    }
  };
}

describe('EmergencyAccessService', () => {
  let repository: MockRepository;
  let service: EmergencyAccessService;
  const handoverService = {
    preview: jest.fn().mockResolvedValue(makeHandoverView())
  };

  beforeEach(() => {
    repository = createRepository();
    handoverService.preview.mockClear();
    handoverService.preview.mockResolvedValue(makeHandoverView());
    service = new EmergencyAccessService(repository, () => NOW, handoverService);
  });

  it('reads default emergency access settings and updates owner settings', async () => {
    repository.findSettings.mockResolvedValue(null);

    await expect(service.getSettings(OWNER_ID)).resolves.toEqual({
      requireBackupConfirmation: true
    });
    await service.updateSettings(OWNER_ID, { requireBackupConfirmation: false });

    expect(repository.upsertSettings).toHaveBeenCalledWith(OWNER_ID, {
      requireBackupConfirmation: false
    });
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

    expect(repository.transitionStatusWithEvents).toHaveBeenCalledWith(
      REQUEST_ID,
      OWNER_ID,
      {
        status: EmergencyAccessStatus.REJECTED_BY_OWNER,
        closedAt: NOW
      },
      [{ eventType: 'OWNER_REJECTED' }],
      expect.arrayContaining([
        expect.objectContaining({ eventType: 'OWNER_REQUEST_REJECTED' })
      ]),
      [
        EmergencyAccessStatus.REQUESTED,
        EmergencyAccessStatus.COOLING_OFF,
        EmergencyAccessStatus.SECONDARY_REVIEW
      ]
    );
  });

  it('returns 409 when a concurrent update wins before owner rejection', async () => {
    repository.transitionStatusWithEvents.mockResolvedValue(null);

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

  it('returns 404 when the owner cannot access a revoke request', async () => {
    repository.findByIdForOwner.mockResolvedValue(null);

    await expect(service.revokeOwnerRequest(OWNER_ID, REQUEST_ID)).rejects.toMatchObject({
      status: 404
    });
  });

  it('allows owner revoke only for active access', async () => {
    repository.findByIdForOwner.mockResolvedValue(makeRequest(EmergencyAccessStatus.ACTIVE));

    await service.revokeOwnerRequest(OWNER_ID, REQUEST_ID);

    expect(repository.transitionStatusWithEvents).toHaveBeenCalledWith(
      REQUEST_ID,
      OWNER_ID,
      {
        status: EmergencyAccessStatus.SUSPENDED,
        closedAt: NOW
      },
      [{ eventType: 'OWNER_REVOKED' }],
      expect.arrayContaining([
        expect.objectContaining({ eventType: 'ACCESS_REVOKED' })
      ]),
      [EmergencyAccessStatus.ACTIVE]
    );
  });

  it('returns 409 when a concurrent update wins before owner revoke', async () => {
    repository.findByIdForOwner.mockResolvedValue(makeRequest(EmergencyAccessStatus.ACTIVE));
    repository.transitionStatusWithEvents.mockResolvedValue(null);

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

  it('returns 404 when the contact cannot access a close request', async () => {
    repository.findByIdForContact.mockResolvedValue(null);

    await expect(service.closeContactRequest(CONTACT_USER_ID, REQUEST_ID)).rejects.toMatchObject({
      status: 404
    });
  });

  it('expires instead of closing active access after the expiry time', async () => {
    repository.findByIdForContact.mockResolvedValue({
      ...makeRequest(EmergencyAccessStatus.ACTIVE),
      expiresAt: new Date('2026-08-18T00:00:00.000Z'),
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
        status: EmergencyAccessStatus.EXPIRED,
        closedAt: NOW
      },
      'ACCESS_EXPIRED',
      {},
      [EmergencyAccessStatus.ACTIVE]
    );
  });

  it('returns active handover data for a bound contact and records a view audit event', async () => {
    const result = await service.getActiveContactHandover(CONTACT_USER_ID, REQUEST_ID);

    expect(repository.findActiveByIdForContact).toHaveBeenCalledWith(
      CONTACT_USER_ID,
      REQUEST_ID,
      NOW
    );
    expect(handoverService.preview).toHaveBeenCalledWith(OWNER_ID, { mode: 'contact' });
    expect(repository.recordAuditEvent).toHaveBeenCalledWith(
      REQUEST_ID,
      CONTACT_USER_ID,
      'HANDOVER_VIEWED',
      { ownerUserId: OWNER_ID }
    );
    expect(result.family).toHaveLength(1);
    expect(result.family[0]?.name).toBe('Amina');
  });

  it('blocks handover reads for missing, inactive, expired, or unauthorized requests', async () => {
    repository.findActiveByIdForContact.mockResolvedValue(null);

    await expect(
      service.getActiveContactHandover(CONTACT_USER_ID, REQUEST_ID)
    ).rejects.toMatchObject({ status: 403 });
    expect(handoverService.preview).not.toHaveBeenCalled();
  });

  it('returns handover data for a verified assignment without an access request', async () => {
    const result = await service.getVerifiedContactHandover(CONTACT_USER_ID, CONTACT_ID);

    expect(repository.findVerifiedAssignment).toHaveBeenCalledWith(
      CONTACT_USER_ID,
      CONTACT_ID
    );
    expect(handoverService.preview).toHaveBeenCalledWith(OWNER_ID, { mode: 'contact' });
    expect(repository.recordContactHandoverView).toHaveBeenCalledWith({
      ownerUserId: OWNER_ID,
      trustedContactId: CONTACT_ID,
      actorUserId: CONTACT_USER_ID,
      eventType: 'HANDOVER_VIEWED',
      metadata: {
        ownerUserId: OWNER_ID,
        trustedContactId: CONTACT_ID
      }
    });
    expect(result.locations[0]?.name).toBe('Maybank folder');
  });

  it('blocks direct assignment handover reads for unverified contacts', async () => {
    repository.findVerifiedAssignment.mockResolvedValue(null);

    await expect(
      service.getVerifiedContactHandover(CONTACT_USER_ID, CONTACT_ID)
    ).rejects.toMatchObject({ status: 403 });
    expect(handoverService.preview).not.toHaveBeenCalled();
    expect(repository.recordContactHandoverView).not.toHaveBeenCalled();
  });

  it('returns 500 when the handover service is not configured', async () => {
    const serviceWithoutHandover = new EmergencyAccessService(repository, () => NOW);

    await expect(
      serviceWithoutHandover.getActiveContactHandover(CONTACT_USER_ID, REQUEST_ID)
    ).rejects.toMatchObject({ status: 500 });
  });

  it('activates a secondary-review request and sets an expiry', async () => {
    repository.findByIdForOwner.mockResolvedValue(
      makeRequest(EmergencyAccessStatus.SECONDARY_REVIEW)
    );

    await service.activateForReview(OWNER_ID, REQUEST_ID);

    expect(repository.transitionStatusWithEvents).toHaveBeenCalledWith(
      REQUEST_ID,
      OWNER_ID,
      {
        status: EmergencyAccessStatus.ACTIVE,
        activatedAt: NOW,
        expiresAt: new Date('2026-08-22T00:00:00.000Z')
      },
      [{ eventType: 'ACCESS_ACTIVATED' }],
      expect.arrayContaining([
        expect.objectContaining({ eventType: 'ACCESS_ACTIVATED' })
      ]),
      [EmergencyAccessStatus.SECONDARY_REVIEW]
    );
  });

  it('returns 409 when a concurrent update wins before activation', async () => {
    repository.transitionStatusWithEvents.mockResolvedValue(null);

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

  it('returns 404 when the owner cannot access activation', async () => {
    repository.findByIdForOwner.mockResolvedValue(null);

    await expect(service.activateForReview(OWNER_ID, REQUEST_ID)).rejects.toMatchObject({
      status: 404
    });
  });

  it('blocks direct activation from cooling off', async () => {
    repository.findByIdForOwner.mockResolvedValue(makeRequest(EmergencyAccessStatus.COOLING_OFF));

    await expect(service.activateForReview(OWNER_ID, REQUEST_ID)).rejects.toMatchObject({
      status: 409
    });
  });

  it('moves an elapsed cooling-off request into secondary review and notifies backup contacts', async () => {
    repository.findByIdForOwner.mockResolvedValue({
      ...makeRequest(EmergencyAccessStatus.COOLING_OFF),
      coolingOffEndsAt: new Date('2026-08-18T00:00:00.000Z')
    });
    repository.transitionStatusWithEvents.mockResolvedValue(
      makeRequest(EmergencyAccessStatus.SECONDARY_REVIEW)
    );

    await service.startSecondaryReview(OWNER_ID, REQUEST_ID);

    expect(repository.transitionStatusWithEvents).toHaveBeenCalledWith(
      REQUEST_ID,
      OWNER_ID,
      { status: EmergencyAccessStatus.SECONDARY_REVIEW },
      [
        {
          eventType: 'SECONDARY_REVIEW_STARTED',
          metadata: { backupContactCount: '1' }
        }
      ],
      expect.arrayContaining([
        expect.objectContaining({
          trustedContactId: BACKUP_CONTACT_ID,
          eventType: 'BACKUP_CONFIRMATION_REQUESTED'
        })
      ]),
      [EmergencyAccessStatus.COOLING_OFF]
    );
  });

  it('blocks secondary review before the cooling-off period ends', async () => {
    repository.findByIdForOwner.mockResolvedValue(makeRequest(EmergencyAccessStatus.COOLING_OFF));

    await expect(service.startSecondaryReview(OWNER_ID, REQUEST_ID)).rejects.toMatchObject({
      status: 409
    });
  });

  it('returns 404 when secondary review is not owned by the planner', async () => {
    repository.findByIdForOwner.mockResolvedValue(null);

    await expect(service.startSecondaryReview(OWNER_ID, REQUEST_ID)).rejects.toMatchObject({
      status: 404
    });
  });

  it('blocks secondary review from unsupported statuses', async () => {
    repository.findByIdForOwner.mockResolvedValue(makeRequest(EmergencyAccessStatus.ACTIVE));

    await expect(service.startSecondaryReview(OWNER_ID, REQUEST_ID)).rejects.toMatchObject({
      status: 409
    });
  });

  it('requires a verified backup contact before secondary review', async () => {
    repository.findByIdForOwner.mockResolvedValue({
      ...makeRequest(EmergencyAccessStatus.COOLING_OFF),
      coolingOffEndsAt: new Date('2026-08-18T00:00:00.000Z')
    });
    repository.findVerifiedBackupContacts.mockResolvedValue([]);

    await expect(service.startSecondaryReview(OWNER_ID, REQUEST_ID)).rejects.toMatchObject({
      status: 409
    });
  });

  it('returns 409 when a concurrent update wins before secondary review', async () => {
    repository.findByIdForOwner.mockResolvedValue({
      ...makeRequest(EmergencyAccessStatus.COOLING_OFF),
      coolingOffEndsAt: new Date('2026-08-18T00:00:00.000Z')
    });
    repository.transitionStatusWithEvents.mockResolvedValue(null);

    await expect(service.startSecondaryReview(OWNER_ID, REQUEST_ID)).rejects.toMatchObject({
      status: 409
    });
  });

  it('activates without backup confirmation when owner settings disable it', async () => {
    repository.findSettings.mockResolvedValue({ requireBackupConfirmation: false });
    repository.findByIdForOwner.mockResolvedValue({
      ...makeRequest(EmergencyAccessStatus.COOLING_OFF),
      coolingOffEndsAt: new Date('2026-08-18T00:00:00.000Z')
    });

    await service.startSecondaryReview(OWNER_ID, REQUEST_ID);

    expect(repository.findVerifiedBackupContacts).not.toHaveBeenCalled();
    expect(repository.transitionStatusWithEvents).toHaveBeenCalledWith(
      REQUEST_ID,
      OWNER_ID,
      expect.objectContaining({ status: EmergencyAccessStatus.ACTIVE }),
      [{ eventType: 'ACCESS_ACTIVATED' }],
      expect.arrayContaining([
        expect.objectContaining({ eventType: 'ACCESS_ACTIVATED' })
      ]),
      [EmergencyAccessStatus.COOLING_OFF]
    );
  });

  it('lets a verified backup contact confirm secondary review and activate access', async () => {
    repository.transitionStatusWithEvents.mockResolvedValue(makeRequest(EmergencyAccessStatus.ACTIVE));

    await service.confirmBackupReview(BACKUP_USER_ID, REQUEST_ID);

    expect(repository.findBackupReviewContext).toHaveBeenCalledWith(BACKUP_USER_ID, REQUEST_ID);
    expect(repository.transitionStatusWithEvents).toHaveBeenCalledWith(
      REQUEST_ID,
      BACKUP_USER_ID,
      {
        status: EmergencyAccessStatus.ACTIVE,
        activatedAt: NOW,
        expiresAt: new Date('2026-08-22T00:00:00.000Z')
      },
      [
        {
          eventType: 'BACKUP_CONFIRMED',
          metadata: { backupContactId: BACKUP_CONTACT_ID }
        },
        { eventType: 'ACCESS_ACTIVATED' }
      ],
      expect.arrayContaining([
        expect.objectContaining({ eventType: 'ACCESS_ACTIVATED' })
      ]),
      [EmergencyAccessStatus.SECONDARY_REVIEW]
    );
  });

  it('returns 404 when backup confirmation is not authorized', async () => {
    repository.findBackupReviewContext.mockResolvedValue(null);

    await expect(service.confirmBackupReview(BACKUP_USER_ID, REQUEST_ID)).rejects.toMatchObject({
      status: 404
    });
  });

  it('returns 409 when a concurrent update wins before backup confirmation', async () => {
    repository.transitionStatusWithEvents.mockResolvedValue(null);

    await expect(service.confirmBackupReview(BACKUP_USER_ID, REQUEST_ID)).rejects.toMatchObject({
      status: 409
    });
  });

  it('lets a verified backup contact deny secondary review', async () => {
    repository.transitionStatusWithEvents.mockResolvedValue(makeRequest(EmergencyAccessStatus.DENIED));

    await service.denyBackupReview(BACKUP_USER_ID, REQUEST_ID);

    expect(repository.transitionStatusWithEvents).toHaveBeenCalledWith(
      REQUEST_ID,
      BACKUP_USER_ID,
      {
        status: EmergencyAccessStatus.DENIED,
        closedAt: NOW
      },
      [
        {
          eventType: 'BACKUP_DENIED',
          metadata: { backupContactId: BACKUP_CONTACT_ID }
        }
      ],
      expect.arrayContaining([
        expect.objectContaining({ eventType: 'BACKUP_CONFIRMATION_DENIED' })
      ]),
      [EmergencyAccessStatus.SECONDARY_REVIEW]
    );
  });

  it('returns 404 when backup denial is not authorized', async () => {
    repository.findBackupReviewContext.mockResolvedValue(null);

    await expect(service.denyBackupReview(BACKUP_USER_ID, REQUEST_ID)).rejects.toMatchObject({
      status: 404
    });
  });

  it('returns 409 when a concurrent update wins before backup denial', async () => {
    repository.transitionStatusWithEvents.mockResolvedValue(null);

    await expect(service.denyBackupReview(BACKUP_USER_ID, REQUEST_ID)).rejects.toMatchObject({
      status: 409
    });
  });

  it('expires active access after the expiry time', async () => {
    repository.findByIdForOwner.mockResolvedValue({
      ...makeRequest(EmergencyAccessStatus.ACTIVE),
      expiresAt: new Date('2026-08-18T00:00:00.000Z')
    });

    await service.expireIfNeeded(OWNER_ID, REQUEST_ID);

    expect(repository.transitionStatusWithEvents).toHaveBeenCalledWith(
      REQUEST_ID,
      OWNER_ID,
      {
        status: EmergencyAccessStatus.EXPIRED,
        closedAt: NOW
      },
      [{ eventType: 'ACCESS_EXPIRED' }],
      expect.arrayContaining([
        expect.objectContaining({ eventType: 'ACCESS_EXPIRED' })
      ]),
      [EmergencyAccessStatus.ACTIVE]
    );
  });

  it('returns 409 when a concurrent update wins before expiry', async () => {
    repository.findByIdForOwner.mockResolvedValue({
      ...makeRequest(EmergencyAccessStatus.ACTIVE),
      expiresAt: new Date('2026-08-18T00:00:00.000Z')
    });
    repository.transitionStatusWithEvents.mockResolvedValue(null);

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
    await service.notificationEvents(REQUEST_ID);

    expect(repository.findAssignments).toHaveBeenCalledWith(CONTACT_USER_ID, NOW);
    expect(repository.findOwnerRequests).toHaveBeenCalledWith(OWNER_ID);
    expect(repository.findAuditEvents).toHaveBeenCalledWith(REQUEST_ID);
    expect(repository.findNotificationEvents).toHaveBeenCalledWith(REQUEST_ID);
  });
});
