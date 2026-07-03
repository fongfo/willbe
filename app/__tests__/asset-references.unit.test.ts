import { assetReferenceFormSchema } from '../src/asset-references/assetReference.schema';
import {
  CATEGORY_OPTIONS,
  getCategoryLabel,
  getCategoryShort
} from '../src/asset-references/categories';

describe('assetReferenceFormSchema', () => {
  const base = { name: 'Maybank — main account', category: 'BANK' };

  it('accepts a valid reference and drops empty optionals', () => {
    const result = assetReferenceFormSchema.safeParse({
      ...base,
      locationHint: '  ',
      detail: ''
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.locationHint).toBeUndefined();
      expect(result.data.detail).toBeUndefined();
    }
  });

  it('keeps a location hint when provided', () => {
    const result = assetReferenceFormSchema.safeParse({
      ...base,
      locationHint: 'Drive ▸ Family ▸ Banking'
    });
    expect(result.success && result.data.locationHint).toBe('Drive ▸ Family ▸ Banking');
  });

  it('rejects an empty name and an unknown category', () => {
    expect(assetReferenceFormSchema.safeParse({ ...base, name: '' }).success).toBe(false);
    expect(assetReferenceFormSchema.safeParse({ ...base, category: 'GOLD' }).success).toBe(
      false
    );
  });

  it('rejects an over-long location hint', () => {
    const result = assetReferenceFormSchema.safeParse({
      ...base,
      locationHint: 'x'.repeat(281)
    });
    expect(result.success).toBe(false);
  });
});

describe('categories', () => {
  it('exposes all six categories with labels and short codes', () => {
    expect(CATEGORY_OPTIONS).toHaveLength(6);
    expect(CATEGORY_OPTIONS.map((option) => option.value)).toContain('CRYPTO');
  });

  it('maps category codes to labels and short icon codes', () => {
    expect(getCategoryLabel('BANK')).toBe('Banking');
    expect(getCategoryShort('PROPERTY')).toBe('PROP');
    expect(getCategoryLabel('INSURANCE')).toBe('Insurance / Takaful');
  });
});
