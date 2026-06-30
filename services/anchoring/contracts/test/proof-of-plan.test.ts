import { expect } from 'chai';
import { ethers } from 'hardhat';
import { anyUint } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import type { ProofOfPlan } from '../typechain-types';
import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

const ZERO32 = ethers.ZeroHash;
const planRef = ethers.keccak256(ethers.toUtf8Bytes('plan-1'));
const otherRef = ethers.keccak256(ethers.toUtf8Bytes('plan-2'));
const planHash = ethers.keccak256(ethers.toUtf8Bytes('snapshot-v1'));
const nextHash = ethers.keccak256(ethers.toUtf8Bytes('snapshot-v2'));

describe('ProofOfPlan', () => {
  let contract: ProofOfPlan;
  let owner: HardhatEthersSigner;
  let stranger: HardhatEthersSigner;

  beforeEach(async () => {
    [owner, stranger] = await ethers.getSigners();
    const factory = await ethers.getContractFactory('ProofOfPlan');
    contract = await factory.deploy(owner.address);
    await contract.waitForDeployment();
  });

  describe('deployment', () => {
    it('sets the deployer-provided initial owner', async () => {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it('starts with no anchored plans', async () => {
      expect(await contract.anchoredPlanCount()).to.equal(0n);
      expect(await contract.isAnchored(planRef)).to.equal(false);
    });
  });

  describe('anchorProof', () => {
    it('anchors a new proof at version 1 and emits ProofAnchored', async () => {
      await expect(contract.anchorProof(planRef, planHash))
        .to.emit(contract, 'ProofAnchored')
        .withArgs(planRef, planHash, 1, anyUint);

      const proof = await contract.getProof(planRef);
      expect(proof.planHash).to.equal(planHash);
      expect(proof.version).to.equal(1n);
      expect(proof.anchoredAt).to.be.greaterThan(0n);
      expect(await contract.isAnchored(planRef)).to.equal(true);
      expect(await contract.anchoredPlanCount()).to.equal(1n);
    });

    it('bumps the version and replaces the hash when re-anchoring the same plan', async () => {
      await contract.anchorProof(planRef, planHash);
      await expect(contract.anchorProof(planRef, nextHash))
        .to.emit(contract, 'ProofAnchored')
        .withArgs(planRef, nextHash, 2, anyUint);

      const proof = await contract.getProof(planRef);
      expect(proof.planHash).to.equal(nextHash);
      expect(proof.version).to.equal(2n);
      // Re-anchoring an existing plan must not double-count it.
      expect(await contract.anchoredPlanCount()).to.equal(1n);
    });

    it('tracks distinct plans independently', async () => {
      await contract.anchorProof(planRef, planHash);
      await contract.anchorProof(otherRef, nextHash);

      expect((await contract.getProof(planRef)).planHash).to.equal(planHash);
      expect((await contract.getProof(otherRef)).planHash).to.equal(nextHash);
      expect(await contract.anchoredPlanCount()).to.equal(2n);
    });

    it('reverts when a non-owner attempts to anchor', async () => {
      await expect(contract.connect(stranger).anchorProof(planRef, planHash))
        .to.be.revertedWithCustomError(contract, 'OwnableUnauthorizedAccount')
        .withArgs(stranger.address);
    });

    it('reverts on a zero plan reference', async () => {
      await expect(contract.anchorProof(ZERO32, planHash)).to.be.revertedWithCustomError(
        contract,
        'InvalidPlanRef'
      );
    });

    it('reverts on a zero plan hash', async () => {
      await expect(contract.anchorProof(planRef, ZERO32)).to.be.revertedWithCustomError(
        contract,
        'InvalidPlanHash'
      );
    });
  });

  describe('reads for unknown plans', () => {
    it('returns a zeroed proof and false for a plan that was never anchored', async () => {
      const proof = await contract.getProof(otherRef);
      expect(proof.planHash).to.equal(ZERO32);
      expect(proof.version).to.equal(0n);
      expect(proof.anchoredAt).to.equal(0n);
      expect(await contract.isAnchored(otherRef)).to.equal(false);
    });
  });

  describe('ownership transfer', () => {
    it('lets a new owner anchor after transfer and locks out the old owner', async () => {
      await contract.transferOwnership(stranger.address);
      expect(await contract.owner()).to.equal(stranger.address);

      await expect(contract.connect(stranger).anchorProof(planRef, planHash)).to.emit(
        contract,
        'ProofAnchored'
      );
      await expect(
        contract.connect(owner).anchorProof(otherRef, planHash)
      ).to.be.revertedWithCustomError(contract, 'OwnableUnauthorizedAccount');
    });
  });
});
