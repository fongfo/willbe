import { createHash } from 'crypto';
import { prisma } from '../db/client';
import {
  ContactRole,
  EmergencyAccessStatus,
  NotificationChannel,
  VerificationStatus
} from '../generated/prisma/enums';
import { Prisma } from '../generated/prisma/client';
import type {
  EmergencyAccessAuditEventModel as EmergencyAccessAuditEvent,
  ContactHandoverViewAuditEventModel as ContactHandoverViewAuditEvent,
  EmergencyAccessNotificationEventModel as EmergencyAccessNotificationEvent,
  EmergencyAccessRequestModel as EmergencyAccessRequest,
  EmergencyAccessSettingModel as EmergencyAccessSetting,
  TrustedContactModel as TrustedContact,
  UserModel as User
} from '../generated/prisma/models';
import type {
  CreateEmergencyAccessRequestInput,
  UpdateEmergencyAccessSettingsInput
} from './emergency-access.schema';

type ContactContextRequestBase = Pick<
  EmergencyAccessRequest,
  | 'id'
  | 'status'
  | 'reason'
  | 'reasonDetail'
  | 'coolingOffEndsAt'
  | 'activatedAt'
  | 'expiresAt'
  | 'closedAt'
  | 'createdAt'
>;

type ContactContextRequest = ContactContextRequestBase & {
  reviewRole?: 'REQUESTER' | 'BACKUP_REVIEWER';
};

function effectiveRequestStatus(
  request: ContactContextRequest,
  now: Date
): EmergencyAccessStatus {
  if (
    request.status === EmergencyAccessStatus.ACTIVE &&
    request.expiresAt &&
    request.expiresAt <= now
  ) {
    return EmergencyAccessStatus.EXPIRED;
  }
  return request.status;
}

export interface TrustedContactAccessAssignment extends TrustedContact {
  user: Pick<User, 'id' | 'name'>;
  emergencyAccessRequests?: ContactContextRequest[];
}

export interface EmergencyAccessRequestWithContact extends EmergencyAccessRequest {
  trustedContact: Pick<
    TrustedContact,
    'id' | 'name' | 'relation' | 'role' | 'phone' | 'email' | 'verificationStatus'
  >;
}

export interface BackupReviewContext {
  request: EmergencyAccessRequest;
  backupContact: Pick<TrustedContact, 'id' | 'contactUserId' | 'name' | 'role'>;
}

export type BackupContactNotificationTarget = Pick<
  TrustedContact,
  'id' | 'contactUserId' | 'name' | 'role'
>;

export type EmergencyAccessAuditMetadata = Prisma.InputJsonObject;
type NotificationEventInput = {
  recipientUserId?: string | null;
  trustedContactId?: string | null;
  channel: NotificationChannel;
  eventType: string;
  metadata?: Prisma.InputJsonObject;
};
const UNIQUE_CONSTRAINT_CODE = 'P2002';

const OPEN_STATUSES: EmergencyAccessStatus[] = [
  EmergencyAccessStatus.REQUESTED,
  EmergencyAccessStatus.COOLING_OFF,
  EmergencyAccessStatus.SECONDARY_REVIEW,
  EmergencyAccessStatus.ACTIVE
];

function normalizeForHash(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(normalizeForHash);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = normalizeForHash((value as Record<string, unknown>)[key]);
        return result;
      }, {});
  }
  return value;
}

