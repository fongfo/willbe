import type { AssetReference } from '../asset-references/assetReference.types';
import type { FamilyMember } from '../family-members/familyMember.types';
import type { TrustedContact } from '../trusted-contacts/trustedContact.types';

export interface DashboardSource {
  familyMembers: readonly FamilyMember[];
  trustedContacts: readonly TrustedContact[];
  assetReferences: readonly AssetReference[];
}

export interface DashboardMetric {
  id: string;
  label: string;
  value: string;
  detail: string;
}

export function getDashboardMetrics({
  familyMembers,
  trustedContacts,
  assetReferences
}: DashboardSource): DashboardMetric[] {
  const primaryContacts = trustedContacts.filter((contact) => contact.role === 'PRIMARY');
  const locatedAssets = assetReferences.filter((reference) =>
    Boolean(reference.locationHint?.trim())
  );

  return [
    {
      id: 'family',
      label: 'Family',
      value: String(familyMembers.length),
      detail: familyMembers.length === 1 ? 'person covered' : 'people covered'
    },
    {
      id: 'contacts',
      label: 'Contacts',
      value: String(trustedContacts.length),
      detail: primaryContacts.length > 0 ? 'primary selected' : 'needs primary'
    },
    {
      id: 'assets',
      label: 'Assets',
      value: String(assetReferences.length),
      detail: locatedAssets.length > 0 ? 'location hint ready' : 'needs location hint'
    }
  ];
}
