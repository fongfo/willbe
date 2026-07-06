import { evaluateReadiness } from '../src/readiness/evaluateReadiness';
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

describe('evaluateReadiness', () => {
  it('returns zero and high priority gaps when nothing is documented', () => {
    const result = evaluateReadiness({
      familyMembers: [],
      trustedContacts: [],
      assetReferences: []
    });

    expect(result.score).toBe(0);
    expect(result.level).toBe('needs-work');
    expect(result.gaps.map((gap) => gap.id)).toContain('family-members');
    expect(result.gaps.map((gap) => gap.id)).toContain('asset-references');
  });

  it('scores a complete plan as ready', () => {
    const result = evaluateReadiness({
      familyMembers: [makeMember()],
      trustedContacts: [makeContact(), makeContact({ id: 'c2', role: 'BACKUP' })],
      assetReferences: [makeAsset()]
    });

    expect(result.score).toBe(100);
    expect(result.level).toBe('ready');
    expect(result.gaps).toHaveLength(0);
  });

  it('flags missing asset location separately from the asset reference', () => {
    const result = evaluateReadiness({
      familyMembers: [makeMember()],
      trustedContacts: [makeContact(), makeContact({ id: 'c2', role: 'BACKUP' })],
      assetReferences: [makeAsset({ locationHint: null })]
    });

    expect(result.score).toBe(80);
    expect(result.gaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'asset-location', severity: 'medium' })
      ])
    );
  });
});