function proofHash(input: {
  accessRequestId: string;
  actorUserId: string | null;
  eventType: string;
  metadata: EmergencyAccessAuditMetadata;
}): string {
  const payload = normalizeForHash({
    version: 'audit-proof-v1',
    accessRequestId: input.accessRequestId,
    actorUserId: input.actorUserId,
    eventType: input.eventType,
    metadata: input.metadata
  });
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function contactHandoverProofHash(input: {
  ownerUserId: string;
  trustedContactId: string;
  actorUserId: string | null;
  eventType: string;
  metadata: EmergencyAccessAuditMetadata;
}): string {
  const payload = normalizeForHash({
    version: 'audit-proof-v1',
    ownerUserId: input.ownerUserId,
    trustedContactId: input.trustedContactId,
    actorUserId: input.actorUserId,
    eventType: input.eventType,
    metadata: input.metadata
  });
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function auditEventData(
  accessRequestId: string,
  actorUserId: string | null,
  eventType: string,
  metadata: EmergencyAccessAuditMetadata = {}
) {
  return {
    accessRequestId,
    actorUserId,
    eventType,
    metadata,
    proofHash: proofHash({ accessRequestId, actorUserId, eventType, metadata })
  };
}

function notificationEvents(
  accessRequestId: string,
  events: NotificationEventInput[]
) {
  return events.map((event) => ({
    accessRequestId,
    recipientUserId: event.recipientUserId ?? null,
    trustedContactId: event.trustedContactId ?? null,
    channel: event.channel,
    eventType: event.eventType,
    metadata: event.metadata ?? {}
  }));
}

export class EmergencyAccessRepository {
  findSettings(ownerUserId: string): Promise<EmergencyAccessSetting | null> {
    return prisma.emergencyAccessSetting.findUnique({
      where: { userId: ownerUserId }
    });
  }

  upsertSettings(
    ownerUserId: string,
    input: UpdateEmergencyAccessSettingsInput
  ): Promise<EmergencyAccessSetting> {
    return prisma.emergencyAccessSetting.upsert({
      where: { userId: ownerUserId },
      create: {
        userId: ownerUserId,
        requireBackupConfirmation: input.requireBackupConfirmation
      },
      update: {
        requireBackupConfirmation: input.requireBackupConfirmation
      }
    });
  }

  findVerifiedAssignment(
    contactUserId: string,
    trustedContactId: string
  ): Promise<TrustedContactAccessAssignment | null> {
    return prisma.trustedContact.findFirst({
      where: {
        id: trustedContactId,
        contactUserId,
        verificationStatus: VerificationStatus.VERIFIED
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  }

  async findAssignments(
    contactUserId: string,
    now: Date = new Date()
  ): Promise<TrustedContactAccessAssignment[]> {
    const assignments = await prisma.trustedContact.findMany({
      where: {
        contactUserId,
        verificationStatus: VerificationStatus.VERIFIED
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        emergencyAccessRequests: {
          where: { requesterUserId: contactUserId },
          select: {
            id: true,
            status: true,
            reason: true,
            reasonDetail: true,
            coolingOffEndsAt: true,
            activatedAt: true,
            expiresAt: true,
            closedAt: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    return Promise.all(
      assignments.map(async (assignment) => {
        const requesterRequest = assignment.emergencyAccessRequests?.[0]
          ? {
              ...assignment.emergencyAccessRequests[0],
              reviewRole: 'REQUESTER' as const
            }
          : null;
        const backupReviewRequest =
          assignment.role === ContactRole.BACKUP
            ? await prisma.emergencyAccessRequest.findFirst({
                where: {
                  ownerUserId: assignment.userId,
                  status: EmergencyAccessStatus.SECONDARY_REVIEW,
                  trustedContactId: { not: assignment.id }
                },
                select: {
                  id: true,
                  status: true,
                  reason: true,
                  reasonDetail: true,
                  coolingOffEndsAt: true,
                  activatedAt: true,
                  expiresAt: true,
                  closedAt: true,
                  createdAt: true
                },
                orderBy: { createdAt: 'desc' }
              })
            : null;
        const backupReviewerRequest = backupReviewRequest
          ? {
              ...backupReviewRequest,
              reviewRole: 'BACKUP_REVIEWER' as const
            }
          : null;
        const latestRequest = backupReviewerRequest ?? requesterRequest;
        return {
          ...assignment,
          emergencyAccessRequests: latestRequest
            ? [{ ...latestRequest, status: effectiveRequestStatus(latestRequest, now) }]
            : []
        };
      })
    );
  }

  findVerifiedBackupContacts(ownerUserId: string): Promise<BackupContactNotificationTarget[]> {
    return prisma.trustedContact.findMany({
      where: {
        userId: ownerUserId,
        role: ContactRole.BACKUP,
        verificationStatus: VerificationStatus.VERIFIED,
        contactUserId: { not: null }
      },
      select: {
        id: true,
        contactUserId: true,
        name: true,
        role: true
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  findOpenForTrustedContact(
    trustedContactId: string
  ): Promise<EmergencyAccessRequest | null> {
    return prisma.emergencyAccessRequest.findFirst({
      where: {
        trustedContactId,
        status: { in: OPEN_STATUSES }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createCoolingOffRequest(
    requesterUserId: string,
    input: CreateEmergencyAccessRequestInput,
    timing: { now: Date; coolingOffEndsAt: Date }
  ): Promise<EmergencyAccessRequest | null> {
    try {
      return await prisma.$transaction(async (tx) => {
        const request = await tx.emergencyAccessRequest.create({
          data: {
            ownerUserId: input.ownerUserId,
            trustedContactId: input.trustedContactId,
            requesterUserId,
            reason: input.reason,
            reasonDetail: input.reasonDetail ?? null,
            status: EmergencyAccessStatus.COOLING_OFF,
            ownerNotifiedAt: timing.now,
            coolingOffEndsAt: timing.coolingOffEndsAt
          }
        });
        await tx.emergencyAccessAuditEvent.createMany({
          data: [
            auditEventData(request.id, requesterUserId, 'ACCESS_REQUESTED', {
              reason: input.reason
            }),
            auditEventData(request.id, requesterUserId, 'OWNER_NOTIFIED', {
              ownerUserId: input.ownerUserId
            }),
            auditEventData(request.id, requesterUserId, 'COOLING_OFF_STARTED', {
              coolingOffEndsAt: timing.coolingOffEndsAt.toISOString()
            })
          ]
        });
        await tx.emergencyAccessNotificationEvent.createMany({
          data: notificationEvents(request.id, [
            {
              recipientUserId: input.ownerUserId,
              channel: NotificationChannel.PUSH,
              eventType: 'OWNER_REQUEST_ALERT',
              metadata: { reason: input.reason }
            },
            {
              recipientUserId: input.ownerUserId,
              channel: NotificationChannel.EMAIL,
              eventType: 'OWNER_REQUEST_ALERT',
              metadata: { reason: input.reason }
            }
          ])
        });
        return request;
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_CODE
      ) {
        return null;
      }
      throw error;
    }
  }

  async findBackupReviewContext(
    contactUserId: string,
    id: string
  ): Promise<BackupReviewContext | null> {
    const request = await prisma.emergencyAccessRequest.findFirst({
      where: {
        id,
        status: EmergencyAccessStatus.SECONDARY_REVIEW,
        owner: {
          trustedContacts: {
            some: {
              contactUserId,
              role: ContactRole.BACKUP,
              verificationStatus: VerificationStatus.VERIFIED
            }
          }
        }
      }
    });
    if (!request || request.requesterUserId === contactUserId) {
      return null;
    }
    const backupContact = await prisma.trustedContact.findFirst({
      where: {
        userId: request.ownerUserId,
        contactUserId,
        role: ContactRole.BACKUP,
        verificationStatus: VerificationStatus.VERIFIED
      },
      select: {
        id: true,
        contactUserId: true,
        name: true,
        role: true
      }
    });
    return backupContact ? { request, backupContact } : null;
  }

  findOwnerRequests(ownerUserId: string): Promise<EmergencyAccessRequestWithContact[]> {
    return prisma.emergencyAccessRequest.findMany({
      where: { ownerUserId },
      include: {
        trustedContact: {
          select: {
            id: true,
            name: true,
            relation: true,
            role: true,
            phone: true,
            email: true,
            verificationStatus: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  findByIdForOwner(
    ownerUserId: string,
    id: string
  ): Promise<EmergencyAccessRequest | null> {
    return prisma.emergencyAccessRequest.findFirst({
      where: { id, ownerUserId }
    });
  }

  findByIdForContact(
    contactUserId: string,
    id: string
  ): Promise<EmergencyAccessRequestWithContact | null> {
    return prisma.emergencyAccessRequest.findFirst({
      where: {
        id,
        requesterUserId: contactUserId,
        trustedContact: {
          contactUserId,
          verificationStatus: VerificationStatus.VERIFIED
        }
      },
      include: {
        trustedContact: {
          select: {
            id: true,
            name: true,
            relation: true,
            role: true,
            phone: true,
            email: true,
            verificationStatus: true
          }
        }
      }
    });
  }

  findActiveByIdForContact(
    contactUserId: string,
    id: string,
    now: Date
  ): Promise<EmergencyAccessRequestWithContact | null> {
    return prisma.emergencyAccessRequest.findFirst({
      where: {
        id,
        requesterUserId: contactUserId,
        status: EmergencyAccessStatus.ACTIVE,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        trustedContact: {
          contactUserId,
          verificationStatus: VerificationStatus.VERIFIED
        }
      },
      include: {
        trustedContact: {
          select: {
            id: true,
            name: true,
            relation: true,
            role: true,
            phone: true,
            email: true,
            verificationStatus: true
          }
        }
      }
    });
  }

  async recordAuditEvent(
    accessRequestId: string,
    actorUserId: string,
    eventType: string,
    metadata: EmergencyAccessAuditMetadata = {}
  ): Promise<EmergencyAccessAuditEvent> {
    return prisma.emergencyAccessAuditEvent.create({
      data: auditEventData(accessRequestId, actorUserId, eventType, metadata)
    });
  }

  async recordContactHandoverView(
    input: {
      ownerUserId: string;
      trustedContactId: string;
      actorUserId: string | null;
      eventType: string;
      metadata?: EmergencyAccessAuditMetadata;
    }
  ): Promise<ContactHandoverViewAuditEvent> {
    const metadata = input.metadata ?? {};
    return prisma.contactHandoverViewAuditEvent.create({
      data: {
        ownerUserId: input.ownerUserId,
        trustedContactId: input.trustedContactId,
        actorUserId: input.actorUserId,
        eventType: input.eventType,
        metadata,
        proofHash: contactHandoverProofHash({
          ownerUserId: input.ownerUserId,
          trustedContactId: input.trustedContactId,
          actorUserId: input.actorUserId,
          eventType: input.eventType,
          metadata
        })
      }
    });
  }

  async transitionStatus(
    id: string,
    actorUserId: string,
    data: {
      status: EmergencyAccessStatus;
      activatedAt?: Date | null;
      expiresAt?: Date | null;
      closedAt?: Date | null;
    },
    eventType: string,
    metadata: EmergencyAccessAuditMetadata = {},
    allowedStatuses: readonly EmergencyAccessStatus[] = []
  ): Promise<EmergencyAccessRequest | null> {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.emergencyAccessRequest.updateMany({
        where: {
          id,
          ...(allowedStatuses.length > 0
            ? { status: { in: [...allowedStatuses] } }
            : {})
        },
        data
      });
      if (updated.count === 0) {
        return null;
      }
      await tx.emergencyAccessAuditEvent.create({
        data: {
          accessRequestId: id,
          actorUserId,
          eventType,
          metadata,
          proofHash: proofHash({ accessRequestId: id, actorUserId, eventType, metadata })
        }
      });
      return tx.emergencyAccessRequest.findUniqueOrThrow({ where: { id } });
    });
  }

  async transitionStatusWithEvents(
    id: string,
    actorUserId: string,
    data: {
      status: EmergencyAccessStatus;
      activatedAt?: Date | null;
      expiresAt?: Date | null;
      closedAt?: Date | null;
    },
    auditEvents: { eventType: string; metadata?: EmergencyAccessAuditMetadata }[],
    notifications: NotificationEventInput[],
    allowedStatuses: readonly EmergencyAccessStatus[] = []
  ): Promise<EmergencyAccessRequest | null> {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.emergencyAccessRequest.updateMany({
        where: {
          id,
          ...(allowedStatuses.length > 0
            ? { status: { in: [...allowedStatuses] } }
            : {})
        },
        data
      });
      if (updated.count === 0) {
        return null;
      }
      await tx.emergencyAccessAuditEvent.createMany({
        data: auditEvents.map((event) =>
          auditEventData(id, actorUserId, event.eventType, event.metadata ?? {})
        )
      });
      if (notifications.length > 0) {
        await tx.emergencyAccessNotificationEvent.createMany({
          data: notificationEvents(id, notifications)
        });
      }
      return tx.emergencyAccessRequest.findUniqueOrThrow({ where: { id } });
    });
  }

  findAuditEvents(accessRequestId: string): Promise<EmergencyAccessAuditEvent[]> {
    return prisma.emergencyAccessAuditEvent.findMany({
      where: { accessRequestId },
      orderBy: { createdAt: 'asc' }
    });
  }

  findNotificationEvents(accessRequestId: string): Promise<EmergencyAccessNotificationEvent[]> {
    return prisma.emergencyAccessNotificationEvent.findMany({
      where: { accessRequestId },
      orderBy: { createdAt: 'asc' }
    });
  }
}
