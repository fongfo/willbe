import { TrustedContactService } from '../../src/trusted-contacts/trusted-contact.service';
import { HttpError } from '../../src/shared/http-error';

// NOTE on not-found modeling: this test suite models "not found" for update/remove
// by having the mocked repository's `update`/`delete` resolve to `null`, mirroring
// the same not-found signal used by `findById`. The service is expected to check
// for a `null` result and translate it into `HttpError(404)`, rather than relying
// on a Prisma-specific `P2025` error code.

interface MockTrustedContactRepository {
  findAll: jest.Mock;
  findById: jest.Mock;
  findByIdForBinding: jest.Mock;
  findByInviteTokenHashForBinding: jest.Mock;
  findAssignmentsForContactUser: jest.Mock;
  create: jest.Mock;
  storeInvite: jest.Mock;
  clearInvite: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  bindToUser: jest.Mock;
}

function createMockRepository(): MockTrustedContactRepository {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByIdForBinding: jest.fn(),
    findByInviteTokenHashForBinding: jest.fn(),
    findAssignmentsForContactUser: jest.fn(),
    create: jest.fn(),
    storeInvite: jest.fn(),
    clearInvite: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    bindToUser: jest.fn()
  };
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

describe('TrustedContactService', () => {
  const userId = 'user-1';
  let repository: MockTrustedContactRepository;
  let service: TrustedContactService;

  beforeEach(() => {
    repository = createMockRepository();
    service = new TrustedContactService(
      repository,
      () => new Date('2026-08-25T00:00:00.000Z'),
      () => 'test-invite-token-12345678901234567890'
    );
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

  describe('listAssignments', () => {
    it('returns contact assignments for the authenticated contact user', async () => {
      const assignments = [{ ...sampleContact, user: { id: userId, name: 'Aisyah', email: null } }];
      repository.findAssignmentsForContactUser.mockResolvedValue(assignments);

      const result = await service.listAssignments('contact-user-1');

      expect(repository.findAssignmentsForContactUser).toHaveBeenCalledWith('contact-user-1');
      expect(result).toBe(assignments);
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

  describe('createInvite', () => {
    it('stores a hashed invite token and returns the plaintext token once', async () => {
      repository.findById.mockResolvedValue(sampleContact);
      repository.storeInvite.mockResolvedValue({
        ...sampleContact,
        inviteTokenHash: 'stored-hash',
        inviteTokenExpiresAt: new Date('2026-09-08T00:00:00.000Z'),
        inviteSentAt: new Date('2026-08-25T00:00:00.000Z')
      });

      const result = await service.createInvite(userId, sampleContact.id);

      expect(repository.storeInvite).toHaveBeenCalledWith(
        userId,
        sampleContact.id,
        expect.stringMatching(/^[a-f0-9]{64}$/),
        new Date('2026-09-08T00:00:00.000Z'),
        new Date('2026-08-25T00:00:00.000Z')
      );
      expect(result.inviteToken).toBe('test-invite-token-12345678901234567890');
    });

    it('rejects invite creation when the contact has no email address', async () => {
      repository.findById.mockResolvedValue({ ...sampleContact, email: null });

      await expect(service.createInvite(userId, sampleContact.id)).rejects.toMatchObject({
        status: 400
      });
      expect(repository.storeInvite).not.toHaveBeenCalled();
    });
  });

  describe('revokeInvite', () => {
    it('clears an unused invitation for a pending trusted contact', async () => {
      const invited = {
        ...sampleContact,
        inviteTokenHash: 'stored-hash',
        inviteTokenExpiresAt: new Date('2026-09-08T00:00:00.000Z'),
        inviteSentAt: new Date('2026-08-25T00:00:00.000Z')
      };
      repository.findById.mockResolvedValue(invited);
      repository.clearInvite.mockResolvedValue(sampleContact);

      const result = await service.revokeInvite(userId, sampleContact.id);

      expect(repository.clearInvite).toHaveBeenCalledWith(userId, sampleContact.id);
      expect(result).toBe(sampleContact);
    });

    it('rejects revoking a verified trusted contact invite', async () => {
      repository.findById.mockResolvedValue({
        ...sampleContact,
        verificationStatus: 'VERIFIED',
        inviteTokenUsedAt: new Date('2026-08-25T00:00:00.000Z')
      });

      await expect(service.revokeInvite(userId, sampleContact.id)).rejects.toMatchObject({
        status: 409
      });
      expect(repository.clearInvite).not.toHaveBeenCalled();
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

  describe('bindAuthenticatedContact', () => {
    it('binds and verifies when the authenticated email matches the trusted contact email', async () => {
      const contact = {
        ...sampleContact,
        email: 'IMRAN@example.com',
        inviteTokenHash:
          '397a2a9c5bf5e2ccec38c2596b682bb1bd05fe6e4ecea6c10cf42755ff225403',
        inviteTokenExpiresAt: new Date('2026-08-26T00:00:00.000Z')
      };
      const bound = {
        ...contact,
        contactUserId: 'contact-user-1',
        verificationStatus: 'VERIFIED'
      };
      repository.findByIdForBinding.mockResolvedValue(contact);
      repository.bindToUser.mockResolvedValue(bound);

      const result = await service.bindAuthenticatedContact(
        sampleContact.id,
        'contact-user-1',
        'imran@example.com',
        'valid-token'
      );

      expect(repository.bindToUser).toHaveBeenCalledWith(
        sampleContact.id,
        'contact-user-1',
        new Date('2026-08-25T00:00:00.000Z')
      );
      expect(result).toBe(bound);
    });

    it('rejects a reused invite token even for the same authenticated user', async () => {
      const contact = {
        ...sampleContact,
        email: 'imran@example.com',
        contactUserId: 'contact-user-1',
        verificationStatus: 'VERIFIED',
        inviteTokenUsedAt: new Date('2026-08-25T00:00:00.000Z')
      };
      repository.findByIdForBinding.mockResolvedValue(contact);

      await expect(
        service.bindAuthenticatedContact(
          sampleContact.id,
          'contact-user-1',
          'imran@example.com',
          'valid-token'
        )
      ).rejects.toMatchObject({ status: 409 });

      expect(repository.bindToUser).not.toHaveBeenCalled();
    });

    it('rejects binding when the invite token is expired', async () => {
      repository.findByIdForBinding.mockResolvedValue({
        ...sampleContact,
        email: 'imran@example.com',
        inviteTokenHash: 'hash',
        inviteTokenExpiresAt: new Date('2026-08-24T00:00:00.000Z')
      });

      await expect(
        service.bindAuthenticatedContact(
          sampleContact.id,
          'contact-user-1',
          'imran@example.com',
          'valid-token'
        )
      ).rejects.toMatchObject({ status: 403 });
    });

    it('rejects binding when the invite token does not match', async () => {
      repository.findByIdForBinding.mockResolvedValue({
        ...sampleContact,
        email: 'imran@example.com',
        inviteTokenHash: 'different-hash',
        inviteTokenExpiresAt: new Date('2026-08-26T00:00:00.000Z')
      });

      await expect(
        service.bindAuthenticatedContact(
          sampleContact.id,
          'contact-user-1',
          'imran@example.com',
          'invalid-token'
        )
      ).rejects.toMatchObject({ status: 403 });
    });

    it('rejects binding when no invite has been issued', async () => {
      repository.findByIdForBinding.mockResolvedValue({
        ...sampleContact,
        email: 'imran@example.com'
      });

      await expect(
        service.bindAuthenticatedContact(
          sampleContact.id,
          'contact-user-1',
          'imran@example.com',
          'valid-token'
        )
      ).rejects.toMatchObject({ status: 403 });
    });

    it('accepts the matching invite token hash', async () => {
      const inviteService = new TrustedContactService(
        repository,
        () => new Date('2026-08-25T00:00:00.000Z'),
        () => 'unused'
      );
      repository.findByIdForBinding.mockResolvedValue({
        ...sampleContact,
        email: 'imran@example.com',
        inviteTokenHash:
          '397a2a9c5bf5e2ccec38c2596b682bb1bd05fe6e4ecea6c10cf42755ff225403',
        inviteTokenExpiresAt: new Date('2026-08-26T00:00:00.000Z')
      });
      const bound = {
        ...sampleContact,
        contactUserId: 'contact-user-1',
        verificationStatus: 'VERIFIED'
      };
      repository.bindToUser.mockResolvedValue(bound);

      const result = await inviteService.bindAuthenticatedContact(
        sampleContact.id,
        'contact-user-1',
        'imran@example.com',
        'valid-token'
      );

      expect(result).toBe(bound);
    });

    it('rejects binding when the authenticated email does not match', async () => {
      repository.findByIdForBinding.mockResolvedValue({
        ...sampleContact,
        email: 'imran@example.com'
      });

      await expect(
        service.bindAuthenticatedContact(
          sampleContact.id,
          'contact-user-1',
          'other@example.com',
          'valid-token'
        )
      ).rejects.toMatchObject({ status: 403 });
    });

    it('rejects binding when the contact is already bound to another user', async () => {
      repository.findByIdForBinding.mockResolvedValue({
        ...sampleContact,
        email: 'imran@example.com',
        contactUserId: 'someone-else'
      });

      await expect(
        service.bindAuthenticatedContact(
          sampleContact.id,
          'contact-user-1',
          'imran@example.com',
          'valid-token'
        )
      ).rejects.toMatchObject({ status: 409 });
    });
  });

  describe('bindAuthenticatedContactByInviteToken', () => {
    it('finds the contact by invite token hash and binds the authenticated contact', async () => {
      const contact = {
        ...sampleContact,
        email: 'imran@example.com',
        inviteTokenHash:
          '397a2a9c5bf5e2ccec38c2596b682bb1bd05fe6e4ecea6c10cf42755ff225403',
        inviteTokenExpiresAt: new Date('2026-08-26T00:00:00.000Z')
      };
      const bound = {
        ...contact,
        contactUserId: 'contact-user-1',
        verificationStatus: 'VERIFIED'
      };
      repository.findByInviteTokenHashForBinding.mockResolvedValue(contact);
      repository.bindToUser.mockResolvedValue(bound);

      const result = await service.bindAuthenticatedContactByInviteToken(
        'contact-user-1',
        'imran@example.com',
        'valid-token'
      );

      expect(repository.findByInviteTokenHashForBinding).toHaveBeenCalledWith(
        '397a2a9c5bf5e2ccec38c2596b682bb1bd05fe6e4ecea6c10cf42755ff225403'
      );
      expect(repository.bindToUser).toHaveBeenCalledWith(
        sampleContact.id,
        'contact-user-1',
        new Date('2026-08-25T00:00:00.000Z')
      );
      expect(result).toBe(bound);
    });

    it('rejects when no contact exists for the invite token hash', async () => {
      repository.findByInviteTokenHashForBinding.mockResolvedValue(null);

      await expect(
        service.bindAuthenticatedContactByInviteToken(
          'contact-user-1',
          'imran@example.com',
          'valid-token'
        )
      ).rejects.toMatchObject({ status: 403 });
      expect(repository.bindToUser).not.toHaveBeenCalled();
    });
  });
});
