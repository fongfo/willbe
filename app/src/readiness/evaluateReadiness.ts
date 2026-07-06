import type { AssetReference } from '../asset-references/assetReference.types';
import type { FamilyMember } from '../family-members/familyMember.types';
import type { TrustedContact } from '../trusted-contacts/trustedContact.types';

export type GapSeverity = 'high' | 'medium';
export type ReadinessLevel = 'needs-work' | 'building' | 'ready';

export interface ReadinessGap {
  id: string;
  title: string;
  detail: string;
  severity: GapSeverity;
}

export interface ReadinessEvaluation {
  score: number;
  level: ReadinessLevel;
  summary: string;
  gaps: ReadinessGap[];
  completedChecks: number;
  totalChecks: number;
}

interface ReadinessInput {
  familyMembers: readonly FamilyMember[];
  trustedContacts: readonly TrustedContact[];
  assetReferences: readonly AssetReference[];
}

const TOTAL_CHECKS = 5;

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

export function evaluateReadiness({
  familyMembers,
  trustedContacts,
  assetReferences
}: ReadinessInput): ReadinessEvaluation {
  const gaps: ReadinessGap[] = [];
  let completedChecks = 0;

  if (familyMembers.length > 0) {
    completedChecks += 1;
  } else {
    gaps.push({
      id: 'family-members',
      title: 'Add at least one family member',
      detail: 'Start the plan by naming who this handover is meant to protect.',
      severity: 'high'
    });
  }

  if (trustedContacts.length >= 2) {
    completedChecks += 1;
  } else {
    gaps.push({
      id: 'trusted-contacts-count',
      title: 'Add two trusted contacts',
      detail: 'Two contacts avoids a single point of failure during an emergency.',
      severity: 'high'
    });
  }

  if (trustedContacts.some((contact) => contact.role === 'PRIMARY')) {
    completedChecks += 1;
  } else {
    gaps.push({
      id: 'trusted-contact-primary',
      title: 'Mark one contact as primary',
      detail: 'A primary contact gives your family a clear first call.',
      severity: 'medium'
    });
  }

  if (assetReferences.length > 0) {
    completedChecks += 1;
  } else {
    gaps.push({
      id: 'asset-references',
      title: 'Add an asset reference',
      detail: 'Record where your family should look without storing sensitive numbers.',
      severity: 'high'
    });
  }

  if (assetReferences.some(hasDocumentedLocation)) {
    completedChecks += 1;
  } else {
    gaps.push({
      id: 'asset-location',
      title: 'Document where to find one asset',
      detail: 'A folder, institution, or safe location hint makes the handover actionable.',
      severity: assetReferences.length > 0 ? 'medium' : 'high'
    });
  }

  const score = Math.round((completedChecks / TOTAL_CHECKS) * 100);
  const level = getLevel(score);

  return {
    score,
    level,
    summary: getSummary(level),
    gaps,
    completedChecks,
    totalChecks: TOTAL_CHECKS
  };
}
