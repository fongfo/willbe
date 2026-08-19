import { getPlanJourneyAction, isPlanComplete } from '../src/plan/planJourney';
import { getPlanProgressLabel, PLAN_STEPS, SETUP_STEPS } from '../src/plan/planSteps';
import { getPlanSetupProgress } from '../src/plan/planProgress';
import { evaluateReadiness } from '../src/readiness/evaluateReadiness';

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
    expect(SETUP_STEPS.map((step) => step.id)).toEqual([
      'family-members',
      'trusted-contacts',
      'asset-references',
      'check-in'
    ]);
  });

  it('returns a progress label for the stepper summary', () => {
    expect(getPlanProgressLabel(4)).toBe('4 of 4 setup steps ready');
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

describe('plan journey', () => {
  const completeProgress = {
    completedSetupSteps: 4,
    hasFamilyMembers: true,
    hasTrustedContacts: true,
    hasAssetReferences: true,
    hasCheckInSetup: true
  };

  it('routes incomplete setup to the first missing setup input', () => {
    const progress = {
      completedSetupSteps: 2,
      hasFamilyMembers: true,
      hasTrustedContacts: true,
      hasAssetReferences: false,
      hasCheckInSetup: false
    };
    const evaluation = evaluateReadiness({
      familyMembers: [],
      trustedContacts: [],
      assetReferences: []
    });

    expect(getPlanJourneyAction(progress, evaluation)).toEqual(
      expect.objectContaining({
        label: 'Continue setup',
        route: '/asset-references'
      })
    );
  });

  it('routes complete setup with gaps to the next gap', () => {
    const evaluation = evaluateReadiness({
      familyMembers: [],
      trustedContacts: [],
      assetReferences: []
    });

    expect(getPlanJourneyAction(completeProgress, evaluation)).toEqual(
      expect.objectContaining({
        label: 'Fix next gap',
        route: '/family-members'
      })
    );
  });

  it('marks the plan complete when setup and readiness are complete', () => {
    const evaluation = evaluateReadiness({
      familyMembers: [
        {
          id: 'f1',
          name: 'Amina',
          relation: 'SELF',
          detail: null,
          createdAt: '2026-07-01T00:00:00.000Z',
          updatedAt: '2026-07-01T00:00:00.000Z'
        }
      ],
      trustedContacts: [
        {
          id: 'c1',
          name: 'Sara',
          relation: 'SIBLING',
          role: 'PRIMARY',
          phone: '+60123456789',
          email: null,
          verificationStatus: 'VERIFIED',
          detail: null,
          createdAt: '2026-07-01T00:00:00.000Z',
          updatedAt: '2026-07-01T00:00:00.000Z'
        },
        {
          id: 'c2',
          name: 'Imran',
          relation: 'SPOUSE',
          role: 'BACKUP',
          phone: '+60129876543',
          email: null,
          verificationStatus: 'VERIFIED',
          detail: null,
          createdAt: '2026-07-01T00:00:00.000Z',
          updatedAt: '2026-07-01T00:00:00.000Z'
        }
      ],
      assetReferences: [
        {
          id: 'a1',
          name: 'Maybank',
          category: 'BANK',
          locationHint: 'Drive / Family / Banking',
          detail: null,
          createdAt: '2026-07-01T00:00:00.000Z',
          updatedAt: '2026-07-01T00:00:00.000Z'
        }
      ]
    });

    expect(isPlanComplete(completeProgress, evaluation)).toBe(true);
    expect(getPlanJourneyAction(completeProgress, evaluation)).toEqual(
      expect.objectContaining({
        label: 'Preview handover',
        state: 'complete'
      })
    );
  });
});
