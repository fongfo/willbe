import { EmergencyAccessStatus, NotificationChannel } from '../generated/prisma/enums';
import type {
  EmergencyAccessAuditEventModel as EmergencyAccessAuditEvent,
  ContactHandoverViewAuditEventModel as ContactHandoverViewAuditEvent,
  EmergencyAccessNotificationEventModel as EmergencyAccessNotificationEvent,
  EmergencyAccessRequestModel as EmergencyAccessRequest
} from '../generated/prisma/models';
import { HttpError } from '../shared/http-error';
import type { HandoverView } from '../handover/handover.types';
import type {
  CreateEmergencyAccessRequestInput,
  UpdateEmergencyAccessSettingsInput
} from './emergency-access.schema';
import type {
  BackupContactNotificationTarget,
  BackupReviewContext,
  EmergencyAccessRequestWithContact,
  TrustedContactAccessAssignment
} from './emergency-access.repository';

interface EmergencyAccessRepositoryLike {
  findSettings(ownerUserId: string): Promise<{ requireBackupConfirmation: boolean } | null>;
  upsertSettings(
    ownerUserId: string,
    input: UpdateEmergencyAccessSettingsInput
  ): Promise<{ requireBackupConfirmation: boolean }>;
  findVerifiedAssignment(
    contactUserId: string,
    trustedContactId: string
  ): Promise<TrustedContactAccessAssignment | null>;
  findVerifiedBackupContacts(ownerUserId: string): Promise<BackupContactNotificationTarget[]>;
  findAssignments(contactUserId: string, now?: Date): Promise<TrustedContactAccessAssignment[]>;
  findOpenForTrustedContact(
    trustedContactId: string
  ): Promise<EmergencyAccessRequest | null>;
  createCoolingOffRequest(
    requesterUserId: string,
    input: CreateEmergencyAccessRequestInput,
    timing: { now: Date; coolingOffEndsAt: Date }
  ): Promise<EmergencyAccessRequest | null>;
  findOwnerRequests(ownerUserId: string): Promise<EmergencyAccessRequestWithContact[]>;
  findByIdForOwner(ownerUserId: string, id: string): Promise<EmergencyAccessRequest | null>;
  findByIdForContact(
    contactUserId: string,
    id: string
  ): Promise<EmergencyAccessRequestWithContact | null>;
  findActiveByIdForContact(
    contactUserId: string,
    id: string,
    now: Date
  ): Promise<EmergencyAccessRequestWithContact | null>;
  findBackupReviewContext(
    contactUserId: string,
    id: string
  ): Promise<BackupReviewContext | null>;
  transitionStatus(
    id: string,
    actorUserId: string,
    data: {
      status: EmergencyAccessStatus;
      activatedAt?: Date | null;
      expiresAt?: Date | null;
      closedAt?: Date | null;
    },
    eventType: string,
    metadata?: Record<string, string>,
    allowedStatuses?: readonly EmergencyAccessStatus[]
  ): Promise<EmergencyAccessRequest | null>;
  transitionStatusWithEvents(
    id: string,
    actorUserId: string,
    data: {
      status: EmergencyAccessStatus;
      activatedAt?: Date | null;
      expiresAt?: Date | null;
      closedAt?: Date | null;
    },
    auditEvents: { eventType: string; metadata?: Record<string, string> }[],
    notifications: {
      recipientUserId?: string | null;
      trustedContactId?: string | null;
      channel: NotificationChannel;
      eventType: string;
      metadata?: Record<string, string>;
    }[],
    allowedStatuses?: readonly EmergencyAccessStatus[]
  ): Promise<EmergencyAccessRequest | null>;
  recordAuditEvent(
    accessRequestId: string,
    actorUserId: string,
    eventType: string,
    metadata?: Record<string, string>
  ): Promise<EmergencyAccessAuditEvent>;
  recordContactHandoverView(input: {
    ownerUserId: string;
    trustedContactId: string;
    actorUserId: string | null;
    eventType: string;
    metadata?: Record<string, string>;
  }): Promise<ContactHandoverViewAuditEvent>;
  findAuditEvents(accessRequestId: string): Promise<EmergencyAccessAuditEvent[]>;
  findNotificationEvents(accessRequestId: string): Promise<EmergencyAccessNotificationEvent[]>;
}

interface HandoverServiceLike {
  preview(ownerUserId: string, options?: { mode?: 'owner' | 'contact' }): Promise<HandoverView>;
}

