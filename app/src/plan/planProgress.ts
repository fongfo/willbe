export interface PlanProgressInput {
  hasFamilyMembers: boolean;
  hasTrustedContacts: boolean;
  hasAssetReferences: boolean;
  hasCheckInSetup?: boolean;
}

export interface PlanSetupProgress {
  completedSetupSteps: number;
  hasFamilyMembers: boolean;
  hasTrustedContacts: boolean;
  hasAssetReferences: boolean;
  hasCheckInSetup: boolean;
}

export function getPlanSetupProgress(
  input: PlanProgressInput
): PlanSetupProgress {
  const hasFamilyMembers = input.hasFamilyMembers;
  const hasTrustedContacts = input.hasTrustedContacts;
  const hasAssetReferences = input.hasAssetReferences;
  const hasCheckInSetup = input.hasCheckInSetup ?? false;

  const completedSetupSteps = [
    hasFamilyMembers,
    hasTrustedContacts,
    hasAssetReferences,
    hasCheckInSetup
  ].filter(Boolean).length;

  return {
    completedSetupSteps,
    hasFamilyMembers,
    hasTrustedContacts,
    hasAssetReferences,
    hasCheckInSetup
  };
}
