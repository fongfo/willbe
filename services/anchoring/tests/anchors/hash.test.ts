import {
  buildPlanCommitment,
  canonicalizeJson,
  rejectSensitiveKeys
} from '../../src/anchors/plan-hash';

describe('plan hashing', () => {
  it('canonicalizes object key order deterministically', () => {
    const left = canonicalizeJson({ b: 2, a: { d: 4, c: 3 } });
    const right = canonicalizeJson({ a: { c: 3, d: 4 }, b: 2 });

    expect(left).toBe(right);
    expect(left).toBe('{"a":{"c":3,"d":4},"b":2}');
  });

  it('builds a stable 32-byte merkle root and plan hash for the same snapshot', () => {
    const first = buildPlanCommitment({
      familyMembers: [{ id: 'm1', relation: 'SPOUSE' }],
      trustedContacts: [{ id: 'c1', role: 'PRIMARY' }]
    });
    const second = buildPlanCommitment({
      trustedContacts: [{ role: 'PRIMARY', id: 'c1' }],
      familyMembers: [{ relation: 'SPOUSE', id: 'm1' }]
    });

    expect(first).toEqual(second);
    expect(first.merkleRoot).toMatch(/^0x[0-9a-f]{64}$/);
    expect(first.planHash).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it('changes the commitment when the plan snapshot changes', () => {
    const before = buildPlanCommitment({ assets: [{ id: 'a1', locationHint: 'Drive' }] });
    const after = buildPlanCommitment({ assets: [{ id: 'a1', locationHint: 'Safe' }] });

    expect(after.planHash).not.toBe(before.planHash);
    expect(after.merkleRoot).not.toBe(before.merkleRoot);
  });

  it('rejects fields that must never be accepted by the anchoring boundary', () => {
    expect(() =>
      rejectSensitiveKeys({
        assetReferences: [{ name: 'Bank', accountNumber: '123456789' }]
      })
    ).toThrow('Sensitive field is not allowed: assetReferences[0].accountNumber');

    expect(() =>
      rejectSensitiveKeys({
        wallet: { privateKey: '0xabc' }
      })
    ).toThrow('Sensitive field is not allowed: wallet.privateKey');

    expect(() =>
      rejectSensitiveKeys({
        wallet: { private_key: '0xabc' }
      })
    ).toThrow('Sensitive field is not allowed: wallet.private_key');
  });
});