const REQUEST_NOT_FOUND = 'Emergency access request not found';
const COOLING_OFF_HOURS = 24;
const ACTIVE_ACCESS_HOURS = 72;

const TERMINAL_STATUSES = new Set<EmergencyAccessStatus>([
  EmergencyAccessStatus.DENIED,
  EmergencyAccessStatus.REJECTED_BY_OWNER,
  EmergencyAccessStatus.SUSPENDED,
  EmergencyAccessStatus.CLOSED,
  EmergencyAccessStatus.EXPIRED
]);

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function isRejectable(status: EmergencyAccessStatus): boolean {
  const rejectableStatuses: EmergencyAccessStatus[] = [
    EmergencyAccessStatus.REQUESTED,
    EmergencyAccessStatus.COOLING_OFF,
    EmergencyAccessStatus.SECONDARY_REVIEW
  ];
  return rejectableStatuses.includes(status);
}

function isClosable(status: EmergencyAccessStatus): boolean {
  return status === EmergencyAccessStatus.ACTIVE;
}

export class EmergencyAccessService {
  constructor(
    private readonly repository: EmergencyAccessRepositoryLike,
    private readonly now: () => Date = () => new Date(),
    private readonly handoverService?: HandoverServiceLike
  ) {}

  async getSettings(ownerUserId: string): Promise<{ requireBackupConfirmation: boolean }> {
    const settings = await this.repository.findSettings(ownerUserId);
    return {
      requireBackupConfirmation: settings?.requireBackupConfirmation ?? true
    };
  }

  async updateSettings(
    ownerUserId: string,
    input: UpdateEmergencyAccessSettingsInput
  ): Promise<{ requireBackupConfirmation: boolean }> {
    const settings = await this.repository.upsertSettings(ownerUserId, input);
    return {
      requireBackupConfirmation: settings.requireBackupConfirmation
    };
  }

  listContactContext(contactUserId: string): Promise<TrustedContactAccessAssignment[]> {
    return this.repository.findAssignments(contactUserId, this.now());
  }

  async createRequest(
    requesterUserId: string,
    input: CreateEmergencyAccessRequestInput
  ): Promise<EmergencyAccessRequest> {
    const assignment = await this.repository.findVerifiedAssignment(
      requesterUserId,
      input.trustedContactId
    );
    if (!assignment) {
      throw new HttpError(403, 'Trusted contact is not verified for this plan');
    }
    if (assignment.userId !== input.ownerUserId) {
      throw new HttpError(403, 'Trusted contact is not bound to this owner plan');
    }

    const existing = await this.repository.findOpenForTrustedContact(input.trustedContactId);
    if (existing && !TERMINAL_STATUSES.has(existing.status)) {
      throw new HttpError(409, 'An emergency access request is already open');
    }

    const now = this.now();
    const created = await this.repository.createCoolingOffRequest(requesterUserId, input, {
      now,
      coolingOffEndsAt: addHours(now, COOLING_OFF_HOURS)
    });
    if (!created) {
      throw new HttpError(409, 'An emergency access request is already open');
    }
    return created;
  }

  listOwnerRequests(ownerUserId: string): Promise<EmergencyAccessRequestWithContact[]> {
    return this.repository.findOwnerRequests(ownerUserId);
  }

  async getContactRequest(
    contactUserId: string,
    id: string
  ): Promise<EmergencyAccessRequestWithContact> {
    const request = await this.repository.findByIdForContact(contactUserId, id);
    if (!request) {
      throw new HttpError(404, REQUEST_NOT_FOUND);
    }
    return request;
  }

  async rejectOwnerRequest(ownerUserId: string, id: string): Promise<EmergencyAccessRequest> {
    const request = await this.repository.findByIdForOwner(ownerUserId, id);
    if (!request) {
      throw new HttpError(404, REQUEST_NOT_FOUND);
    }
    if (!isRejectable(request.status)) {
      throw new HttpError(409, 'Emergency access request cannot be rejected now');
    }
    const updated = await this.repository.transitionStatusWithEvents(
      id,
      ownerUserId,
      {
        status: EmergencyAccessStatus.REJECTED_BY_OWNER,
        closedAt: this.now()
      },
      [{ eventType: 'OWNER_REJECTED' }],
      [
        {
          recipientUserId: request.requesterUserId,
          channel: NotificationChannel.PUSH,
          eventType: 'OWNER_REQUEST_REJECTED'
        },
        {
          recipientUserId: request.requesterUserId,
          channel: NotificationChannel.EMAIL,
          eventType: 'OWNER_REQUEST_REJECTED'
        }
      ],
      [
        EmergencyAccessStatus.REQUESTED,
        EmergencyAccessStatus.COOLING_OFF,
        EmergencyAccessStatus.SECONDARY_REVIEW
      ]
    );
    if (!updated) {
      throw new HttpError(409, 'Emergency access request cannot be rejected now');
    }
    return updated;
  }

