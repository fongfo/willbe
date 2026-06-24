import { Prisma } from '../../src/generated/prisma/client';

jest.mock('../../src/db/client', () => ({
  prisma: {
    familyMember: {
      update: jest.fn(),
      delete: jest.fn()
    }
  }
}));

import { prisma } from '../../src/db/client';
import { FamilyMemberRepository } from '../../src/family-members/family-member.repository';

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

describe('FamilyMemberRepository', () => {
  const repository = new FamilyMemberRepository();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('update', () => {
    it('returns null when Prisma throws a P2025 "record not found" error', async () => {
      (prisma.familyMember.update as jest.Mock).mockRejectedValue(notFoundError());

      const result = await repository.update('missing-id', { name: 'New Name' });

      expect(result).toBeNull();
    });

    it('rethrows other Prisma errors', async () => {
      (prisma.familyMember.update as jest.Mock).mockRejectedValue(otherKnownError());

      await expect(repository.update('some-id', { name: 'New Name' })).rejects.toThrow(
        'Unique constraint failed.'
      );
    });
  });

  describe('delete', () => {
    it('returns null when Prisma throws a P2025 "record not found" error', async () => {
      (prisma.familyMember.delete as jest.Mock).mockRejectedValue(notFoundError());

      const result = await repository.delete('missing-id');

      expect(result).toBeNull();
    });

    it('rethrows other Prisma errors', async () => {
      (prisma.familyMember.delete as jest.Mock).mockRejectedValue(otherKnownError());

      await expect(repository.delete('some-id')).rejects.toThrow('Unique constraint failed.');
    });
  });
});
