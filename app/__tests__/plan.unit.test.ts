import { getPlanProgressLabel, PLAN_STEPS } from '../src/plan/planSteps';
import { getPlanSetupProgress } from '../src/plan/planProgress';

describe('PLAN_STEPS', () => {
  it('matches the product six-step planning flow', () => {
    expect(PLAN_STEPS.map((step) => step.id)).toEqual([
      'family-members',
      'trusted-contacts',
      'asset-references',
      'check-in',
      'readiness',
      'emergency-handover'
    ]);
  });

  it('returns a progress label for the stepper summary', () => {
    expect(getPlanProgressLabel(4)).toBe('4 of 6 steps ready');
  });
});

describe('getPlanSetupProgress', () => {
  it('does not count static setup steps when the user has no data', () => {
    expect(
      getPlanSetupProgress({
        hasFamilyMembers: false,
        hasTrustedContacts: false,
        hasAssetReferences: false
      }).completedSetupSteps
    ).toBe(0);
  });

  it('counts setup progress from real user-entered data', () => {
    expect(
      getPlanSetupProgress({
        hasFamilyMembers: true,
        hasTrustedContacts: true,
        hasAssetReferences: true,
        hasCheckInSetup: true
      }).completedSetupSteps
    ).toBe(4);
  });
});
