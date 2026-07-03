import type { AssetCategory } from './assetReference.types';
import { ASSET_CATEGORIES } from './assetReference.types';

interface CategoryMeta {
  label: string;
  /** Short code shown in the list-row icon (see plan.html). */
  short: string;
}

const CATEGORY_META: Record<AssetCategory, CategoryMeta> = {
  BANK: { label: 'Banking', short: 'BANK' },
  INSURANCE: { label: 'Insurance / Takaful', short: 'INS' },
  PROPERTY: { label: 'Property', short: 'PROP' },
  INVESTMENT: { label: 'Investments', short: 'INV' },
  CRYPTO: { label: 'Crypto', short: 'CRY' },
  OTHER: { label: 'Other', short: 'OTH' }
};

export interface CategoryOption {
  value: AssetCategory;
  label: string;
  short: string;
}

export const CATEGORY_OPTIONS: CategoryOption[] = ASSET_CATEGORIES.map((value) => ({
  value,
  label: CATEGORY_META[value].label,
  short: CATEGORY_META[value].short
}));

export function getCategoryLabel(category: AssetCategory): string {
  return CATEGORY_META[category].label;
}

export function getCategoryShort(category: AssetCategory): string {
  return CATEGORY_META[category].short;
}
