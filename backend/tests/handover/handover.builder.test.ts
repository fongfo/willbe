import { buildHandover } from '../../src/handover/handover.builder';
import type { TrustedContactModel as TrustedContact } from '../../src/generated/prisma/models';
import type { AssetReferenceModel as AssetReference } from '../../src/generated/prisma/models';

function contact(overrides: Partial<TrustedContact>): TrustedContact {
  return {
    id: 'c1',
    userId: 'user-1',
    name: 'Imran Rahman',
    relation: 'SPOUSE',
    role: 'PRIMARY',
    phone: '+60123456789',
    email: null,
    verificationStatus: 'VERIFIED',
    detail: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides
  };
}

function asset(overrides: Partial<AssetReference>): AssetReference {
  return {
    id: 'a1',
    userId: 'user-1',
    name: 'Maybank — main account',
    category: 'BANK',
    locationHint: '▸ Drive ▸ Family ▸ Banking',
    detail: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides
  };
}

describe('buildHandover', () => {
  it('orders contacts PRIMARY before BACKUP, preserving input order within a role', () => {
    const result = buildHandover(
      [
        contact({ id: 'b1', name: 'Sara', role: 'BACKUP' }),
        contact({ id: 'p1', name: 'Imran', role: 'PRIMARY' }),
        contact({ id: 'b2', name: 'Lim', role: 'BACKUP' })
      ],
      []
    );

    expect(result.contacts.map((c) => c.name)).toEqual(['Imran', 'Sara', 'Lim']);
  });

  it('projects only the safe contact fields (name, relation, role, phone, email)', () => {
    const result = buildHandover(
      [contact({ name: 'Imran', phone: '+60111', email: 'i@x.my', detail: 'secret note' })],
      []
    );

    expect(result.contacts[0]).toEqual({
      name: 'Imran',
      relation: 'SPOUSE',
      role: 'PRIMARY',
      phone: '+60111',
      email: 'i@x.my'
    });
    expect(result.contacts[0]).not.toHaveProperty('detail');
    expect(result.contacts[0]).not.toHaveProperty('id');
  });

  it('NEVER leaks the asset detail field into a location (privacy principle)', () => {
    const result = buildHandover(
      [],
      [asset({ name: 'Maybank', detail: 'Account 1234, balance RM250k, PIN 4321' })]
    );

    const location = result.locations[0];
    expect(location).not.toHaveProperty('detail');
    expect(JSON.stringify(result)).not.toContain('1234');
    expect(JSON.stringify(result)).not.toContain('balance');
  });

  it('marks a location documented only when a location hint is present', () => {
    const result = buildHandover(
      [],
      [
        asset({ id: 'a1', name: 'Maybank', locationHint: '▸ Drive ▸ Banking' }),
        asset({ id: 'a2', name: 'DBS Singapore', locationHint: null }),
        asset({ id: 'a3', name: 'Blank', locationHint: '   ' })
      ]
    );

    expect(result.locations.map((l) => l.documented)).toEqual([true, false, false]);
  });

  it('summarises counts of contacts, locations and documented locations', () => {
    const result = buildHandover(
      [contact({ id: 'p1' }), contact({ id: 'b1', role: 'BACKUP' })],
      [asset({ id: 'a1', locationHint: 'here' }), asset({ id: 'a2', locationHint: null })]
    );

    expect(result.summary).toEqual({ contactCount: 2, locationCount: 2, documentedCount: 1 });
  });

  it('derives ordered first steps from the available data', () => {
    const result = buildHandover(
      [
        contact({ id: 'p1', name: 'Imran', role: 'PRIMARY' }),
        contact({ id: 'b1', name: 'Sara', role: 'BACKUP' })
      ],
      [asset({ id: 'a1', locationHint: 'here' }), asset({ id: 'a2', locationHint: null })]
    );

    expect(result.steps.length).toBeGreaterThan(0);
    // First step coordinates the family, naming the primary contact first.
    expect(result.steps[0]).toContain('Imran');
    expect(result.steps[0]).toContain('Sara');
    // A later step flags the undocumented asset so the family knows to ask.
    expect(result.steps.some((step) => step.includes('1'))).toBe(true);
  });

  it('returns an empty view (no contacts, locations, or steps) for an empty plan', () => {
    const result = buildHandover([], []);

    expect(result.contacts).toEqual([]);
    expect(result.locations).toEqual([]);
    expect(result.steps).toEqual([]);
    expect(result.summary).toEqual({ contactCount: 0, locationCount: 0, documentedCount: 0 });
  });
});
