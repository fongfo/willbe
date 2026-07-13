import { prisma } from '../db/client';
import { Prisma } from '../generated/prisma/client';
import type { FamilyMemberModel as FamilyMember } from '../generated/prisma/models';
import type { CreateFamilyMemberInput, UpdateFamilyMemberInput } from './family-member.schema';

// Prisma's "record to update/delete not found" error code.
// https://www.prisma.io/docs/orm/reference/error-reference#p2025
const RECORD_NOT_FOUND_CODE = 'P2025';

function isRecordNotFoundError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === RECORD_NOT_FOUND_CODE
  );
}

export class FamilyMemberRepository {
  findAll(userId: string): Promise<FamilyMember[]> {
    return prisma.familyMember.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });
  }

  findById(userId: string, id: string): Promise<FamilyMember | null> {
    return prisma.familyMember.findUnique({ where: { id_userId: { id, userId } } });
  }

  create(userId: string, data: CreateFamilyMemberInput): Promise<FamilyMember> {
    return prisma.familyMember.create({ data: { ...data, userId } });
  }

  async update(
    userId: string,
    id: string,
    data: UpdateFamilyMemberInput
  ): Promise<FamilyMember | null> {
    try {
      return await prisma.familyMember.update({ where: { id_userId: { id, userId } }, data });
    } catch (error: unknown) {
      if (isRecordNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  async delete(userId: string, id: string): Promise<FamilyMember | null> {
    try {
      return await prisma.familyMember.delete({ where: { id_userId: { id, userId } } });
    } catch (error: unknown) {
      if (isRecordNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }
}