  async revokeOwnerRequest(ownerUserId: string, id: string): Promise<EmergencyAccessRequest> {
    const request = await this.repository.findByIdForOwner(ownerUserId, id);
    if (!request) {
      throw new HttpError(404, REQUEST_NOT_FOUND);
    }
    if (request.status !== EmergencyAccessStatus.ACTIVE) {
      throw new HttpError(409, 'Only active emergency access can be revoked');
    }
    const updated = await this.repository.transitionStatusWithEvents(
      id,
      ownerUserId,
      {
        status: EmergencyAccessStatus.SUSPENDED,
        closedAt: this.now()
      },
      [{ eventType: 'OWNER_REVOKED' }],
      [
        {
          recipientUserId: request.requesterUserId,
          channel: NotificationChannel.PUSH,
          eventType: 'ACCESS_REVOKED'
        },
        {
          recipientUserId: request.requesterUserId,
          channel: NotificationChannel.EMAIL,
          eventType: 'ACCESS_REVOKED'
        }
      ],
      [EmergencyAccessStatus.ACTIVE]
    );
    if (!updated) {
      throw new HttpError(409, 'Only active emergency access can be revoked');
    }
    return updated;
  }

  async closeContactRequest(contactUserId: string, id: string): Promise<EmergencyAccessRequest> {
    const request = await this.repository.findByIdForContact(contactUserId, id);
    if (!request) {
      throw new HttpError(404, REQUEST_NOT_FOUND);
    }
    if (!isClosable(request.status)) {
      throw new HttpError(409, 'Only active emergency access can be closed');
    }
    if (request.expiresAt && request.expiresAt <= this.now()) {
      const expired = await this.repository.transitionStatus(
        id,
        contactUserId,
        {
          status: EmergencyAccessStatus.EXPIRED,
          closedAt: this.now()
        },
        'ACCESS_EXPIRED',
        {},
        [EmergencyAccessStatus.ACTIVE]
      );
      if (!expired) {
        throw new HttpError(409, 'Emergency access request cannot be expired now');
      }
      return expired;
    }
    const updated = await this.repository.transitionStatus(
      id,
      contactUserId,
      {
        status: EmergencyAccessStatus.CLOSED,
        closedAt: this.now()
      },
      'ACCESS_CLOSED',
      {},
      [EmergencyAccessStatus.ACTIVE]
    );
    if (!updated) {
      throw new HttpError(409, 'Only active emergency access can be closed');
    }
    return updated;
  }

  async getActiveContactHandover(
    contactUserId: string,
    id: string
  ): Promise<HandoverView> {
    if (!this.handoverService) {
      throw new HttpError(500, 'Emergency handover service is not configured');
    }
    const request = await this.repository.findActiveByIdForContact(
      contactUserId,
      id,
      this.now()
    );
    if (!request) {
      throw new HttpError(403, 'Emergency access is not active');
    }
    const view = await this.handoverService.preview(request.ownerUserId, { mode: 'contact' });
    await this.repository.recordAuditEvent(id, contactUserId, 'HANDOVER_VIEWED', {
      ownerUserId: request.ownerUserId
    });
    return view;
  }

  async getVerifiedContactHandover(
    contactUserId: string,
    trustedContactId: string
  ): Promise<HandoverView> {
    if (!this.handoverService) {
      throw new HttpError(500, 'Emergency handover service is not configured');
    }
    const assignment = await this.repository.findVerifiedAssignment(
      contactUserId,
      trustedContactId
    );
    if (!assignment) {
      throw new HttpError(403, 'Trusted contact is not verified for this plan');
    }
    const view = await this.handoverService.preview(assignment.userId, { mode: 'contact' });
    await this.repository.recordContactHandoverView({
      ownerUserId: assignment.userId,
      trustedContactId: assignment.id,
      actorUserId: contactUserId,
      eventType: 'HANDOVER_VIEWED',
      metadata: {
        ownerUserId: assignment.userId,
        trustedContactId: assignment.id
      }
    });
    return view;
  }

