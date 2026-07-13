import { HttpError } from '../shared/http-error';
import type { AssetReferenceModel as AssetReference } from '../generated/prisma/models';
import type {
  CreateAssetReferenceInput,
  UpdateAssetReferenceInput
} from './asset-reference.schema';

export interface AssetReferenceRepositoryLike {
  findAll(userId: string): Promise<AssetReference[]>;
  findById(userId: string, id: string): Promise<AssetReference | null>;
  create(userId: string, data: CreateAssetReferenceInput): Promise<AssetReference>;
  update(
    userId: string,
    id: string,
    data: UpdateAssetReferenceInput
  ): Promise<AssetReference | null>;
  delete(userId: string, id: string): Promise<AssetReference | null>;
}

const NOT_FOUND_MESSAGE = 'Asset reference not found';

export class AssetReferenceService {
  constructor(private readonly repository: AssetReferenceRepositoryLike) {}

  list(userId: string): Promise<AssetReference[]> {
    return this.repository.findAll(userId);
  }

  async getById(userId: string, id: string): Promise<AssetReference> {
    const reference = await this.repository.findById(userId, id);
    if (!reference) {
      throw new HttpError(404, NOT_FOUND_MESSAGE);
    }
    return reference;
  }

  create(userId: string, input: CreateAssetReferenceInput): Promise<AssetReference> {
    return this.repository.create(userId, input);
  }

  async update(
    userId: string,
    id: string,
    input: UpdateAssetReferenceInput
  ): Promise<AssetReference> {
    const updated = await this.repository.update(userId, id, input);
    if (!updated) {
      throw new HttpError(404, NOT_FOUND_MESSAGE);
    }
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await this.repository.delete(userId, id);
    if (!deleted) {
      throw new HttpError(404, NOT_FOUND_MESSAGE);
    }
  }
}
