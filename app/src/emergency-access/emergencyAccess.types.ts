import type { AssetCategory } from '../asset-references/assetReference.types';
import type { Relation } from '../family-members/familyMember.types';
import type { ContactRole } from '../trusted-contacts/trustedContact.types';

export const EMERGENCY_ACCESS_REASONS = [
  'ACCIDENT',
  'DEATH',
  'SERIOUS_ILLNESS',
  'UNREACHABLE',
  'OTHER'
] as const;

export type EmergencyAccessReason = (typeof EMERGENCY_ACCESS_REASONS)[number];

export type EmergencyAccessStatus =
  | 'REQUESTED'
  | 'COOLING_OFF'
  | 'SECONDARY_REVIEW'
  | 'ACTIVE'
  | 'DENIED'
  | 'REJECTED_BY_OWNER'
  | 'SUSPENDED'
  | 'CLOSED'
  | 'EXPIRED';

export interface EmergencyAccessRequestSummary {
  id: string;
  status: EmergencyAccessStatus;
  reason: EmergencyAccessReason;
  reasonDetail: string | null;
  coolingOffEndsAt: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
  closedAt: string | null;
  createdAt: string;
}

export interface ContactAccessAssignment {
  id: string;
  ownerUserId: string;
  name: string;
  relation: Relation;
  role: ContactRole;
  phone: string;
  email: string | null;
  verificationStatus: 'PENDING' | 'VERIFIED';
  planner: {
    id: string;
    name: string | null;
  };
  latestRequest: EmergencyAccessRequestSummary | null;
}

export interface CreateEmergencyAccessRequestInput {
  ownerUserId: string;
  trustedContactId: string;
  reason: EmergencyAccessReason;
  reasonDetail?: string;
  confirmed: true;
}

export interface HandoverFamilyMember {
  name: string;
  relation: Relation;
  detail: string | null;
}

export interface HandoverContact {
  name: string;
  relation: Relation;
  role: ContactRole;
  phone: string;
  email: string | null;
}

export interface HandoverLocation {
  name: string;
  category: AssetCategory;
  locationHint: string | null;
  documented: boolean;
}

export interface ContactEmergencyHandover {
  instruction: {
    message: string | null;
    firstSteps: string[];
  };
  family: HandoverFamilyMember[];
  contacts: HandoverContact[];
  locations: HandoverLocation[];
  steps: string[];
  summary: {
    contactCount: number;
    familyMemberCount: number;
    locationCount: number;
    documentedCount: number;
  };
}
