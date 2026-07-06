import type { Relation } from '../family-members/familyMember.types';

/**
 * Client-side types for the trusted-contacts resource.
 * Mirrors the backend Prisma model, `ContactRole` and `VerificationStatus`
 * enums (see `backend/prisma/schema.prisma`).
 */

export const CONTACT_ROLES = ['PRIMARY', 'BACKUP'] as const;
export type ContactRole = (typeof CONTACT_ROLES)[number];

export type VerificationStatus = 'PENDING' | 'VERIFIED';

export interface TrustedContact {
  id: string;
  name: string;
  relation: Relation;
  role: ContactRole;
  phone: string;
  email: string | null;
  verificationStatus: VerificationStatus;
  detail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTrustedContactInput {
  name: string;
  relation: Relation;
  role: ContactRole;
  phone: string;
  email?: string | null;
  detail?: string | null;
}

export type UpdateTrustedContactInput = CreateTrustedContactInput;
