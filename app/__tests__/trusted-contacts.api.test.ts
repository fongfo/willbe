import { apiClient } from '../src/api';
import {
  bindTrustedContact,
  bindTrustedContactInvite,
  createTrustedContactInvite,
  createTrustedContact,
  deleteTrustedContact,
  listAssignedTrustedContactPlans,
  listTrustedContacts,
  revokeTrustedContactInvite,
  updateTrustedContact
} from '../src/trusted-contacts/trustedContact.api';
import type { TrustedContact } from '../src/trusted-contacts/trustedContact.types';

jest.mock('../src/api', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() }
}));

const mockedApi = apiClient as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  patch: jest.Mock;
  delete: jest.Mock;
};

const contact: TrustedContact = {
  id: 'c1',
  contactUserId: null,
  name: 'Imran Rahman',
  relation: 'SPOUSE',
  role: 'PRIMARY',
  phone: '+60123456789',
  email: null,
  verificationStatus: 'VERIFIED',
  detail: null,
  createdAt: '2026-07-02T00:00:00.000Z',
  updatedAt: '2026-07-02T00:00:00.000Z'
};

afterEach(() => jest.clearAllMocks());

describe('listTrustedContacts', () => {
  it('returns the list from the API', async () => {
    mockedApi.get.mockResolvedValue([contact]);
    await expect(listTrustedContacts()).resolves.toEqual([contact]);
    expect(mockedApi.get).toHaveBeenCalledWith('/trusted-contacts', undefined);
  });

  it('defaults to an empty array', async () => {
    mockedApi.get.mockResolvedValue(undefined);
    await expect(listTrustedContacts()).resolves.toEqual([]);
  });
});

describe('listAssignedTrustedContactPlans', () => {
  it('returns the contact assignments from the API', async () => {
    const assignments = [
      {
        id: 'c1',
        ownerUserId: 'owner-1',
        planner: { id: 'owner-1', name: 'Aisyah Rahman', email: 'aisyah@example.com' },
        name: 'Imran Rahman',
        relation: 'SPOUSE' as const,
        role: 'PRIMARY' as const,
        phone: '+60123456789',
        email: 'imran@example.com',
        verificationStatus: 'VERIFIED' as const,
        createdAt: '2026-07-02T00:00:00.000Z',
        updatedAt: '2026-07-02T00:00:00.000Z'
      }
    ];
    mockedApi.get.mockResolvedValue(assignments);

    await expect(listAssignedTrustedContactPlans()).resolves.toEqual(assignments);
    expect(mockedApi.get).toHaveBeenCalledWith(
      '/trusted-contacts/assigned-plans',
      undefined
    );
  });

  it('defaults assigned plans to an empty array', async () => {
    mockedApi.get.mockResolvedValue(undefined);
    await expect(listAssignedTrustedContactPlans()).resolves.toEqual([]);
  });
});

describe('createTrustedContact', () => {
  it('posts the input and returns the created contact', async () => {
    mockedApi.post.mockResolvedValue(contact);
    const result = await createTrustedContact({
      name: 'Imran Rahman',
      relation: 'SPOUSE',
      role: 'PRIMARY',
      phone: '+60123456789'
    });
    expect(result).toEqual(contact);
    expect(mockedApi.post).toHaveBeenCalledWith(
      '/trusted-contacts',
      expect.objectContaining({ name: 'Imran Rahman', role: 'PRIMARY' }),
      undefined
    );
  });

  it('throws when the API returns no data', async () => {
    mockedApi.post.mockResolvedValue(undefined);
    await expect(
      createTrustedContact({
        name: 'Ada',
        relation: 'OTHER',
        role: 'BACKUP',
        phone: '+60123456789'
      })
    ).rejects.toThrow('no data');
  });
});

describe('updateTrustedContact', () => {
  it('patches the contact and returns the updated record', async () => {
    const updated = { ...contact, name: 'Imran Bin Rahman', phone: '+60127654321' };
    mockedApi.patch.mockResolvedValue(updated);

    const result = await updateTrustedContact('c1', {
      name: 'Imran Bin Rahman',
      relation: 'SPOUSE',
      role: 'PRIMARY',
      phone: '+60127654321'
    });

    expect(result).toEqual(updated);
    expect(mockedApi.patch).toHaveBeenCalledWith(
      '/trusted-contacts/c1',
      expect.objectContaining({ name: 'Imran Bin Rahman', phone: '+60127654321' }),
      undefined
    );
  });

  it('throws when the API returns no data', async () => {
    mockedApi.patch.mockResolvedValue(undefined);
    await expect(
      updateTrustedContact('c1', {
        name: 'Ada',
        relation: 'OTHER',
        role: 'BACKUP',
        phone: '+60123456789'
      })
    ).rejects.toThrow('no data');
  });
});

