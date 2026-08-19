import type { AssetReference } from '../asset-references/assetReference.types';
import type { FamilyMember } from '../family-members/familyMember.types';
import type { HandoverInstruction } from '../handover-instructions/handoverInstruction.types';
import type { TrustedContact } from '../trusted-contacts/trustedContact.types';

export interface HandoverGap {
  id: string;
  title: string;
  detail: string;
}

export interface EmergencyHandoverPreview {
  instruction: {
    message: string | null;
    firstSteps: string[];
  };
  protectedNames: string[];
  primaryContact: TrustedContact | null;
  backupContacts: TrustedContact[];
  documentedAssets: AssetReference[];
  undocumentedAssets: AssetReference[];
  gaps: HandoverGap[];
}

interface EmergencyHandoverInput {
  familyMembers: readonly FamilyMember[];
  handoverInstruction?: HandoverInstruction | null;
  trustedContacts: readonly TrustedContact[];
  assetReferences: readonly AssetReference[];
}

function hasLocation(reference: AssetReference): boolean {
  return Boolean(reference.locationHint?.trim());
}

export function buildEmergencyHandover({
  familyMembers,
  handoverInstruction,
  trustedContacts,
  assetReferences
}: EmergencyHandoverInput): EmergencyHandoverPreview {
  const primaryContact =
    trustedContacts.find((contact) => contact.role === 'PRIMARY') ??
    trustedContacts[0] ??
    null;
  const backupContacts = trustedContacts.filter(
    (contact) => contact.id !== primaryContact?.id
  );
  const documentedAssets = assetReferences.filter(hasLocation);
  const undocumentedAssets = assetReferences.filter((reference) => !hasLocation(reference));
  const firstSteps =
    handoverInstruction?.firstSteps.map((step) => step.trim()).filter(Boolean) ?? [];
  const gaps: HandoverGap[] = [];

  if (familyMembers.length === 0) {
    gaps.push({
      id: 'family-members',
      title: 'Name who the handover protects',
      detail: 'Add at least one family member so helpers know who this plan is for.'
    });
  }

  if (!primaryContact) {
    gaps.push({
      id: 'primary-contact',
      title: 'Choose a first contact',
      detail: 'Add a trusted contact and mark one person as primary.'
    });
  }

  if (trustedContacts.length < 2) {
    gaps.push({
      id: 'backup-contact',
      title: 'Add a backup contact',
      detail: 'A second contact helps if the first person cannot respond.'
    });
  }

  if (documentedAssets.length === 0) {
    gaps.push({
      id: 'asset-location',
      title: 'Add one findable asset reference',
      detail: 'Record where to look, such as an institution name or folder path.'
    });
  }

  return {
    instruction: {
      message: handoverInstruction?.message?.trim() || null,
      firstSteps
    },
    protectedNames: familyMembers.map((member) => member.name),
    primaryContact,
    backupContacts,
    documentedAssets,
    undocumentedAssets,
    gaps
  };
}
