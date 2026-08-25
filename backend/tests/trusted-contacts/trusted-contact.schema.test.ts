import {
  bindTrustedContactSchema,
  createTrustedContactSchema,
  updateTrustedContactSchema,
  idParamSchema
} from '../../src/trusted-contacts/trusted-contact.schema';

describe('createTrustedContactSchema', () => {
  it('accepts a full valid body', () => {
    const result = createTrustedContactSchema.safeParse({
      name: 'Imran Rahman',
      relation: 'SPOUSE',
      role: 'PRIMARY',
      phone: '+60123456789',
      email: 'imran@example.com',
      detail: 'Lives nearby, has spare keys'
    });

    expect(result.success).toBe(true);
  });

  it('accepts a body with omitted email and detail', () => {
    const result = createTrustedContactSchema.safeParse({
      name: 'Imran Rahman',
      relation: 'SPOUSE',
      role: 'PRIMARY',
      phone: '+60123456789'
    });

    expect(result.success).toBe(true);
  });

  it('accepts a body with email and detail explicitly set to null', () => {
    const result = createTrustedContactSchema.safeParse({
      name: 'Imran Rahman',
      relation: 'SPOUSE',
      role: 'PRIMARY',
      phone: '+60123456789',
      email: null,
      detail: null
    });

    expect(result.success).toBe(true);
  });

  it('rejects a body missing name', () => {
    const result = createTrustedContactSchema.safeParse({
      relation: 'SPOUSE',
      role: 'PRIMARY',
      phone: '+60123456789'
    });

    expect(result.success).toBe(false);
  });

  it('rejects an empty-string name', () => {
    const result = createTrustedContactSchema.safeParse({
      name: '',
      relation: 'SPOUSE',
      role: 'PRIMARY',
      phone: '+60123456789'
    });

    expect(result.success).toBe(false);
  });

  it('rejects a whitespace-only name', () => {
    const result = createTrustedContactSchema.safeParse({
      name: '   ',
      relation: 'SPOUSE',
      role: 'PRIMARY',
      phone: '+60123456789'
    });

    expect(result.success).toBe(false);
  });

  it('rejects a name over 120 characters', () => {
    const result = createTrustedContactSchema.safeParse({
      name: 'a'.repeat(121),
      relation: 'SPOUSE',
      role: 'PRIMARY',
      phone: '+60123456789'
    });

    expect(result.success).toBe(false);
  });

  it('rejects a body missing relation', () => {
    const result = createTrustedContactSchema.safeParse({
      name: 'Imran Rahman',
      role: 'PRIMARY',
      phone: '+60123456789'
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid relation enum value', () => {
    const result = createTrustedContactSchema.safeParse({
      name: 'Imran Rahman',
      relation: 'COUSIN',
      role: 'PRIMARY',
      phone: '+60123456789'
    });

    expect(result.success).toBe(false);
  });

  it('rejects a body missing role', () => {
    const result = createTrustedContactSchema.safeParse({
      name: 'Imran Rahman',
      relation: 'SPOUSE',
      phone: '+60123456789'
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid role enum value', () => {
    const result = createTrustedContactSchema.safeParse({
      name: 'Imran Rahman',
      relation: 'SPOUSE',
      role: 'TERTIARY',
      phone: '+60123456789'
    });

    expect(result.success).toBe(false);
  });

  it('rejects a body missing phone', () => {
    const result = createTrustedContactSchema.safeParse({
      name: 'Imran Rahman',
      relation: 'SPOUSE',
      role: 'PRIMARY'
    });

    expect(result.success).toBe(false);
  });

  it('rejects an empty-string phone', () => {
    const result = createTrustedContactSchema.safeParse({
      name: 'Imran Rahman',
      relation: 'SPOUSE',
      role: 'PRIMARY',
      phone: ''
    });

    expect(result.success).toBe(false);
  });

  it('rejects a non-numeric phone value', () => {
    const result = createTrustedContactSchema.safeParse({
      name: 'Imran Rahman',
      relation: 'SPOUSE',
      role: 'PRIMARY',
      phone: 'abc'
    });

    expect(result.success).toBe(false);
  });

  it('accepts a valid phone with a leading country code', () => {
    const result = createTrustedContactSchema.safeParse({
      name: 'Imran Rahman',
      relation: 'SPOUSE',
      role: 'PRIMARY',
      phone: '+60123456789'
    });

    expect(result.success).toBe(true);
  });

  it('accepts a valid phone without a leading country code', () => {
    const result = createTrustedContactSchema.safeParse({
      name: 'Imran Rahman',
      relation: 'SPOUSE',
      role: 'PRIMARY',
      phone: '60123456789'
    });

    expect(result.success).toBe(true);
  });

  it('rejects an invalid email format', () => {
    const result = createTrustedContactSchema.safeParse({
      name: 'Imran Rahman',
      relation: 'SPOUSE',
      role: 'PRIMARY',
      phone: '+60123456789',
      email: 'not-an-email'
    });

    expect(result.success).toBe(false);
  });

  it('rejects a detail over 280 characters', () => {
    const result = createTrustedContactSchema.safeParse({
      name: 'Imran Rahman',
      relation: 'SPOUSE',
      role: 'PRIMARY',
      phone: '+60123456789',
      detail: 'a'.repeat(281)
    });

    expect(result.success).toBe(false);
  });

  it('rejects unknown extra keys', () => {
    const result = createTrustedContactSchema.safeParse({
      name: 'Imran Rahman',
      relation: 'SPOUSE',
      role: 'PRIMARY',
      phone: '+60123456789',
      unexpectedField: 'should not be allowed'
    });

    expect(result.success).toBe(false);
  });

  it('rejects a body that attempts to set verificationStatus directly', () => {
    const result = createTrustedContactSchema.safeParse({
      name: 'Imran Rahman',
      relation: 'SPOUSE',
      role: 'PRIMARY',
      phone: '+60123456789',
      verificationStatus: 'VERIFIED'
    });

    expect(result.success).toBe(false);
  });

  it('rejects a body that attempts to set contactUserId directly', () => {
    const result = createTrustedContactSchema.safeParse({
      name: 'Imran Rahman',
      relation: 'SPOUSE',
      role: 'PRIMARY',
      phone: '+60123456789',
      contactUserId: 'user-1'
    });

    expect(result.success).toBe(false);
  });
});

describe('updateTrustedContactSchema', () => {
  it('rejects an empty body', () => {
    const result = updateTrustedContactSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it('accepts a single-field partial update', () => {
    const result = updateTrustedContactSchema.safeParse({
      name: 'New Name'
    });

    expect(result.success).toBe(true);
  });

  it('accepts a single-field partial update of phone', () => {
    const result = updateTrustedContactSchema.safeParse({
      phone: '+60198765432'
    });

    expect(result.success).toBe(true);
  });

  it('rejects an invalid phone on partial update', () => {
    const result = updateTrustedContactSchema.safeParse({
      phone: 'not-a-phone'
    });

    expect(result.success).toBe(false);
  });

  it('rejects unknown extra keys', () => {
    const result = updateTrustedContactSchema.safeParse({
      name: 'New Name',
      unexpectedField: 'should not be allowed'
    });

    expect(result.success).toBe(false);
  });

  it('rejects a body that attempts to set verificationStatus directly', () => {
    const result = updateTrustedContactSchema.safeParse({
      verificationStatus: 'VERIFIED'
    });

    expect(result.success).toBe(false);
  });

  it('rejects a body that attempts to set contactUserId directly', () => {
    const result = updateTrustedContactSchema.safeParse({
      contactUserId: 'user-1'
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

describe('bindTrustedContactSchema', () => {
  it('accepts a valid invite token body', () => {
    const result = bindTrustedContactSchema.safeParse({
      inviteToken: 'valid-token-value-that-is-long-enough'
    });

    expect(result.success).toBe(true);
  });

  it('rejects an empty body', () => {
    const result = bindTrustedContactSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it('rejects unknown extra keys', () => {
    const result = bindTrustedContactSchema.safeParse({
      inviteToken: 'valid-token-value-that-is-long-enough',
      contactUserId: 'user-1'
    });

    expect(result.success).toBe(false);
  });
});
