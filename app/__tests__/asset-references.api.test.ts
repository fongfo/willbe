import { apiClient } from '../src/api';
import {
  createAssetReference,
  listAssetReferences
} from '../src/asset-references/assetReference.api';
import type { AssetReference } from '../src/asset-references/assetReference.types';

jest.mock('../src/api', () => ({
  apiClient: { get: jest.fn(), post: jest.fn() }
}));

const mockedApi = apiClient as unknown as { get: jest.Mock; post: jest.Mock };

const reference: AssetReference = {
  id: 'a1',
  name: 'Maybank — main account',
  category: 'BANK',
  locationHint: 'Drive ▸ Family ▸ Banking',
  detail: 'Joint with spouse',
  createdAt: '2026-07-02T00:00:00.000Z',
  updatedAt: '2026-07-02T00:00:00.000Z'
};

afterEach(() => jest.clearAllMocks());

describe('listAssetReferences', () => {
  it('returns the list from the API', async () => {
    mockedApi.get.mockResolvedValue([reference]);
    await expect(listAssetReferences()).resolves.toEqual([reference]);
    expect(mockedApi.get).toHaveBeenCalledWith('/asset-references', undefined);
  });

  it('defaults to an empty array', async () => {
    mockedApi.get.mockResolvedValue(undefined);
    await expect(listAssetReferences()).resolves.toEqual([]);
  });
});

describe('createAssetReference', () => {
  it('posts the input and returns the created reference', async () => {
    mockedApi.post.mockResolvedValue(reference);
    const result = await createAssetReference({
      name: 'Maybank — main account',
      category: 'BANK'
    });
    expect(result).toEqual(reference);
    expect(mockedApi.post).toHaveBeenCalledWith(
      '/asset-references',
      expect.objectContaining({ name: 'Maybank — main account', category: 'BANK' }),
      undefined
    );
  });

  it('throws when the API returns no data', async () => {
    mockedApi.post.mockResolvedValue(undefined);
    await expect(
      createAssetReference({ name: 'Condo', category: 'PROPERTY' })
    ).rejects.toThrow('no data');
  });
});
