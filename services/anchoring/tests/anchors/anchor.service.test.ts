import { AnchorService } from '../../src/anchors/anchor.service';
import { InMemoryAnchorRepository } from '../../src/anchors/anchor.repository';
import { MockProofOfPlanGateway } from '../../src/anchors/proof-gateway';

describe('AnchorService', () => {
  it('anchors a plan snapshot without exposing raw plan data', async () => {
    const service = new AnchorService(
      new InMemoryAnchorRepository(),
      new MockProofOfPlanGateway({
        contractAddress: '0x0000000000000000000000000000000000001000',
        network: 'polygon-amoy'
      })
    );

    const result = await service.anchorPlan({
      ownerRef: 'owner-1',
      snapshot: {
        familyMembers: [{ id: 'm1', relation: 'SPOUSE' }],
        assetReferences: [{ id: 'a1', category: 'BANK', locationHint: 'Google Drive' }]
      }
    });

    expect(result.ownerRef).toBe('owner-1');
    expect(result.planRef).toMatch(/^0x[0-9a-f]{64}$/);
    expect(result.planHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(result.version).toBe(1);
    expect(result.status).toBe('ANCHORED');
    expect(result.transactionHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(JSON.stringify(result)).not.toContain('Google Drive');
    expect(JSON.stringify(result)).not.toContain('familyMembers');
  });

  it('increments the version when the same owner anchors again', async () => {
    const service = new AnchorService(
      new InMemoryAnchorRepository(),
      new MockProofOfPlanGateway()
    );

    const first = await service.anchorPlan({
      ownerRef: 'owner-1',
      snapshot: { version: 'initial' }
    });
    const second = await service.anchorPlan({
      ownerRef: 'owner-1',
      snapshot: { version: 'updated' }
    });

    expect(first.version).toBe(1);
    expect(second.version).toBe(2);
    expect(second.planRef).toBe(first.planRef);
    expect(second.planHash).not.toBe(first.planHash);
  });

  it('returns the latest proof for an owner', async () => {
    const service = new AnchorService(
      new InMemoryAnchorRepository(),
      new MockProofOfPlanGateway()
    );

    await service.anchorPlan({ ownerRef: 'owner-1', snapshot: { ok: true } });

    const found = await service.findLatestByOwner('owner-1');
    const missing = await service.findLatestByOwner('missing');

    expect(found?.ownerRef).toBe('owner-1');
    expect(missing).toBeNull();
  });

  it('rejects snapshots with sensitive fields before hashing or anchoring', async () => {
    const service = new AnchorService(
      new InMemoryAnchorRepository(),
      new MockProofOfPlanGateway()
    );

    await expect(
      service.anchorPlan({
        ownerRef: 'owner-1',
        snapshot: { credentials: { seedPhrase: 'never' } }
      })
    ).rejects.toThrow('Sensitive field is not allowed');
  });
});
