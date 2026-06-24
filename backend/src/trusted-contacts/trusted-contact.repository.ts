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
  findAll(): Promise<TrustedContact[]> {
    return prisma.trustedContact.findMany({ orderBy: { createdAt: 'asc' } });
  }

  findById(id: string): Promise<TrustedContact | null> {
    return prisma.trustedContact.findUnique({ where: { id } });
  }

  create(data: CreateTrustedContactInput): Promise<TrustedContact> {
    return prisma.trustedContact.create({ data });
  }

  async update(id: string, data: UpdateTrustedContactInput): Promise<TrustedContact | null> {
    try {
      return await prisma.trustedContact.update({ where: { id }, data });
    } catch (error: unknown) {
      if (isRecordNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  async delete(id: string): Promise<TrustedContact | null> {
    try {
      return await prisma.trustedContact.delete({ where: { id } });
    } catch (error: unknown) {
      if (isRecordNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  async markVerified(id: string): Promise<TrustedContact | null> {
    try {
      return await prisma.trustedContact.update({
        where: { id },
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
