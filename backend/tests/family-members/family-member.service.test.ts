import { FamilyMemberService } from '../../src/family-members/family-member.service';
import { HttpError } from '../../src/shared/http-error';

// NOTE on not-found modeling: this test suite models "not found" for update/remove
// by having the mocked repository's `update`/`delete` resolve to `null`, mirroring
// the same not-found signal used by `findById`. The service is expected to check for
// a `null` result and translate it into `HttpError(404)`, rather than relying on a
// Prisma-specific `P2025` error code.

interface MockFamilyMemberRepository {
  findAll: jest.Mock;
  findById: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
}

function createMockRepository(): MockFamilyMemberRepository {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  };
}

const sampleMember = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Aisyah Rahman',
  relation: 'SELF',
  detail: 'Primary owner · Kuala Lumpur',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
};

describe('FamilyMemberService', () => {
  const userId = 'user-1';
  let repository: MockFamilyMemberRepository;
  let service: FamilyMemberService;

  beforeEach(() => {
    repository = createMockRepository();
    service = new FamilyMemberService(repository);
  });

  describe('list', () => {
    it('returns whatever repository.findAll resolves to', async () => {
      const members = [sampleMember];
      repository.findAll.mockResolvedValue(members);

      const result = await service.list(userId);

      expect(repository.findAll).toHaveBeenCalledWith(userId);
      expect(result).toBe(members);
    });
  });

  describe('getById', () => {
    it('returns the member when repository.findById resolves to a record', async () => {
      repository.findById.mockResolvedValue(sampleMember);

      const result = await service.getById(userId, sampleMember.id);

      expect(repository.findById).toHaveBeenCalledWith(userId, sampleMember.id);
      expect(result).toBe(sampleMember);
    });

    it('throws HttpError with status 404 when repository.findById resolves to null', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getById(userId, 'missing-id')).rejects.toMatchObject({
        status: 404
      });
      await expect(service.getById(userId, 'missing-id')).rejects.toBeInstanceOf(HttpError);
    });
  });

  describe('create', () => {
    it('calls repository.create with the input and returns its result', async () => {
      const input = {
        name: 'Aisyah Rahman',
        relation: 'SELF' as const,
        detail: 'Primary owner · Kuala Lumpur'
      };
      repository.create.mockResolvedValue(sampleMember);

      const result = await service.create(userId, input);

      expect(repository.create).toHaveBeenCalledWith(userId, input);
      expect(result).toBe(sampleMember);
    });
  });

  describe('update', () => {
    it('throws HttpError(404) when repository.update resolves to null (not-found signal)', async () => {
      repository.update.mockResolvedValue(null);

      await expect(
        service.update(userId, sampleMember.id, { name: 'New Name' })
      ).rejects.toMatchObject({ status: 404 });
      await expect(
        service.update(userId, sampleMember.id, { name: 'New Name' })
      ).rejects.toBeInstanceOf(HttpError);
    });

    it('returns the updated member when repository.update resolves to a record', async () => {
      const updated = { ...sampleMember, name: 'New Name' };
      repository.update.mockResolvedValue(updated);

      const result = await service.update(userId, sampleMember.id, { name: 'New Name' });

      expect(repository.update).toHaveBeenCalledWith(userId, sampleMember.id, {
        name: 'New Name'
      });
      expect(result).toBe(updated);
    });
  });

  describe('remove', () => {
    it('throws HttpError(404) when repository.delete resolves to null (not-found signal)', async () => {
      repository.delete.mockResolvedValue(null);

      await expect(service.remove(userId, sampleMember.id)).rejects.toMatchObject({
        status: 404
      });
      await expect(service.remove(userId, sampleMember.id)).rejects.toBeInstanceOf(HttpError);
    });
  });
});
