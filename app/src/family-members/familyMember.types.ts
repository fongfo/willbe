/**
 * Client-side types for the family-members resource.
 * Mirrors the backend Prisma model and `Relation` enum so the app and API
 * stay in lockstep (see `backend/prisma/schema.prisma`).
 */

export const RELATIONS = [
  'SELF',
  'SPOUSE',
  'CHILD',
  'PARENT',
  'SIBLING',
  'OTHER'
] as const;

export type Relation = (typeof RELATIONS)[number];

export interface FamilyMember {
  id: string;
  name: string;
  relation: Relation;
  detail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFamilyMemberInput {
  name: string;
  relation: Relation;
  detail?: string | null;
}
