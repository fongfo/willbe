import { prisma } from '../db/client';
import { Prisma } from '../generated/prisma/client';
import { VerificationStatus } from '../generated/prisma/enums';
import type { TrustedContactModel as TrustedContact } from '../generated/prisma/models';
import type { TrustedContactAssignment } from './trusted-contact.service';
import type {
  CreateTrustedContactInput,
  UpdateTrustedContactInput
} from './trusted-contact.schema';

// Prisma's "record to update/delete not found" error code.
// https://www.prisma.io/docs/orm/reference/error-reference#p2025
const RECORD_NOT_FOUND_CODE = 'P2025';

function isRecordNotFoundError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === RECORD_NOT_FOUND_CODE
  );
}

export class TrustedContactRepository {
  findAll(userId: string): Promise<TrustedContact[]> {
    return prisma.trustedContact.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });
  }

  findById(userId: string, id: string): Promise<TrustedContact | null> {
    return prisma.trustedContact.findUnique({ where: { id_userId: { id, userId } } });
  }

  findByIdForBinding(id: string): Promise<TrustedContact | null> {
    return prisma.trustedContact.findUnique({ where: { id } });
  }

  findAssignmentsForContactUser(contactUserId: string): Promise<TrustedContactAssignment[]> {
    return prisma.trustedContact.findMany({
      where: { contactUserId, verificationStatus: VerificationStatus.VERIFIED },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  create(userId: string, data: CreateTrustedContactInput): Promise<TrustedContact> {
    return prisma.trustedContact.create({ data: { ...data, userId } });
  }

  async storeInvite(
    userId: string,
    id: string,
    tokenHash: string,
    expiresAt: Date,
    sentAt: Date
  ): Promise<TrustedContact | null> {
    try {
      return await prisma.trustedContact.update({
        where: { id_userId: { id, userId } },
        data: {
          inviteTokenHash: tokenHash,
          inviteTokenExpiresAt: expiresAt,
          inviteTokenUsedAt: null,
          inviteSentAt: sentAt
        }
      });
    } catch (error: unknown) {
      if (isRecordNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  async update(
    userId: string,
    id: string,
    data: UpdateTrustedContactInput
  ): Promise<TrustedContact | null> {
    try {
      return await prisma.trustedContact.update({ where: { id_userId: { id, userId } }, data });
    } catch (error: unknown) {
      if (isRecordNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  async delete(userId: string, id: string): Promise<TrustedContact | null> {
    try {
      return await prisma.trustedContact.delete({ where: { id_userId: { id, userId } } });
    } catch (error: unknown) {
      if (isRecordNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  async bindToUser(
    id: string,
    contactUserId: string,
    inviteTokenUsedAt: Date
  ): Promise<TrustedContact | null> {
    try {
      return await prisma.trustedContact.update({
        where: { id },
        data: {
          contactUserId,
          verificationStatus: VerificationStatus.VERIFIED,
          inviteTokenUsedAt
        }
      });
    } catch (error: unknown) {
      if (isRecordNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }
}
