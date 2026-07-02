import { apiClient } from '../src/api';
import { createFamilyMember, listFamilyMembers } from '../src/family-members/familyMember.api';
import type { FamilyMember } from '../src/family-members/familyMember.types';

jest.mock('../src/api', () => ({
  apiClient: { get: jest.fn(), post: jest.fn() }
}));

const mockedApi = apiClient as unknown as {
  get: jest.Mock;
  post: jest.Mock;
};

const member: FamilyMember = {
  id: '1',
  name: 'Imran Rahman',
  relation: 'SPOUSE',
  detail: 'Petaling Jaya',
  createdAt: '2026-07-02T00:00:00.000Z',
  updatedAt: '2026-07-02T00:00:00.000Z'
};

afterEach(() => jest.clearAllMocks());

describe('listFamilyMembers', () => {
  it('returns the member list from the API', async () => {
    mockedApi.get.mockResolvedValue([member]);
    await expect(listFamilyMembers()).resolves.toEqual([member]);
    expect(mockedApi.get).toHaveBeenCalledWith('/family-members', undefined);
  });

  it('defaults to an empty array when the API returns nothing', async () => {
    mockedApi.get.mockResolvedValue(undefined);
    await expect(listFamilyMembers()).resolves.toEqual([]);
  });
});

describe('createFamilyMember', () => {
  it('posts the input and returns the created member', async () => {
    mockedApi.post.mockResolvedValue(member);
    const result = await createFamilyMember({ name: 'Imran Rahman', relation: 'SPOUSE' });
    expect(result).toEqual(member);
    expect(mockedApi.post).toHaveBeenCalledWith(
      '/family-members',
      { name: 'Imran Rahman', relation: 'SPOUSE' },
      undefined
    );
  });

  it('throws when the API returns no data', async () => {
    mockedApi.post.mockResolvedValue(undefined);
    await expect(
      createFamilyMember({ name: 'Ada', relation: 'OTHER' })
    ).rejects.toThrow('no data');
  });
});
