import type { TrustedContactModel as TrustedContact } from '../generated/prisma/models';
import type { AssetReferenceModel as AssetReference } from '../generated/prisma/models';
import type {
  HandoverContact,
  HandoverLocation,
  HandoverView
} from './handover.types';

// PRIMARY contacts are called before BACKUP contacts. A lower rank sorts first.
const ROLE_ORDER: Record<string, number> = { PRIMARY: 0, BACKUP: 1 };

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

// Pure assembly of the emergency handover view from already-fetched records.
export function buildHandover(
  contacts: readonly TrustedContact[],
  assets: readonly AssetReference[]
): HandoverView {
  const orderedContacts = orderContacts(contacts.map(toContact));
  const locations = assets.map(toLocation);
  const documentedCount = locations.filter((location) => location.documented).length;
  const undocumentedCount = locations.length - documentedCount;

  return {
    contacts: orderedContacts,
    locations,
    steps: buildSteps(orderedContacts, documentedCount, undocumentedCount),
    summary: {
      contactCount: orderedContacts.length,
      locationCount: locations.length,
      documentedCount
    }
  };
}
