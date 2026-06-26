import { HttpError } from '../shared/http-error';
import type { AssetReferenceModel as AssetReference } from '../generated/prisma/models';
import type {
  CreateAssetReferenceInput,
  UpdateAssetReferenceInput
} from './asset-reference.schema';

export interface AssetReferenceRepositoryLike {
  findAll(): Promise<AssetReference[]>;
  findById(id: string): Promise<AssetReference | null>;
  create(data: CreateAssetReferenceInput): Promise<AssetReference>;
  update(id: string, data: UpdateAssetReferenceInput): Promise<AssetReference | null>;
  delete(id: string): Promise<AssetReference | null>;
}

const NOT_FOUND_MESSAGE = 'Asset reference not found';

export class AssetReferenceService {
  constructor(private readonly repository: AssetReferenceRepositoryLike) {}

  list(): Promise<AssetReference[]> {
    return this.repository.findAll();
  }

  async getById(id: string): Promise<AssetReference> {
    const reference = await this.repository.findById(id);
    if (!reference) {
      throw new HttpError(404, NOT_FOUND_MESSAGE);
    }
    return reference;
  }

  create(input: CreateAssetReferenceInput): Promise<AssetReference> {
    return this.repository.create(input);
  }

  async update(id: string, input: UpdateAssetReferenceInput): Promise<AssetReference> {
    const updated = await this.repository.update(id, input);
    if (!updated) {
      throw new HttpError(404, NOT_FOUND_MESSAGE);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new HttpError(404, NOT_FOUND_MESSAGE);
    }
  }
}
