import { prisma } from '../db/client';
import { Prisma } from '../generated/prisma/client';
import type { AssetReferenceModel as AssetReference } from '../generated/prisma/models';
import type {
  CreateAssetReferenceInput,
  UpdateAssetReferenceInput
} from './asset-reference.schema';

// Prisma's "record to update/delete not found" error code.
// https://www.prisma.io/docs/orm/reference/error-reference#p2025
const RECORD_NOT_FOUND_CODE = 'P2025';

function isRecordNotFoundError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === RECORD_NOT_FOUND_CODE
  );
}

export class AssetReferenceRepository {
  findAll(userId: string): Promise<AssetReference[]> {
    return prisma.assetReference.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });
  }

  findById(userId: string, id: string): Promise<AssetReference | null> {
    return prisma.assetReference.findUnique({ where: { id_userId: { id, userId } } });
  }

  create(userId: string, data: CreateAssetReferenceInput): Promise<AssetReference> {
    return prisma.assetReference.create({ data: { ...data, userId } });
  }

  async update(
    userId: string,
    id: string,
    data: UpdateAssetReferenceInput
  ): Promise<AssetReference | null> {
    try {
      return await prisma.assetReference.update({ where: { id_userId: { id, userId } }, data });
    } catch (error: unknown) {
      if (isRecordNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  async delete(userId: string, id: string): Promise<AssetReference | null> {
    try {
      return await prisma.assetReference.delete({ where: { id_userId: { id, userId } } });
    } catch (error: unknown) {
      if (isRecordNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }
}
