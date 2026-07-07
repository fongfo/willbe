import type { AssetReference } from '../asset-references/assetReference.types';
import type { FamilyMember } from '../family-members/familyMember.types';
import type { TrustedContact } from '../trusted-contacts/trustedContact.types';

export type GapSeverity = 'high' | 'medium';
export type GapCategory = 'family' | 'trusted_contacts' | 'asset_references';
export type ReadinessCheckStatus = 'complete' | 'gap';
export type ReadinessLevel = 'needs-work' | 'building' | 'ready';
export type ReadinessActionRoute =
  | '/family-members'
  | '/trusted-contacts'
  | '/asset-references';

export interface ReadinessGap {
  id: string;
  category: GapCategory;
  title: string;
  detail: string;
  severity: GapSeverity;
  priority: number;
  action: {
    label: string;
    route: ReadinessActionRoute;
  };
  evidence: {
    current: number;
    required: number;
    unit: string;
  };
}

export interface ReadinessCheck {
  id: string;
  category: GapCategory;
  label: string;
  status: ReadinessCheckStatus;
  points: number;
  gap?: ReadinessGap;
}

export interface ReadinessEvaluation {
  score: number;
  level: ReadinessLevel;
  summary: string;
  gaps: ReadinessGap[];
  checks: ReadinessCheck[];
  completedChecks: number;
  totalChecks: number;
}

interface ReadinessInput {
  familyMembers: readonly FamilyMember[];
  trustedContacts: readonly TrustedContact[];
  assetReferences: readonly AssetReference[];
}

const TOTAL_CHECKS = 5;
const CHECK_POINTS = 1;

type GapInput = Omit<ReadinessGap, 'evidence'> & {
  evidence: ReadinessGap['evidence'];
};

function hasDocumentedLocation(reference: AssetReference): boolean {
  return Boolean(reference.locationHint?.trim());
}

function getLevel(score: number): ReadinessLevel {
  if (score >= 80) {
    return 'ready';
  }
  if (score >= 50) {
    return 'building';
  }
  return 'needs-work';
}

function getSummary(level: ReadinessLevel): string {
  if (level === 'ready') {
    return 'Your family has the core handover pieces in place.';
  }
  if (level === 'building') {
    return 'You have a useful start. Close the remaining gaps to reduce handover risk.';
  }
  return 'Start with the high-priority gaps so your family knows who to call and where to look.';
}

function completeCheck(
  id: string,
  category: GapCategory,
  label: string
): ReadinessCheck {
  return { id, category, label, status: 'complete', points: CHECK_POINTS };
}

function gapCheck(
  id: string,
  category: GapCategory,
  label: string,
  gap: GapInput
): ReadinessCheck {
  return {
    id,
    category,
    label,
    status: 'gap',
    points: 0,
    gap
  };
}

function evaluateFamilyCheck(familyMembers: readonly FamilyMember[]): ReadinessCheck {
  const id = 'family-members';
  const label = 'At least one family member is documented';
  if (familyMembers.length > 0) {
    return completeCheck(id, 'family', label);
  }
  return gapCheck(id, 'family', label, {
    id,
    category: 'family',
    title: 'Add at least one family member',
    detail: 'Start the plan by naming who this handover is meant to protect.',
    severity: 'high',
    priority: 10,
    action: { label: 'Add family member', route: '/family-members' },
    evidence: { current: familyMembers.length, required: 1, unit: 'family member' }
  });
}

function evaluateTrustedContactsCountCheck(
  trustedContacts: readonly TrustedContact[]
): ReadinessCheck {
  const id = 'trusted-contacts-count';
  const label = 'At least two trusted contacts are documented';
  if (trustedContacts.length >= 2) {
    return completeCheck(id, 'trusted_contacts', label);
  }
  return gapCheck(id, 'trusted_contacts', label, {
    id,
    category: 'trusted_contacts',
    title: 'Add two trusted contacts',
    detail: 'Two contacts avoids a single point of failure during an emergency.',
    severity: 'high',
    priority: 20,
    action: { label: 'Add trusted contact', route: '/trusted-contacts' },
    evidence: { current: trustedContacts.length, required: 2, unit: 'trusted contacts' }
  });
}

function evaluatePrimaryContactCheck(
  trustedContacts: readonly TrustedContact[]
): ReadinessCheck {
  const id = 'trusted-contact-primary';
  const label = 'One trusted contact is marked primary';
  const primaryCount = trustedContacts.filter((contact) => contact.role === 'PRIMARY').length;
  if (primaryCount > 0) {
    return completeCheck(id, 'trusted_contacts', label);
  }
  return gapCheck(id, 'trusted_contacts', label, {
    id,
    category: 'trusted_contacts',
    title: 'Mark one contact as primary',
    detail: 'A primary contact gives your family a clear first call.',
    severity: 'medium',
    priority: 30,
    action: { label: 'Choose primary contact', route: '/trusted-contacts' },
    evidence: { current: primaryCount, required: 1, unit: 'primary contact' }
  });
}

function evaluateAssetReferenceCheck(
  assetReferences: readonly AssetReference[]
): ReadinessCheck {
  const id = 'asset-references';
  const label = 'At least one asset reference is documented';
  if (assetReferences.length > 0) {
    return completeCheck(id, 'asset_references', label);
  }
  return gapCheck(id, 'asset_references', label, {
    id,
    category: 'asset_references',
    title: 'Add an asset reference',
    detail: 'Record where your family should look without storing sensitive numbers.',
    severity: 'high',
    priority: 40,
    action: { label: 'Add asset reference', route: '/asset-references' },
    evidence: { current: assetReferences.length, required: 1, unit: 'asset reference' }
  });
}

function evaluateAssetLocationCheck(
  assetReferences: readonly AssetReference[]
): ReadinessCheck {
  const id = 'asset-location';
  const label = 'At least one asset has a location hint';
  const locatedCount = assetReferences.filter(hasDocumentedLocation).length;
  if (locatedCount > 0) {
    return completeCheck(id, 'asset_references', label);
  }
  return gapCheck(id, 'asset_references', label, {
    id,
    category: 'asset_references',
    title: 'Document where to find one asset',
    detail: 'A folder, institution, or safe location hint makes the handover actionable.',
    severity: assetReferences.length > 0 ? 'medium' : 'high',
    priority: assetReferences.length > 0 ? 50 : 45,
    action: { label: 'Add asset location hint', route: '/asset-references' },
    evidence: { current: locatedCount, required: 1, unit: 'located asset' }
  });
}

function buildChecks(input: ReadinessInput): ReadinessCheck[] {
  return [
    evaluateFamilyCheck(input.familyMembers),
    evaluateTrustedContactsCountCheck(input.trustedContacts),
    evaluatePrimaryContactCheck(input.trustedContacts),
    evaluateAssetReferenceCheck(input.assetReferences),
    evaluateAssetLocationCheck(input.assetReferences)
  ];
}

export function evaluateReadiness(input: ReadinessInput): ReadinessEvaluation {
  const checks = buildChecks(input);

  const gaps = checks
    .map((check) => check.gap)
    .filter((gap): gap is ReadinessGap => Boolean(gap))
    .sort((left, right) => left.priority - right.priority);
  const completedChecks = checks.filter((check) => check.status === 'complete').length;

  const score = Math.round((completedChecks / TOTAL_CHECKS) * 100);
  const level = getLevel(score);

  return {
    score,
    level,
    summary: getSummary(level),
    gaps,
    checks,
    completedChecks,
    totalChecks: TOTAL_CHECKS
  };
}
