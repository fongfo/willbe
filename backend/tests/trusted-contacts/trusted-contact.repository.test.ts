import { Prisma } from '../../src/generated/prisma/client';

jest.mock('../../src/db/client', () => ({
  prisma: {
    trustedContact: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
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
  contactUserId: null,
  name: 'Imran Rahman',
  relation: 'SPOUSE',
  role: 'PRIMARY',
  phone: '+60123456789',
  email: 'imran@example.com',
  verificationStatus: 'PENDING',
  inviteTokenHash: null,
  inviteTokenExpiresAt: null,
  inviteTokenUsedAt: null,
  inviteSentAt: null,
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

  describe('findByIdForBinding', () => {
    it('finds a trusted contact by public id without owner scoping', async () => {
      (prisma.trustedContact.findUnique as jest.Mock).mockResolvedValue(sampleContact);

      const result = await repository.findByIdForBinding(sampleContact.id);

      expect(prisma.trustedContact.findUnique).toHaveBeenCalledWith({
        where: { id: sampleContact.id }
      });
      expect(result).toBe(sampleContact);
    });
  });

  describe('findAssignmentsForContactUser', () => {
    it('finds plans assigned to the authenticated contact account', async () => {
      const assignments = [{ ...sampleContact, user: { id: userId, name: 'Aisyah', email: null } }];
      (prisma.trustedContact.findMany as jest.Mock).mockResolvedValue(assignments);

      const result = await repository.findAssignmentsForContactUser('contact-user-1');

      expect(prisma.trustedContact.findMany).toHaveBeenCalledWith({
        where: { contactUserId: 'contact-user-1', verificationStatus: 'VERIFIED' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });
      expect(result).toBe(assignments);
    });
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

  describe('storeInvite', () => {
    it('stores only the invite token hash and expiry metadata', async () => {
      const updated = {
        ...sampleContact,
        inviteTokenHash: 'hash',
        inviteTokenExpiresAt: new Date('2026-09-08T00:00:00.000Z'),
        inviteSentAt: new Date('2026-08-25T00:00:00.000Z')
      };
      (prisma.trustedContact.update as jest.Mock).mockResolvedValue(updated);

      const result = await repository.storeInvite(
        userId,
        sampleContact.id,
        'hash',
        new Date('2026-09-08T00:00:00.000Z'),
        new Date('2026-08-25T00:00:00.000Z')
      );

      expect(prisma.trustedContact.update).toHaveBeenCalledWith({
        where: { id_userId: { id: sampleContact.id, userId } },
        data: {
          inviteTokenHash: 'hash',
          inviteTokenExpiresAt: new Date('2026-09-08T00:00:00.000Z'),
          inviteTokenUsedAt: null,
          inviteSentAt: new Date('2026-08-25T00:00:00.000Z')
        }
      });
      expect(result).toBe(updated);
    });

    it('returns null when storing an invite for a missing contact', async () => {
      (prisma.trustedContact.update as jest.Mock).mockRejectedValue(notFoundError());

      const result = await repository.storeInvite(
        userId,
        'missing-id',
        'hash',
        new Date('2026-09-08T00:00:00.000Z'),
        new Date('2026-08-25T00:00:00.000Z')
      );

      expect(result).toBeNull();
    });
  });

  describe('clearInvite', () => {
    it('clears invite token fields for an owned trusted contact', async () => {
      (prisma.trustedContact.update as jest.Mock).mockResolvedValue(sampleContact);

      const result = await repository.clearInvite(userId, sampleContact.id);

      expect(prisma.trustedContact.update).toHaveBeenCalledWith({
        where: { id_userId: { id: sampleContact.id, userId } },
        data: {
          inviteTokenHash: null,
          inviteTokenExpiresAt: null,
          inviteTokenUsedAt: null,
          inviteSentAt: null
        }
      });
      expect(result).toBe(sampleContact);
    });

    it('returns null when clearing an invite for a missing contact', async () => {
      (prisma.trustedContact.update as jest.Mock).mockRejectedValue(notFoundError());

      const result = await repository.clearInvite(userId, 'missing-id');

      expect(result).toBeNull();
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

  describe('bindToUser', () => {
    it('updates contactUserId and marks the contact verified', async () => {
      const bound = {
        ...sampleContact,
        contactUserId: 'contact-user-1',
        verificationStatus: 'VERIFIED'
      };
      (prisma.trustedContact.update as jest.Mock).mockResolvedValue(bound);

      const result = await repository.bindToUser(
        sampleContact.id,
        'contact-user-1',
        new Date('2026-08-25T00:00:00.000Z')
      );

      expect(prisma.trustedContact.update).toHaveBeenCalledWith({
        where: { id: sampleContact.id },
        data: {
          contactUserId: 'contact-user-1',
          verificationStatus: 'VERIFIED',
          inviteTokenUsedAt: new Date('2026-08-25T00:00:00.000Z')
        }
      });
      expect(result).toBe(bound);
    });

    it('returns null when Prisma throws a P2025 "record not found" error', async () => {
      (prisma.trustedContact.update as jest.Mock).mockRejectedValue(notFoundError());

      const result = await repository.bindToUser(
        'missing-id',
        'contact-user-1',
        new Date('2026-08-25T00:00:00.000Z')
      );

      expect(result).toBeNull();
    });
  });
});
