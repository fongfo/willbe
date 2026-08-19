import type { TrustedContactModel as TrustedContact } from '../generated/prisma/models';
import type { AssetReferenceModel as AssetReference } from '../generated/prisma/models';
import type { FamilyMemberModel as FamilyMember } from '../generated/prisma/models';
import type {
  HandoverContact,
  HandoverFamilyMember,
  HandoverInstructionView,
  HandoverLocation,
  HandoverView
} from './handover.types';

// PRIMARY contacts are called before BACKUP contacts. A lower rank sorts first.
const ROLE_ORDER: Record<string, number> = { PRIMARY: 0, BACKUP: 1 };

interface BuildHandoverOptions {
  familyDetailMode?: 'include' | 'omit';
  contactVisibility?: 'all' | 'verified';
}

function hasText(value: string | null): boolean {
  return value !== null && value.trim().length > 0;
}

function toContact(contact: TrustedContact): HandoverContact {
  // Deliberately omit id/verificationStatus/detail/timestamps — the handover view
  // exposes only what a family member needs to make contact.
  return {
    name: contact.name,
    relation: contact.relation,
    role: contact.role,
    phone: contact.phone,
    email: contact.email
  };
}

function toLocation(asset: AssetReference): HandoverLocation {
  // `detail` is intentionally dropped: it may hold balances, account numbers, or
  // other sensitive notes that must stay hidden during an emergency handover.
  return {
    name: asset.name,
    category: asset.category,
    locationHint: asset.locationHint,
    documented: hasText(asset.locationHint)
  };
}

function toFamilyMember(
  member: FamilyMember,
  familyDetailMode: 'include' | 'omit'
): HandoverFamilyMember {
  return {
    name: member.name,
    relation: member.relation,
    detail: familyDetailMode === 'include' ? member.detail : null
  };
}

function orderContacts(contacts: readonly HandoverContact[]): HandoverContact[] {
  // Stable sort by role rank, preserving the repository's insertion order within a role.
  return contacts
    .map((contact, index) => ({ contact, index }))
    .sort((a, b) => {
      const roleDelta = (ROLE_ORDER[a.contact.role] ?? 99) - (ROLE_ORDER[b.contact.role] ?? 99);
      return roleDelta !== 0 ? roleDelta : a.index - b.index;
    })
    .map((entry) => entry.contact);
}

function joinNames(names: readonly string[]): string {
  return names.join(', then ');
}

function buildSteps(
  contacts: readonly HandoverContact[],
  documentedCount: number,
  undocumentedCount: number
): string[] {
  const steps: string[] = [];

  if (contacts.length > 0) {
    steps.push(`Call ${joinNames(contacts.map((c) => c.name))} to coordinate as a family.`);
  }
  if (documentedCount > 0) {
    steps.push('Open the saved folder locations to find the family’s documents.');
  }
  if (undocumentedCount > 0) {
    const noun = undocumentedCount === 1 ? 'asset has' : 'assets have';
    steps.push(
      `${undocumentedCount} ${noun} no location saved yet — ask the family where to look.`
    );
  }

  return steps;
}

function toInstruction(
  instruction?: HandoverInstructionView | null
): HandoverInstructionView {
  return {
    message: instruction?.message?.trim() || null,
    firstSteps: instruction?.firstSteps?.map((step) => step.trim()).filter(Boolean) ?? []
  };
}

// Pure assembly of the emergency handover view from already-fetched records.
export function buildHandover(
  contacts: readonly TrustedContact[],
  familyMembers: readonly FamilyMember[],
  assets: readonly AssetReference[],
  instruction?: HandoverInstructionView | null,
  options: BuildHandoverOptions = {}
): HandoverView {
  const safeContacts =
    options.contactVisibility === 'verified'
      ? contacts.filter((contact) => contact.verificationStatus === 'VERIFIED')
      : contacts;
  const familyDetailMode = options.familyDetailMode ?? 'include';
  const orderedContacts = orderContacts(safeContacts.map(toContact));
  const family = familyMembers.map((member) => toFamilyMember(member, familyDetailMode));
  const locations = assets.map(toLocation);
  const documentedCount = locations.filter((location) => location.documented).length;
  const undocumentedCount = locations.length - documentedCount;
  const safeInstruction = toInstruction(instruction);
  const fallbackSteps = buildSteps(orderedContacts, documentedCount, undocumentedCount);

  return {
    instruction: safeInstruction,
    family,
    contacts: orderedContacts,
    locations,
    steps: safeInstruction.firstSteps.length > 0 ? safeInstruction.firstSteps : fallbackSteps,
    summary: {
      contactCount: orderedContacts.length,
      familyMemberCount: family.length,
      locationCount: locations.length,
      documentedCount
    }
  };
}
