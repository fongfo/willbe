import type { Relation, ContactRole, AssetCategory } from '../generated/prisma/enums';

// The emergency handover view is a read-only, sanitised projection of the plan that
// a trusted contact would see when the user is unavailable. It follows Pusaka's core
// privacy principle: expose *who to contact* and *where things are*, never the
// sensitive contents (balances, account numbers, passwords).

// A contact a family member should reach, in the order they should be called.
export interface HandoverContact {
  name: string;
  relation: Relation;
  role: ContactRole;
  phone: string;
  email: string | null;
}

// An asset's location reference only — the asset `detail` field is deliberately
// omitted because it may hold sensitive notes that must stay hidden.
export interface HandoverLocation {
  name: string;
  category: AssetCategory;
  locationHint: string | null;
  documented: boolean;
}

export interface HandoverSummary {
  contactCount: number;
  locationCount: number;
  documentedCount: number;
}

export interface HandoverView {
  contacts: HandoverContact[];
  locations: HandoverLocation[];
  steps: string[];
  summary: HandoverSummary;
}
