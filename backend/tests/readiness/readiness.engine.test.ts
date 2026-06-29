import { computeReadiness } from '../../src/readiness/readiness.engine';
import type { ReadinessInput } from '../../src/readiness/readiness.types';

// A fully-prepared plan: every rule passes, so no gaps should be produced.
const completeInput: ReadinessInput = {
  familyMemberCount: 2,
  contactCount: 2,
  hasAdvisorContact: true,
  assetCount: 3,
  hasBeneficiaryNote: true,
  connectedProviderCount: 1,
  checkInFrequency: 'EVERY_6_MONTHS'
};

function gapCodes(input: ReadinessInput): string[] {
  return computeReadiness(input).gaps.map((gap) => gap.code);
}

describe('computeReadiness', () => {
  it('returns no gaps and caps the score at 96 for a complete plan', () => {
    const result = computeReadiness(completeInput);

    expect(result.gaps).toEqual([]);
    expect(result.score).toBe(96);
  });

  it('flags a thin household and deducts 10 points', () => {
    const result = computeReadiness({ ...completeInput, familyMemberCount: 1 });

    expect(gapCodes({ ...completeInput, familyMemberCount: 1 })).toContain('ADD_FAMILY_MEMBER');
    expect(result.score).toBe(90);
  });

  it('flags a single trusted contact (no backup) and deducts 12 points', () => {
    const result = computeReadiness({ ...completeInput, contactCount: 1 });

    expect(result.gaps.map((g) => g.code)).toContain('ADD_BACKUP_CONTACT');
    expect(result.score).toBe(88);
  });

  it('flags too few asset references and deducts 10 points', () => {
    const result = computeReadiness({ ...completeInput, assetCount: 2 });

    expect(result.gaps.map((g) => g.code)).toContain('ADD_ASSET_REFERENCES');
    expect(result.score).toBe(90);
  });

  it('flags a missing advisor/lawyer contact and deducts 8 points', () => {
    const result = computeReadiness({ ...completeInput, hasAdvisorContact: false });

    expect(result.gaps.map((g) => g.code)).toContain('ADD_ADVISOR_CONTACT');
    expect(result.score).toBe(92);
  });

  it('flags no connected cloud provider and deducts 12 points', () => {
    const result = computeReadiness({ ...completeInput, connectedProviderCount: 0 });

    expect(result.gaps.map((g) => g.code)).toContain('CONNECT_CLOUD_PROVIDER');
    expect(result.score).toBe(88);
  });

  it('flags a vague custom annual reminder and deducts 5 points', () => {
    const result = computeReadiness({ ...completeInput, checkInFrequency: 'CUSTOM_ANNUAL' });

    expect(result.gaps.map((g) => g.code)).toContain('CLARIFY_CUSTOM_REMINDER');
    expect(result.score).toBe(95);
  });

  it('flags missing beneficiary notes and deducts 8 points', () => {
    const result = computeReadiness({ ...completeInput, hasBeneficiaryNote: false });

    expect(result.gaps.map((g) => g.code)).toContain('ADD_BENEFICIARY_NOTES');
    expect(result.score).toBe(92);
  });

  it('never drops below the floor score of 55 for an empty plan', () => {
    const emptyInput: ReadinessInput = {
      familyMemberCount: 0,
      contactCount: 0,
      hasAdvisorContact: false,
      assetCount: 0,
      hasBeneficiaryNote: false,
      connectedProviderCount: 0,
      checkInFrequency: 'CUSTOM_ANNUAL'
    };

    const result = computeReadiness(emptyInput);

    // Raw deductions total 65 (100 - 65 = 35), so the floor must clamp it.
    expect(result.score).toBe(55);
    expect(result.gaps).toHaveLength(7);
  });

  it('tags each gap with a category and a positive score impact', () => {
    const result = computeReadiness({
      familyMemberCount: 0,
      contactCount: 0,
      hasAdvisorContact: false,
      assetCount: 0,
      hasBeneficiaryNote: false,
      connectedProviderCount: 0,
      checkInFrequency: 'EVERY_3_MONTHS'
    });

    for (const gap of result.gaps) {
      expect(typeof gap.category).toBe('string');
      expect(gap.category.length).toBeGreaterThan(0);
      expect(gap.scoreImpact).toBeGreaterThan(0);
    }
  });
});
