import { Prisma } from '../../src/generated/prisma/client';

jest.mock('../../src/db/client', () => ({
  prisma: {
    trustedContact: {
      update: jest.fn(),
      delete: jest.fn()
    }
  }
}));

import { prisma } from '../../src/db/client';
import { TrustedContactRepository } from '../../src/trusted-contacts/trusted-contact.repository';

function notFoundError(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Record to update not found.', {
    code: 'P2025',
    clientVersion: 'test'
  });
}

function otherKnownError(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed.', {
    code: 'P2002',
    clientVersion: 'test'
  });
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

describe('TrustedContactRepository', () => {
  const repository = new TrustedContactRepository();
  const userId = 'user-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('update', () => {
    it('returns null when Prisma throws a P2025 "record not found" error', async () => {
      (prisma.trustedContact.update as jest.Mock).mockRejectedValue(notFoundError());

      const result = await repository.update(userId, 'missing-id', { name: 'New Name' });

      expect(result).toBeNull();
    });

    it('rethrows other Prisma errors', async () => {
      (prisma.trustedContact.update as jest.Mock).mockRejectedValue(otherKnownError());

      await expect(repository.update(userId, 'some-id', { name: 'New Name' })).rejects.toThrow(
        'Unique constraint failed.'
      );
    });
  });

  describe('delete', () => {
    it('returns null when Prisma throws a P2025 "record not found" error', async () => {
      (prisma.trustedContact.delete as jest.Mock).mockRejectedValue(notFoundError());

      const result = await repository.delete(userId, 'missing-id');

      expect(result).toBeNull();
    });

    it('rethrows other Prisma errors', async () => {
      (prisma.trustedContact.delete as jest.Mock).mockRejectedValue(otherKnownError());

      await expect(repository.delete(userId, 'some-id')).rejects.toThrow(
        'Unique constraint failed.'
      );
    });
  });

  describe('markVerified', () => {
    it('calls prisma.trustedContact.update with the id and VERIFIED status, returning the record', async () => {
      const verified = { ...sampleContact, verificationStatus: 'VERIFIED' };
      (prisma.trustedContact.update as jest.Mock).mockResolvedValue(verified);

      const result = await repository.markVerified(userId, sampleContact.id);

      expect(prisma.trustedContact.update).toHaveBeenCalledWith({
        where: { id_userId: { id: sampleContact.id, userId } },
        data: { verificationStatus: 'VERIFIED' }
      });
      expect(result).toBe(verified);
    });

    it('returns null when Prisma throws a P2025 "record not found" error', async () => {
      (prisma.trustedContact.update as jest.Mock).mockRejectedValue(notFoundError());

      const result = await repository.markVerified(userId, 'missing-id');

      expect(result).toBeNull();
    });

    it('rethrows other Prisma errors', async () => {
      (prisma.trustedContact.update as jest.Mock).mockRejectedValue(otherKnownError());

      await expect(repository.markVerified(userId, 'some-id')).rejects.toThrow(
        'Unique constraint failed.'
      );
    });
  });
});
