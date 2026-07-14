import { PlanProgressService } from '../../src/plan-progress/plan-progress.service';

describe('PlanProgressService', () => {
  it('returns zero completed setup steps for an empty plan', async () => {
    const service = new PlanProgressService({
      countSetupInputs: async () => ({
        familyMembers: 0,
        trustedContacts: 0,
        assetReferences: 0,
        reviewSettings: 0
      })
    });

    await expect(service.get('user-1')).resolves.toEqual({
      completedSetupSteps: 0,
      hasFamilyMembers: false,
      hasTrustedContacts: false,
      hasAssetReferences: false,
      hasCheckInSetup: false
    });
  });

  it('counts only aggregate setup presence', async () => {
    const service = new PlanProgressService({
      countSetupInputs: async () => ({
        familyMembers: 2,
        trustedContacts: 1,
        assetReferences: 3,
        reviewSettings: 1
      })
    });

    await expect(service.get('user-1')).resolves.toMatchObject({
      completedSetupSteps: 4,
      hasFamilyMembers: true,
      hasTrustedContacts: true,
      hasAssetReferences: true,
      hasCheckInSetup: true
    });
  });
});
