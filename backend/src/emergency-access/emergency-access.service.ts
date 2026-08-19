import { EmergencyAccessStatus } from '../generated/prisma/enums';
import type {
  EmergencyAccessAuditEventModel as EmergencyAccessAuditEvent,
  EmergencyAccessRequestModel as EmergencyAccessRequest
} from '../generated/prisma/models';
import { HttpError } from '../shared/http-error';
import type { CreateEmergencyAccessRequestInput } from './emergency-access.schema';
import type {
  EmergencyAccessRequestWithContact,
  TrustedContactAccessAssignment
} from './emergency-access.repository';

interface EmergencyAccessRepositoryLike {
  findVerifiedAssignment(
    contactUserId: string,
    trustedContactId: string
  ): Promise<TrustedContactAccessAssignment | null>;
  findAssignments(contactUserId: string): Promise<TrustedContactAccessAssignment[]>;
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
  findAuditEvents(accessRequestId: string): Promise<EmergencyAccessAuditEvent[]>;
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
    private readonly now: () => Date = () => new Date()
  ) {}

  listContactContext(contactUserId: string): Promise<TrustedContactAccessAssignment[]> {
    return this.repository.findAssignments(contactUserId);
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
    const updated = await this.repository.transitionStatus(
      id,
      ownerUserId,
      {
        status: EmergencyAccessStatus.REJECTED_BY_OWNER,
        closedAt: this.now()
      },
      'OWNER_REJECTED',
      {},
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
    const updated = await this.repository.transitionStatus(
      id,
      ownerUserId,
      {
        status: EmergencyAccessStatus.SUSPENDED,
        closedAt: this.now()
      },
      'OWNER_REVOKED',
      {},
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

  async activateForReview(
    ownerUserId: string,
    id: string
  ): Promise<EmergencyAccessRequest> {
    const request = await this.repository.findByIdForOwner(ownerUserId, id);
    if (!request) {
      throw new HttpError(404, REQUEST_NOT_FOUND);
    }
    if (
      request.status !== EmergencyAccessStatus.COOLING_OFF &&
      request.status !== EmergencyAccessStatus.SECONDARY_REVIEW
    ) {
      throw new HttpError(409, 'Emergency access request cannot be activated now');
    }
    const now = this.now();
    const updated = await this.repository.transitionStatus(
      id,
      ownerUserId,
      {
        status: EmergencyAccessStatus.ACTIVE,
        activatedAt: now,
        expiresAt: addHours(now, ACTIVE_ACCESS_HOURS)
      },
      'ACCESS_ACTIVATED',
      {},
      [EmergencyAccessStatus.COOLING_OFF, EmergencyAccessStatus.SECONDARY_REVIEW]
    );
    if (!updated) {
      throw new HttpError(409, 'Emergency access request cannot be activated now');
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
    const updated = await this.repository.transitionStatus(
      id,
      ownerUserId,
      {
        status: EmergencyAccessStatus.EXPIRED,
        closedAt: this.now()
      },
      'ACCESS_EXPIRED',
      {},
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
}
