import {
  createAssetReferenceSchema,
  updateAssetReferenceSchema,
  idParamSchema
} from '../../src/asset-references/asset-reference.schema';

describe('createAssetReferenceSchema', () => {
  it('accepts a full valid body', () => {
    const result = createAssetReferenceSchema.safeParse({
      name: 'Maybank Savings Account',
      category: 'BANK',
      locationHint: 'Top drawer, home office',
      detail: 'Joint account with spouse'
    });

    expect(result.success).toBe(true);
  });

  it('accepts a body with omitted locationHint and detail', () => {
    const result = createAssetReferenceSchema.safeParse({
      name: 'Maybank Savings Account',
      category: 'BANK'
    });

    expect(result.success).toBe(true);
  });

  it('accepts a body with locationHint and detail explicitly set to null', () => {
    const result = createAssetReferenceSchema.safeParse({
      name: 'Maybank Savings Account',
      category: 'BANK',
      locationHint: null,
      detail: null
    });

    expect(result.success).toBe(true);
  });

  it('rejects a body missing name', () => {
    const result = createAssetReferenceSchema.safeParse({
      category: 'BANK'
    });

    expect(result.success).toBe(false);
  });

  it('rejects an empty-string name', () => {
    const result = createAssetReferenceSchema.safeParse({
      name: '',
      category: 'BANK'
    });

    expect(result.success).toBe(false);
  });

  it('rejects a whitespace-only name', () => {
    const result = createAssetReferenceSchema.safeParse({
      name: '   ',
      category: 'BANK'
    });

    expect(result.success).toBe(false);
  });

  it('rejects a name over 120 characters', () => {
    const result = createAssetReferenceSchema.safeParse({
      name: 'a'.repeat(121),
      category: 'BANK'
    });

    expect(result.success).toBe(false);
  });

  it('rejects a body missing category', () => {
    const result = createAssetReferenceSchema.safeParse({
      name: 'Maybank Savings Account'
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid category enum value', () => {
    const result = createAssetReferenceSchema.safeParse({
      name: 'Maybank Savings Account',
      category: 'NFT'
    });

    expect(result.success).toBe(false);
  });

  it('rejects a locationHint over 280 characters', () => {
    const result = createAssetReferenceSchema.safeParse({
      name: 'Maybank Savings Account',
      category: 'BANK',
      locationHint: 'a'.repeat(281)
    });

    expect(result.success).toBe(false);
  });

  it('rejects a detail over 280 characters', () => {
    const result = createAssetReferenceSchema.safeParse({
      name: 'Maybank Savings Account',
      category: 'BANK',
      detail: 'a'.repeat(281)
    });

    expect(result.success).toBe(false);
  });

  it('rejects unknown extra keys', () => {
    const result = createAssetReferenceSchema.safeParse({
      name: 'Maybank Savings Account',
      category: 'BANK',
      unexpectedField: 'should not be allowed'
    });

    expect(result.success).toBe(false);
  });

  // Critical product/security constraint: this model must NEVER accept sensitive
  // credential-like fields. `.strict()` mode must reject these as unknown keys,
  // locking in the "reference only, never store sensitive data" guarantee.
  it('rejects a body that attempts to set password directly', () => {
    const result = createAssetReferenceSchema.safeParse({
      name: 'Maybank Savings Account',
      category: 'BANK',
      password: 'super-secret'
    });

    expect(result.success).toBe(false);
  });

  it('rejects a body that attempts to set balance directly', () => {
    const result = createAssetReferenceSchema.safeParse({
      name: 'Maybank Savings Account',
      category: 'BANK',
      balance: 100000
    });

    expect(result.success).toBe(false);
  });

  it('rejects a body that attempts to set privateKey directly', () => {
    const result = createAssetReferenceSchema.safeParse({
      name: 'Maybank Savings Account',
      category: 'BANK',
      privateKey: '0xabcdef1234567890'
    });

    expect(result.success).toBe(false);
  });
});

describe('updateAssetReferenceSchema', () => {
  it('rejects an empty body', () => {
    const result = updateAssetReferenceSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it('accepts a single-field partial update', () => {
    const result = updateAssetReferenceSchema.safeParse({
      name: 'New Name'
    });

    expect(result.success).toBe(true);
  });

  it('rejects unknown extra keys', () => {
    const result = updateAssetReferenceSchema.safeParse({
      name: 'New Name',
      unexpectedField: 'should not be allowed'
    });

    expect(result.success).toBe(false);
  });

  it('rejects a body that attempts to set password directly', () => {
    const result = updateAssetReferenceSchema.safeParse({
      password: 'super-secret'
    });

    expect(result.success).toBe(false);
  });
});

describe('idParamSchema', () => {
  it('accepts a valid UUID string', () => {
    const result = idParamSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000'
    });

    expect(result.success).toBe(true);
  });

  it('rejects a non-UUID string', () => {
    const result = idParamSchema.safeParse({
      id: 'not-a-uuid'
    });

    expect(result.success).toBe(false);
  });
});
