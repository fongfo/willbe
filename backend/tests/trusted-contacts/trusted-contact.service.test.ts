import { TrustedContactService } from '../../src/trusted-contacts/trusted-contact.service';
import { HttpError } from '../../src/shared/http-error';

// NOTE on not-found modeling: this test suite models "not found" for update/remove/verify
// by having the mocked repository's `update`/`delete`/`markVerified` resolve to `null`,
// mirroring the same not-found signal used by `findById`. The service is expected to check
// for a `null` result and translate it into `HttpError(404)`, rather than relying on a
// Prisma-specific `P2025` error code.

interface MockTrustedContactRepository {
  findAll: jest.Mock;
  findById: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  markVerified: jest.Mock;
}

function createMockRepository(): MockTrustedContactRepository {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    markVerified: jest.fn()
  };
}

const sampleContact = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Imran Rahman',
  relation: 'SPOUSE',
  role: 'PRIMARY',
  phone: '+60123456789',
  email: 'imran@example.com',
  verificationStatus: 'PENDING',
  detail: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
};

describe('TrustedContactService', () => {
  const userId = 'user-1';
  let repository: MockTrustedContactRepository;
  let service: TrustedContactService;

  beforeEach(() => {
    repository = createMockRepository();
    service = new TrustedContactService(repository);
  });

  describe('list', () => {
    it('returns whatever repository.findAll resolves to', async () => {
      const contacts = [sampleContact];
      repository.findAll.mockResolvedValue(contacts);

      const result = await service.list(userId);

      expect(repository.findAll).toHaveBeenCalledWith(userId);
      expect(result).toBe(contacts);
    });
  });

  describe('getById', () => {
    it('returns the contact when repository.findById resolves to a record', async () => {
      repository.findById.mockResolvedValue(sampleContact);

      const result = await service.getById(userId, sampleContact.id);

      expect(repository.findById).toHaveBeenCalledWith(userId, sampleContact.id);
      expect(result).toBe(sampleContact);
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
        name: 'Imran Rahman',
        relation: 'SPOUSE' as const,
        role: 'PRIMARY' as const,
        phone: '+60123456789'
      };
      repository.create.mockResolvedValue(sampleContact);

      const result = await service.create(userId, input);

      expect(repository.create).toHaveBeenCalledWith(userId, input);
      expect(result).toBe(sampleContact);
    });
  });

  describe('update', () => {
    it('throws HttpError(404) when repository.update resolves to null (not-found signal)', async () => {
      repository.update.mockResolvedValue(null);

      await expect(
        service.update(userId, sampleContact.id, { name: 'New Name' })
      ).rejects.toMatchObject({ status: 404 });
      await expect(
        service.update(userId, sampleContact.id, { name: 'New Name' })
      ).rejects.toBeInstanceOf(HttpError);
    });

    it('returns the updated contact when repository.update resolves to a record', async () => {
      const updated = { ...sampleContact, name: 'New Name' };
      repository.update.mockResolvedValue(updated);

      const result = await service.update(userId, sampleContact.id, { name: 'New Name' });

      expect(repository.update).toHaveBeenCalledWith(userId, sampleContact.id, {
        name: 'New Name'
      });
      expect(result).toBe(updated);
    });
  });

  describe('remove', () => {
    it('throws HttpError(404) when repository.delete resolves to null (not-found signal)', async () => {
      repository.delete.mockResolvedValue(null);

      await expect(service.remove(userId, sampleContact.id)).rejects.toMatchObject({
        status: 404
      });
      await expect(service.remove(userId, sampleContact.id)).rejects.toBeInstanceOf(HttpError);
    });
  });

  describe('verify', () => {
    it('throws HttpError(404) when repository.markVerified resolves to null (not-found signal)', async () => {
      repository.markVerified.mockResolvedValue(null);

      await expect(service.verify(userId, 'missing-id')).rejects.toMatchObject({ status: 404 });
      await expect(service.verify(userId, 'missing-id')).rejects.toBeInstanceOf(HttpError);
    });

    it('returns the verified contact when repository.markVerified resolves to a record', async () => {
      const verified = { ...sampleContact, verificationStatus: 'VERIFIED' };
      repository.markVerified.mockResolvedValue(verified);

      const result = await service.verify(userId, sampleContact.id);

      expect(repository.markVerified).toHaveBeenCalledWith(userId, sampleContact.id);
      expect(result).toBe(verified);
    });
  });
});
