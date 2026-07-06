import type { AssetReference } from '../src/asset-references/assetReference.types';
import type { FamilyMember } from '../src/family-members/familyMember.types';
import { getDashboardAction, getDashboardMetrics } from '../src/home/homeDashboard';
import { evaluateReadiness } from '../src/readiness/evaluateReadiness';
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

describe('home dashboard helpers', () => {
  it('summarizes the dashboard metric counts', () => {
    const metrics = getDashboardMetrics({
      familyMembers: [makeMember()],
      trustedContacts: [
        makeContact(),
        makeContact({ id: 'c2', role: 'BACKUP' })
      ],
      assetReferences: [makeAsset()]
    });

    expect(metrics.map((metric) => metric.value)).toEqual(['1', '2', '1']);
    expect(metrics.map((metric) => metric.detail)).toContain('primary selected');
  });

  it('routes incomplete plans to the first readiness gap', () => {
    const evaluation = evaluateReadiness({
      familyMembers: [makeMember()],
      trustedContacts: [makeContact()],
      assetReferences: []
    });

    expect(getDashboardAction(evaluation)).toEqual(
      expect.objectContaining({
        title: 'Strengthen trusted contacts',
        route: '/trusted-contacts'
      })
    );
  });

  it('routes complete plans to the emergency handover preview', () => {
    const evaluation = evaluateReadiness({
      familyMembers: [makeMember()],
      trustedContacts: [makeContact(), makeContact({ id: 'c2', role: 'BACKUP' })],
      assetReferences: [makeAsset()]
    });

    expect(getDashboardAction(evaluation).route).toBe('/emergency-handover');
  });
});
