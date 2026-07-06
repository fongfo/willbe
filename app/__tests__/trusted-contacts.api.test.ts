import { apiClient } from '../src/api';
import {
  createTrustedContact,
  deleteTrustedContact,
  listTrustedContacts,
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

describe('deleteTrustedContact', () => {
  it('deletes the contact by id', async () => {
    mockedApi.delete.mockResolvedValue(undefined);

    await expect(deleteTrustedContact('c1')).resolves.toBeUndefined();

    expect(mockedApi.delete).toHaveBeenCalledWith('/trusted-contacts/c1', undefined);
  });
});
