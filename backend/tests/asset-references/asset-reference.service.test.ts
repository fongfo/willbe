import { AssetReferenceService } from '../../src/asset-references/asset-reference.service';
import { HttpError } from '../../src/shared/http-error';

// NOTE on not-found modeling: this test suite models "not found" for update/remove
// by having the mocked repository's `update`/`delete` resolve to `null`, mirroring
// the same not-found signal used by `findById`. The service is expected to check for
// a `null` result and translate it into `HttpError(404)`, rather than relying on a
// Prisma-specific `P2025` error code.

interface MockAssetReferenceRepository {
  findAll: jest.Mock;
  findById: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
}

function createMockRepository(): MockAssetReferenceRepository {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  };
}

const sampleAssetReference = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Maybank Savings Account',
  category: 'BANK',
  locationHint: 'Top drawer, home office',
  detail: 'Joint account with spouse',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
};

describe('AssetReferenceService', () => {
  let repository: MockAssetReferenceRepository;
  let service: AssetReferenceService;

  beforeEach(() => {
    repository = createMockRepository();
    service = new AssetReferenceService(repository);
  });

  describe('list', () => {
    it('returns whatever repository.findAll resolves to', async () => {
      const assetReferences = [sampleAssetReference];
      repository.findAll.mockResolvedValue(assetReferences);

      const result = await service.list();

      expect(repository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toBe(assetReferences);
    });
  });

  describe('getById', () => {
    it('returns the asset reference when repository.findById resolves to a record', async () => {
      repository.findById.mockResolvedValue(sampleAssetReference);

      const result = await service.getById(sampleAssetReference.id);

      expect(repository.findById).toHaveBeenCalledWith(sampleAssetReference.id);
      expect(result).toBe(sampleAssetReference);
    });

    it('throws HttpError with status 404 when repository.findById resolves to null', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getById('missing-id')).rejects.toMatchObject({
        status: 404
      });
      await expect(service.getById('missing-id')).rejects.toBeInstanceOf(HttpError);
    });
  });

  describe('create', () => {
    it('calls repository.create with the input and returns its result', async () => {
      const input = {
        name: 'Maybank Savings Account',
        category: 'BANK' as const,
        locationHint: 'Top drawer, home office',
        detail: 'Joint account with spouse'
      };
      repository.create.mockResolvedValue(sampleAssetReference);

      const result = await service.create(input);

      expect(repository.create).toHaveBeenCalledWith(input);
      expect(result).toBe(sampleAssetReference);
    });
  });

  describe('update', () => {
    it('throws HttpError(404) when repository.update resolves to null (not-found signal)', async () => {
      repository.update.mockResolvedValue(null);

      await expect(
        service.update(sampleAssetReference.id, { name: 'New Name' })
      ).rejects.toMatchObject({ status: 404 });
      await expect(
        service.update(sampleAssetReference.id, { name: 'New Name' })
      ).rejects.toBeInstanceOf(HttpError);
    });

    it('returns the updated asset reference when repository.update resolves to a record', async () => {
      const updated = { ...sampleAssetReference, name: 'New Name' };
      repository.update.mockResolvedValue(updated);

      const result = await service.update(sampleAssetReference.id, { name: 'New Name' });

      expect(repository.update).toHaveBeenCalledWith(sampleAssetReference.id, { name: 'New Name' });
      expect(result).toBe(updated);
    });
  });

  describe('remove', () => {
    it('throws HttpError(404) when repository.delete resolves to null (not-found signal)', async () => {
      repository.delete.mockResolvedValue(null);

      await expect(service.remove(sampleAssetReference.id)).rejects.toMatchObject({
        status: 404
      });
      await expect(service.remove(sampleAssetReference.id)).rejects.toBeInstanceOf(HttpError);
    });
  });
});
