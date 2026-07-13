import { prisma } from '../db/client';
import { Prisma } from '../generated/prisma/client';
import { VerificationStatus } from '../generated/prisma/enums';
import type { TrustedContactModel as TrustedContact } from '../generated/prisma/models';
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

  create(userId: string, data: CreateTrustedContactInput): Promise<TrustedContact> {
    return prisma.trustedContact.create({ data: { ...data, userId } });
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

  async markVerified(userId: string, id: string): Promise<TrustedContact | null> {
    try {
      return await prisma.trustedContact.update({
        where: { id_userId: { id, userId } },
        data: { verificationStatus: VerificationStatus.VERIFIED }
      });
    } catch (error: unknown) {
      if (isRecordNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }
}