describe('bindTrustedContact', () => {
  it('posts to the bind endpoint and returns the bound contact', async () => {
    const bound = {
      id: contact.id,
      ownerUserId: 'owner-1',
      name: contact.name,
      relation: contact.relation,
      role: contact.role,
      phone: contact.phone,
      email: contact.email,
      verificationStatus: contact.verificationStatus,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt
    };
    mockedApi.post.mockResolvedValue(bound);

    const result = await bindTrustedContact('c1', 'invite-token');

    expect(result).toEqual(bound);
    expect(mockedApi.post).toHaveBeenCalledWith(
      '/trusted-contacts/c1/bind',
      { inviteToken: 'invite-token' },
      undefined
    );
  });

  it('throws when the bind API returns no data', async () => {
    mockedApi.post.mockResolvedValue(undefined);

    await expect(bindTrustedContact('c1', 'invite-token')).rejects.toThrow('no data');
  });
});

describe('bindTrustedContactInvite', () => {
  it('posts a token-only bind request and returns the bound contact', async () => {
    const bound = {
      id: contact.id,
      ownerUserId: 'owner-1',
      name: contact.name,
      relation: contact.relation,
      role: contact.role,
      phone: contact.phone,
      email: contact.email,
      verificationStatus: contact.verificationStatus,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt
    };
    mockedApi.post.mockResolvedValue(bound);

    const result = await bindTrustedContactInvite('invite-token');

    expect(result).toEqual(bound);
    expect(mockedApi.post).toHaveBeenCalledWith(
      '/trusted-contacts/bind-invite',
      { inviteToken: 'invite-token' },
      undefined
    );
  });

  it('throws when token-only bind returns no data', async () => {
    mockedApi.post.mockResolvedValue(undefined);

    await expect(bindTrustedContactInvite('invite-token')).rejects.toThrow('no data');
  });
});

describe('createTrustedContactInvite', () => {
  it('posts to the invite endpoint and returns the plaintext invite once', async () => {
    const invite = {
      contact: {
        ...contact,
        inviteSentAt: '2026-08-25T00:00:00.000Z',
        inviteTokenExpiresAt: '2026-09-08T00:00:00.000Z'
      },
      inviteToken: 'invite-token',
      expiresAt: '2026-09-08T00:00:00.000Z'
    };
    mockedApi.post.mockResolvedValue(invite);

    await expect(createTrustedContactInvite('c1')).resolves.toEqual(invite);
    expect(mockedApi.post).toHaveBeenCalledWith('/trusted-contacts/c1/invite', {}, undefined);
  });

  it('throws when the invite API returns no data', async () => {
    mockedApi.post.mockResolvedValue(undefined);

    await expect(createTrustedContactInvite('c1')).rejects.toThrow('no data');
  });
});

describe('revokeTrustedContactInvite', () => {
  it('posts to the invite revoke endpoint and returns the updated contact', async () => {
    mockedApi.post.mockResolvedValue(contact);

    await expect(revokeTrustedContactInvite('c1')).resolves.toEqual(contact);
    expect(mockedApi.post).toHaveBeenCalledWith(
      '/trusted-contacts/c1/invite/revoke',
      {},
      undefined
    );
  });

  it('throws when the revoke API returns no data', async () => {
    mockedApi.post.mockResolvedValue(undefined);

    await expect(revokeTrustedContactInvite('c1')).rejects.toThrow('no data');
  });
});

describe('deleteTrustedContact', () => {
  it('deletes the contact by id', async () => {
    mockedApi.delete.mockResolvedValue(undefined);

    await expect(deleteTrustedContact('c1')).resolves.toBeUndefined();

    expect(mockedApi.delete).toHaveBeenCalledWith('/trusted-contacts/c1', undefined);
  });
});
