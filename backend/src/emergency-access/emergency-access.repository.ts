import { prisma } from '../db/client';
import { EmergencyAccessStatus, VerificationStatus } from '../generated/prisma/enums';
import { Prisma } from '../generated/prisma/client';
import type {
  EmergencyAccessAuditEventModel as EmergencyAccessAuditEvent,
  EmergencyAccessRequestModel as EmergencyAccessRequest,
  TrustedContactModel as TrustedContact,
  UserModel as User
} from '../generated/prisma/models';
import type { CreateEmergencyAccessRequestInput } from './emergency-access.schema';

type ContactContextRequest = Pick<
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

export type EmergencyAccessAuditMetadata = Prisma.InputJsonObject;
const UNIQUE_CONSTRAINT_CODE = 'P2002';

const OPEN_STATUSES: EmergencyAccessStatus[] = [
  EmergencyAccessStatus.REQUESTED,
  EmergencyAccessStatus.COOLING_OFF,
  EmergencyAccessStatus.SECONDARY_REVIEW,
  EmergencyAccessStatus.ACTIVE
];

export class EmergencyAccessRepository {
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

  async findAssignments(contactUserId: string, now: Date = new Date()): Promise<TrustedContactAccessAssignment[]> {
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
    return assignments.map((assignment) => ({
      ...assignment,
      emergencyAccessRequests: assignment.emergencyAccessRequests?.map((request) => ({
        ...request,
        status: effectiveRequestStatus(request, now)
      }))
    }));
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
            {
              accessRequestId: request.id,
              actorUserId: requesterUserId,
              eventType: 'ACCESS_REQUESTED',
              metadata: { reason: input.reason }
            },
            {
              accessRequestId: request.id,
              actorUserId: requesterUserId,
              eventType: 'OWNER_NOTIFIED',
              metadata: { ownerUserId: input.ownerUserId }
            },
            {
              accessRequestId: request.id,
              actorUserId: requesterUserId,
              eventType: 'COOLING_OFF_STARTED',
              metadata: { coolingOffEndsAt: timing.coolingOffEndsAt.toISOString() }
            }
          ]
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
      data: {
        accessRequestId,
        actorUserId,
        eventType,
        metadata
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
          metadata
        }
      });
      return tx.emergencyAccessRequest.findUniqueOrThrow({ where: { id } });
    });
  }

  findAuditEvents(accessRequestId: string): Promise<EmergencyAccessAuditEvent[]> {
    return prisma.emergencyAccessAuditEvent.findMany({
      where: { accessRequestId },
      orderBy: { createdAt: 'asc' }
    });
  }
}
