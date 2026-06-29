import type { CheckInFrequency } from '../generated/prisma/enums';

export type GapCategory = 'FAMILY' | 'CONTACTS' | 'ASSETS' | 'INTEGRATIONS' | 'CHECK_IN';

// A structured readiness gap. Kept machine-readable (stable `code` + `category` +
// `scoreImpact`) so the future LLM explanation layer (WB-24) can rank and rephrase
// these without re-deriving the underlying rule.
export interface Gap {
  code: string;
  category: GapCategory;
  message: string;
  scoreImpact: number;
}

export interface ReadinessAssessment {
  score: number;
  gaps: Gap[];
}

// Pre-derived facts the rules engine scores. Booleans (rather than raw records) keep
// the engine pure and free of any Prisma/keyword-matching concerns.
export interface ReadinessInput {
  familyMemberCount: number;
  contactCount: number;
  hasAdvisorContact: boolean;
  assetCount: number;
  hasBeneficiaryNote: boolean;
  connectedProviderCount: number;
  checkInFrequency: CheckInFrequency | null;
}
