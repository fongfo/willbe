import type { Gap, GapCategory, ReadinessAssessment, ReadinessInput } from './readiness.types';

// Ported from the prototype's `computeAssessment()`. Scores start at 100 and each
// triggered rule deducts points and emits a structured gap.
const STARTING_SCORE = 100;
const MIN_SCORE = 55;
// Product choice carried over from the prototype: a plan with no gaps tops out at 96,
// never 100 — there is always a richer playbook to add. Centralised here so it is
// explicit rather than a magic number.
const NO_GAP_SCORE = 96;

interface Rule {
  code: string;
  category: GapCategory;
  scoreImpact: number;
  message: string;
  isTriggered: (input: ReadinessInput) => boolean;
}

const RULES: readonly Rule[] = [
  {
    code: 'ADD_FAMILY_MEMBER',
    category: 'FAMILY',
    scoreImpact: 10,
    message: 'Add at least one more family member so the plan reflects the real household.',
    isTriggered: (input) => input.familyMemberCount < 2
  },
  {
    code: 'ADD_BACKUP_CONTACT',
    category: 'CONTACTS',
    scoreImpact: 12,
    message: 'Add a backup trusted contact so the family is not dependent on one person.',
    isTriggered: (input) => input.contactCount < 2
  },
  {
    code: 'ADD_ASSET_REFERENCES',
    category: 'ASSETS',
    scoreImpact: 10,
    message: 'Add more asset references so important categories are easier to find in an emergency.',
    isTriggered: (input) => input.assetCount < 3
  },
  {
    code: 'ADD_ADVISOR_CONTACT',
    category: 'CONTACTS',
    scoreImpact: 8,
    message: 'Consider adding an advisor or lawyer as a supporting trusted contact.',
    isTriggered: (input) => !input.hasAdvisorContact
  },
  {
    code: 'CONNECT_CLOUD_PROVIDER',
    category: 'INTEGRATIONS',
    scoreImpact: 12,
    message:
      'Connect at least one familiar cloud provider so document locations feel easier to retrieve.',
    isTriggered: (input) => input.connectedProviderCount === 0
  },
  {
    code: 'CLARIFY_CUSTOM_REMINDER',
    category: 'CHECK_IN',
    scoreImpact: 5,
    message: 'Clarify the exact timing for the custom reminder so check-ins do not get forgotten.',
    isTriggered: (input) => input.checkInFrequency === 'CUSTOM_ANNUAL'
  },
  {
    code: 'ADD_BENEFICIARY_NOTES',
    category: 'ASSETS',
    scoreImpact: 8,
    message:
      'Add beneficiary status notes to one or more assets so your family knows what is already set up.',
    isTriggered: (input) => !input.hasBeneficiaryNote
  }
];

export function computeReadiness(input: ReadinessInput): ReadinessAssessment {
  const gaps: Gap[] = [];
  let score = STARTING_SCORE;

  for (const rule of RULES) {
    if (rule.isTriggered(input)) {
      gaps.push({
        code: rule.code,
        category: rule.category,
        message: rule.message,
        scoreImpact: rule.scoreImpact
      });
      score -= rule.scoreImpact;
    }
  }

  if (gaps.length === 0) {
    return { score: NO_GAP_SCORE, gaps };
  }

  return { score: Math.max(MIN_SCORE, score), gaps };
}