  async activateForReview(
    ownerUserId: string,
    id: string
  ): Promise<EmergencyAccessRequest> {
    const request = await this.repository.findByIdForOwner(ownerUserId, id);
    if (!request) {
      throw new HttpError(404, REQUEST_NOT_FOUND);
    }
    if (request.status !== EmergencyAccessStatus.SECONDARY_REVIEW) {
      throw new HttpError(409, 'Emergency access request cannot be activated now');
    }
    const now = this.now();
    const updated = await this.repository.transitionStatusWithEvents(
      id,
      ownerUserId,
      {
        status: EmergencyAccessStatus.ACTIVE,
        activatedAt: now,
        expiresAt: addHours(now, ACTIVE_ACCESS_HOURS)
      },
      [{ eventType: 'ACCESS_ACTIVATED' }],
      [
        {
          recipientUserId: ownerUserId,
          channel: NotificationChannel.PUSH,
          eventType: 'ACCESS_ACTIVATED'
        },
        {
          recipientUserId: request.requesterUserId,
          channel: NotificationChannel.PUSH,
          eventType: 'ACCESS_ACTIVATED'
        },
        {
          recipientUserId: request.requesterUserId,
          channel: NotificationChannel.EMAIL,
          eventType: 'ACCESS_ACTIVATED'
        }
      ],
      [EmergencyAccessStatus.SECONDARY_REVIEW]
    );
    if (!updated) {
      throw new HttpError(409, 'Emergency access request cannot be activated now');
    }
    return updated;
  }

  async startSecondaryReview(ownerUserId: string, id: string): Promise<EmergencyAccessRequest> {
    const request = await this.repository.findByIdForOwner(ownerUserId, id);
    if (!request) {
      throw new HttpError(404, REQUEST_NOT_FOUND);
    }
    if (request.status !== EmergencyAccessStatus.COOLING_OFF) {
      throw new HttpError(409, 'Emergency access request cannot enter secondary review now');
    }
    if (request.coolingOffEndsAt && request.coolingOffEndsAt > this.now()) {
      throw new HttpError(409, 'Cooling-off period has not ended');
    }

    const settings = await this.getSettings(ownerUserId);
    if (!settings.requireBackupConfirmation) {
      const now = this.now();
      const updated = await this.repository.transitionStatusWithEvents(
        id,
        ownerUserId,
        {
          status: EmergencyAccessStatus.ACTIVE,
          activatedAt: now,
          expiresAt: addHours(now, ACTIVE_ACCESS_HOURS)
        },
        [{ eventType: 'ACCESS_ACTIVATED' }],
        [
          {
            recipientUserId: ownerUserId,
            channel: NotificationChannel.PUSH,
            eventType: 'ACCESS_ACTIVATED'
          },
          {
            recipientUserId: request.requesterUserId,
            channel: NotificationChannel.PUSH,
            eventType: 'ACCESS_ACTIVATED'
          },
          {
            recipientUserId: request.requesterUserId,
            channel: NotificationChannel.EMAIL,
            eventType: 'ACCESS_ACTIVATED'
          }
        ],
        [EmergencyAccessStatus.COOLING_OFF]
      );
      if (!updated) {
        throw new HttpError(409, 'Emergency access request cannot be activated now');
      }
      return updated;
    }

    const backupContacts = await this.repository.findVerifiedBackupContacts(ownerUserId);
    if (backupContacts.length === 0) {
      throw new HttpError(409, 'A verified backup contact is required for secondary review');
    }

    const updated = await this.repository.transitionStatusWithEvents(
      id,
      ownerUserId,
      { status: EmergencyAccessStatus.SECONDARY_REVIEW },
      [
        {
          eventType: 'SECONDARY_REVIEW_STARTED',
          metadata: {
            backupContactCount: String(backupContacts.length)
          }
        }
      ],
      backupContacts.flatMap((contact) => [
        {
          recipientUserId: contact.contactUserId,
          trustedContactId: contact.id,
          channel: NotificationChannel.PUSH,
          eventType: 'BACKUP_CONFIRMATION_REQUESTED',
          metadata: { backupContactId: contact.id }
        },
        {
          recipientUserId: contact.contactUserId,
          trustedContactId: contact.id,
          channel: NotificationChannel.EMAIL,
          eventType: 'BACKUP_CONFIRMATION_REQUESTED',
          metadata: { backupContactId: contact.id }
        }
      ]),
      [EmergencyAccessStatus.COOLING_OFF]
    );
    if (!updated) {
      throw new HttpError(409, 'Emergency access request cannot enter secondary review now');
    }
    return updated;
  }

