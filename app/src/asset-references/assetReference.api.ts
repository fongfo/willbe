import { apiClient } from '../api';
import type {
  AssetReference,
  CreateAssetReferenceInput
} from './assetReference.types';

const RESOURCE = '/asset-references';

/** Fetches every asset reference in the plan. */
export async function listAssetReferences(
  signal?: AbortSignal
): Promise<AssetReference[]> {
  const data = await apiClient.get<AssetReference[]>(RESOURCE, signal);
  return data ?? [];
}

/** Creates a new asset reference and returns the persisted record. */
export async function createAssetReference(
  input: CreateAssetReferenceInput,
  signal?: AbortSignal
): Promise<AssetReference> {
  const data = await apiClient.post<AssetReference>(RESOURCE, input, signal);
  if (!data) {
    throw new Error('Asset reference creation returned no data');
  }
  return data;
}
