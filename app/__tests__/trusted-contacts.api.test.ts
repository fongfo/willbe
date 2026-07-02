import { apiClient } from '../src/api';
import {
  createTrustedContact,
  listTrustedContacts
} from '../src/trusted-contacts/trustedContact.api';
import type { TrustedContact } from '../src/trusted-contacts/trustedContact.types';

jest.mock('../src/api', () => ({
  apiClient: { get: jest.fn(), post: jest.fn() }
}));

const mockedApi = apiClient as unknown as { get: jest.Mock; post: jest.Mock };

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
