import { buildEmergencyHandover } from '../src/emergency-handover/buildEmergencyHandover';
import type { AssetReference } from '../src/asset-references/assetReference.types';
import type { FamilyMember } from '../src/family-members/familyMember.types';
import type { TrustedContact } from '../src/trusted-contacts/trustedContact.types';

function makeMember(overrides: Partial<FamilyMember> = {}): FamilyMember {
  return {
    id: 'f1',
    name: 'Amina',
    relation: 'SELF',
    detail: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides
  };
}

function makeContact(overrides: Partial<TrustedContact> = {}): TrustedContact {
  return {
    id: 'c1',
    name: 'Sara',
    relation: 'SIBLING',
    role: 'PRIMARY',
    phone: '+60123456789',
    email: null,
    verificationStatus: 'VERIFIED',
    detail: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides
  };
}

function makeAsset(overrides: Partial<AssetReference> = {}): AssetReference {
  return {
    id: 'a1',
    name: 'Maybank',
    category: 'BANK',
    locationHint: 'Drive / Family / Banking',
    detail: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides
  };
}

describe('buildEmergencyHandover', () => {
  it('chooses the primary contact and separates backup contacts', () => {
    const result = buildEmergencyHandover({
      familyMembers: [makeMember()],
      trustedContacts: [
        makeContact({ id: 'c1', role: 'BACKUP' }),
        makeContact({ id: 'c2', name: 'Nur', role: 'PRIMARY' })
      ],
      assetReferences: [makeAsset()]
    });

    expect(result.primaryContact?.name).toBe('Nur');
    expect(result.backupContacts.map((contact) => contact.id)).toEqual(['c1']);
    expect(result.gaps).toHaveLength(0);
  });

  it('keeps undocumented assets out of the handover preview', () => {
    const result = buildEmergencyHandover({
      familyMembers: [makeMember()],
      trustedContacts: [makeContact(), makeContact({ id: 'c2', role: 'BACKUP' })],
      assetReferences: [makeAsset({ id: 'a1' }), makeAsset({ id: 'a2', locationHint: null })]
    });

    expect(result.documentedAssets.map((reference) => reference.id)).toEqual(['a1']);
    expect(result.undocumentedAssets.map((reference) => reference.id)).toEqual(['a2']);
  });

  it('lists gaps when the preview is not actionable', () => {
    const result = buildEmergencyHandover({
      familyMembers: [],
      trustedContacts: [],
      assetReferences: []
    });

    expect(result.primaryContact).toBeNull();
    expect(result.gaps.map((gap) => gap.id)).toEqual([
      'family-members',
      'primary-contact',
      'backup-contact',
      'asset-location'
    ]);
  });
});
