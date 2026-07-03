/**
 * Client-side types for the asset-references resource.
 * Mirrors the backend Prisma model and `AssetCategory` enum.
 *
 * COMPLIANCE RED LINE: this resource records only *where to look* and the
 * relationship to an asset — never account numbers, balances, passwords, or
 * private keys. There are deliberately no fields for such data.
 */

export const ASSET_CATEGORIES = [
  'BANK',
  'INSURANCE',
  'PROPERTY',
  'INVESTMENT',
  'CRYPTO',
  'OTHER'
] as const;

export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

export interface AssetReference {
  id: string;
  name: string;
  category: AssetCategory;
  locationHint: string | null;
  detail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssetReferenceInput {
  name: string;
  category: AssetCategory;
  locationHint?: string | null;
  detail?: string | null;
}
