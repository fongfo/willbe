import { updateReviewSettingSchema } from '../../src/review-settings/review-setting.schema';

describe('updateReviewSettingSchema', () => {
  it('accepts a valid frequency with connected providers', () => {
    const result = updateReviewSettingSchema.safeParse({
      checkInFrequency: 'EVERY_6_MONTHS',
      connectedProviders: ['GOOGLE_DRIVE', 'ONEDRIVE']
    });

    expect(result.success).toBe(true);
  });

  it('accepts an empty connectedProviders array', () => {
    const result = updateReviewSettingSchema.safeParse({
      checkInFrequency: 'EVERY_3_MONTHS',
      connectedProviders: []
    });

    expect(result.success).toBe(true);
  });

  it('rejects an unknown check-in frequency', () => {
    const result = updateReviewSettingSchema.safeParse({
      checkInFrequency: 'WEEKLY',
      connectedProviders: []
    });

    expect(result.success).toBe(false);
  });

  it('rejects an unknown cloud provider', () => {
    const result = updateReviewSettingSchema.safeParse({
      checkInFrequency: 'EVERY_6_MONTHS',
      connectedProviders: ['MEGA']
    });

    expect(result.success).toBe(false);
  });

  it('rejects duplicate providers', () => {
    const result = updateReviewSettingSchema.safeParse({
      checkInFrequency: 'EVERY_6_MONTHS',
      connectedProviders: ['GOOGLE_DRIVE', 'GOOGLE_DRIVE']
    });

    expect(result.success).toBe(false);
  });

  it('rejects a missing checkInFrequency', () => {
    const result = updateReviewSettingSchema.safeParse({
      connectedProviders: ['DROPBOX']
    });

    expect(result.success).toBe(false);
  });

  // Strict schema: smuggled fields (e.g. an access token) must be rejected at the
  // validation boundary rather than silently dropped or persisted.
  it('rejects unknown fields such as a credential', () => {
    const result = updateReviewSettingSchema.safeParse({
      checkInFrequency: 'EVERY_6_MONTHS',
      connectedProviders: ['GOOGLE_DRIVE'],
      accessToken: 'super-secret'
    });

    expect(result.success).toBe(false);
  });
});
