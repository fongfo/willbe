import { createEmergencyAccessRequestSchema, idParamSchema } from '../../src/emergency-access/emergency-access.schema';

describe('emergency access schemas', () => {
  it('accepts a confirmed emergency access request', () => {
    const parsed = createEmergencyAccessRequestSchema.safeParse({
      ownerUserId: '550e8400-e29b-41d4-a716-446655440000',
      trustedContactId: '550e8400-e29b-41d4-a716-446655440001',
      reason: 'UNREACHABLE',
      reasonDetail: 'Planner has not responded for several days.',
      confirmed: true
    });

    expect(parsed.success).toBe(true);
    expect(parsed.success ? parsed.data.reasonDetail : null).toBe(
      'Planner has not responded for several days.'
    );
  });

  it('requires the serious confirmation flag', () => {
    const parsed = createEmergencyAccessRequestSchema.safeParse({
      ownerUserId: '550e8400-e29b-41d4-a716-446655440000',
      trustedContactId: '550e8400-e29b-41d4-a716-446655440001',
      reason: 'ACCIDENT',
      confirmed: false
    });

    expect(parsed.success).toBe(false);
  });

  it('rejects unknown sensitive fields', () => {
    const parsed = createEmergencyAccessRequestSchema.safeParse({
      ownerUserId: '550e8400-e29b-41d4-a716-446655440000',
      trustedContactId: '550e8400-e29b-41d4-a716-446655440001',
      reason: 'OTHER',
      confirmed: true,
      password: 'do-not-store'
    });

    expect(parsed.success).toBe(false);
  });

  it('validates id route params', () => {
    expect(
      idParamSchema.safeParse({ id: '550e8400-e29b-41d4-a716-446655440000' }).success
    ).toBe(true);
    expect(idParamSchema.safeParse({ id: 'not-a-uuid' }).success).toBe(false);
  });
});
