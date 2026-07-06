import { getPlanProgressLabel, PLAN_STEPS } from '../src/plan/planSteps';

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
