// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title ProofOfPlan
/// @notice Anchors tamper-evident commitments ("proofs") of a user's contingency
///         plan on-chain. Only a hash digest is ever stored — never plan contents —
///         honouring Pusaka's "store references, never sensitive data" principle.
/// @dev The custodial anchoring service (the contract owner) submits proofs on behalf
///      of plan owners. Plan owners are identified off-chain and represented here only
///      by an opaque `planRef` (e.g. keccak256 of an internal owner reference), so no
///      personal data is exposed on-chain.
contract ProofOfPlan is Ownable {
    /// @param planHash  Commitment to the plan snapshot (e.g. a Merkle root).
    /// @param version   Monotonically increasing per planRef; the first anchor is 1.
    /// @param anchoredAt Block timestamp of the most recent anchor.
    struct Proof {
        bytes32 planHash;
        uint64 version;
        uint64 anchoredAt;
    }

    mapping(bytes32 => Proof) private _proofs;
    uint256 private _anchoredPlanCount;

    /// @notice Emitted whenever a plan's proof is anchored or re-anchored.
    event ProofAnchored(
        bytes32 indexed planRef,
        bytes32 planHash,
        uint64 version,
        uint64 anchoredAt
    );

    error InvalidPlanRef();
    error InvalidPlanHash();

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @notice Anchor (or re-anchor) the proof for a plan.
    /// @dev Re-anchoring an existing plan bumps its version and replaces the stored
    ///      hash; it does not increase the unique plan count.
    /// @param planRef  Opaque reference to the plan (must be non-zero).
    /// @param planHash Commitment to the plan snapshot (must be non-zero).
    /// @return version The new version number for this plan.
    function anchorProof(bytes32 planRef, bytes32 planHash)
        external
        onlyOwner
        returns (uint64 version)
    {
        if (planRef == bytes32(0)) revert InvalidPlanRef();
        if (planHash == bytes32(0)) revert InvalidPlanHash();

        Proof storage existing = _proofs[planRef];
        if (existing.version == 0) {
            _anchoredPlanCount += 1;
        }

        version = existing.version + 1;
        uint64 anchoredAt = uint64(block.timestamp);

        existing.planHash = planHash;
        existing.version = version;
        existing.anchoredAt = anchoredAt;

        emit ProofAnchored(planRef, planHash, version, anchoredAt);
    }

    /// @notice Returns the stored proof for a plan, or a zeroed struct if never anchored.
    function getProof(bytes32 planRef) external view returns (Proof memory) {
        return _proofs[planRef];
    }

    /// @notice Whether a plan has ever been anchored.
    function isAnchored(bytes32 planRef) external view returns (bool) {
        return _proofs[planRef].version != 0;
    }

    /// @notice Number of distinct plans that have been anchored at least once.
    function anchoredPlanCount() external view returns (uint256) {
        return _anchoredPlanCount;
    }
}
