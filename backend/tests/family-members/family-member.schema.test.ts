import {
  createFamilyMemberSchema,
  updateFamilyMemberSchema,
  idParamSchema
} from '../../src/family-members/family-member.schema';

describe('createFamilyMemberSchema', () => {
  it('accepts a full valid body', () => {
    const result = createFamilyMemberSchema.safeParse({
      name: 'Aisyah Rahman',
      relation: 'SELF',
      detail: 'Primary owner · Kuala Lumpur'
    });

    expect(result.success).toBe(true);
  });

  it('accepts a body with omitted detail', () => {
    const result = createFamilyMemberSchema.safeParse({
      name: 'Aisyah Rahman',
      relation: 'SELF'
    });

    expect(result.success).toBe(true);
  });

  it('accepts a body with detail explicitly set to null', () => {
    const result = createFamilyMemberSchema.safeParse({
      name: 'Aisyah Rahman',
      relation: 'SELF',
      detail: null
    });

    expect(result.success).toBe(true);
  });

  it('rejects a body missing name', () => {
    const result = createFamilyMemberSchema.safeParse({
      relation: 'SELF'
    });

    expect(result.success).toBe(false);
  });

  it('rejects an empty-string name', () => {
    const result = createFamilyMemberSchema.safeParse({
      name: '',
      relation: 'SELF'
    });

    expect(result.success).toBe(false);
  });

  it('rejects a whitespace-only name', () => {
    const result = createFamilyMemberSchema.safeParse({
      name: '   ',
      relation: 'SELF'
    });

    expect(result.success).toBe(false);
  });

  it('rejects a name over 120 characters', () => {
    const result = createFamilyMemberSchema.safeParse({
      name: 'a'.repeat(121),
      relation: 'SELF'
    });

    expect(result.success).toBe(false);
  });

  it('rejects a body missing relation', () => {
    const result = createFamilyMemberSchema.safeParse({
      name: 'Aisyah Rahman'
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid relation value', () => {
    const result = createFamilyMemberSchema.safeParse({
      name: 'Aisyah Rahman',
      relation: 'COUSIN'
    });

    expect(result.success).toBe(false);
  });

  it('rejects unknown extra keys', () => {
    const result = createFamilyMemberSchema.safeParse({
      name: 'Aisyah Rahman',
      relation: 'SELF',
      unexpectedField: 'should not be allowed'
    });

    expect(result.success).toBe(false);
  });
});

describe('updateFamilyMemberSchema', () => {
  it('rejects an empty body', () => {
    const result = updateFamilyMemberSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it('accepts a single-field partial update', () => {
    const result = updateFamilyMemberSchema.safeParse({
      name: 'New Name'
    });

    expect(result.success).toBe(true);
  });

  it('rejects unknown extra keys', () => {
    const result = updateFamilyMemberSchema.safeParse({
      name: 'New Name',
      unexpectedField: 'should not be allowed'
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