  async confirmBackupReview(
    contactUserId: string,
    id: string
  ): Promise<EmergencyAccessRequest> {
    const context = await this.repository.findBackupReviewContext(contactUserId, id);
    if (!context) {
      throw new HttpError(404, REQUEST_NOT_FOUND);
    }
    const now = this.now();
    const updated = await this.repository.transitionStatusWithEvents(
      id,
      contactUserId,
      {
        status: EmergencyAccessStatus.ACTIVE,
        activatedAt: now,
        expiresAt: addHours(now, ACTIVE_ACCESS_HOURS)
      },
      [
        {
          eventType: 'BACKUP_CONFIRMED',
          metadata: { backupContactId: context.backupContact.id }
        },
        { eventType: 'ACCESS_ACTIVATED' }
      ],
      [
        {
          recipientUserId: context.request.ownerUserId,
          channel: NotificationChannel.PUSH,
          eventType: 'ACCESS_ACTIVATED'
        },
        {
          recipientUserId: context.request.requesterUserId,
          channel: NotificationChannel.PUSH,
          eventType: 'ACCESS_ACTIVATED'
        },
        {
          recipientUserId: context.request.requesterUserId,
          channel: NotificationChannel.EMAIL,
          eventType: 'ACCESS_ACTIVATED'
        }
      ],
      [EmergencyAccessStatus.SECONDARY_REVIEW]
    );
    if (!updated) {
      throw new HttpError(409, 'Emergency access request cannot be confirmed now');
    }
    return updated;
  }

  async denyBackupReview(
    contactUserId: string,
    id: string
  ): Promise<EmergencyAccessRequest> {
    const context = await this.repository.findBackupReviewContext(contactUserId, id);
    if (!context) {
      throw new HttpError(404, REQUEST_NOT_FOUND);
    }
    const updated = await this.repository.transitionStatusWithEvents(
      id,
      contactUserId,
      {
        status: EmergencyAccessStatus.DENIED,
        closedAt: this.now()
      },
      [
        {
          eventType: 'BACKUP_DENIED',
          metadata: { backupContactId: context.backupContact.id }
        }
      ],
      [
        {
          recipientUserId: context.request.ownerUserId,
          channel: NotificationChannel.PUSH,
          eventType: 'BACKUP_CONFIRMATION_DENIED'
        },
        {
          recipientUserId: context.request.requesterUserId,
          channel: NotificationChannel.PUSH,
          eventType: 'BACKUP_CONFIRMATION_DENIED'
        },
        {
          recipientUserId: context.request.requesterUserId,
          channel: NotificationChannel.EMAIL,
          eventType: 'BACKUP_CONFIRMATION_DENIED'
        }
      ],
      [EmergencyAccessStatus.SECONDARY_REVIEW]
    );
    if (!updated) {
      throw new HttpError(409, 'Emergency access request cannot be denied now');
    }
    return updated;
  }

  async expireIfNeeded(
    ownerUserId: string,
    id: string
  ): Promise<EmergencyAccessRequest | null> {
    const request = await this.repository.findByIdForOwner(ownerUserId, id);
    if (!request) {
      throw new HttpError(404, REQUEST_NOT_FOUND);
    }
    if (
      request.status !== EmergencyAccessStatus.ACTIVE ||
      !request.expiresAt ||
      request.expiresAt > this.now()
    ) {
      return null;
    }
    const updated = await this.repository.transitionStatusWithEvents(
      id,
      ownerUserId,
      {
        status: EmergencyAccessStatus.EXPIRED,
        closedAt: this.now()
      },
      [{ eventType: 'ACCESS_EXPIRED' }],
      [
        {
          recipientUserId: request.requesterUserId,
          channel: NotificationChannel.PUSH,
          eventType: 'ACCESS_EXPIRED'
        },
        {
          recipientUserId: request.requesterUserId,
          channel: NotificationChannel.EMAIL,
          eventType: 'ACCESS_EXPIRED'
        }
      ],
      [EmergencyAccessStatus.ACTIVE]
    );
    if (!updated) {
      throw new HttpError(409, 'Emergency access request cannot be expired now');
    }
    return updated;
  }

  auditEvents(accessRequestId: string): Promise<EmergencyAccessAuditEvent[]> {
    return this.repository.findAuditEvents(accessRequestId);
  }

  notificationEvents(accessRequestId: string): Promise<EmergencyAccessNotificationEvent[]> {
    return this.repository.findNotificationEvents(accessRequestId);
  }
}
