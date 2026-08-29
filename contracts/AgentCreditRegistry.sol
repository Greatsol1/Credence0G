// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AgentCreditRegistry
 * @notice Soulbound AI Agent Credit Passport & Verifiable 0G Proof Registry.
 * @dev Replaces fire-and-forget writes with 2-phase confirmable proof writes (Proposal -> Verification/Challenge -> Confirmation).
 */
contract AgentCreditRegistry is Ownable, ReentrancyGuard {

    struct AgentProfile {
        address agentWallet;
        string name;
        uint256 creditScore; // 300 to 850
        string ratingGrade;  // "AAA", "AA", "A", "BBB", "BB", "B", "CCC", "D"
        bytes32 creditReportRoot; // 0G Storage Merkle root
        bytes32 computeSignatureRoot; // 0G Compute inference hash
        uint256 lastUpdatedTimestamp;
        bool isVerified;
    }

    struct ProofProposal {
        bytes32 proofId;
        address agent;
        string name;
        uint256 creditScore;
        string ratingGrade;
        bytes32 creditReportRoot;
        bytes32 computeSignatureRoot;
        uint256 proposedTimestamp;
        uint256 challengeWindowEnd;
        bool isConfirmed;
        bool isDisputed;
        string disputeReason;
    }

    uint256 public constant DEFAULT_CHALLENGE_PERIOD = 60 seconds;

    address public creditOracle;
    uint256 public challengePeriod = DEFAULT_CHALLENGE_PERIOD;

    mapping(address => AgentProfile) public agentProfiles;
    mapping(bytes32 => ProofProposal) public proofProposals;
    mapping(address => bytes32) public latestProofByAgent;

    event ProofProposed(
        bytes32 indexed proofId,
        address indexed agent,
        uint256 score,
        string grade,
        bytes32 reportRoot,
        bytes32 computeSignatureRoot,
        uint256 challengeWindowEnd
    );

    event ProofConfirmed(
        bytes32 indexed proofId,
        address indexed agent,
        uint256 score,
        string grade,
        bytes32 reportRoot
    );

    event ProofDisputed(
        bytes32 indexed proofId,
        address indexed agent,
        address indexed challenger,
        string reason
    );

    modifier onlyOracle() {
        require(msg.sender == creditOracle || msg.sender == owner(), "Not authorized credit oracle");
        _;
    }

    constructor() Ownable(msg.sender) {
        creditOracle = msg.sender;
    }

    function setOracle(address oracle) external onlyOwner {
        creditOracle = oracle;
    }

    function setChallengePeriod(uint256 newPeriod) external onlyOwner {
        challengePeriod = newPeriod;
    }

    /**
     * @notice Phase 1: Propose a verifiable credit proof from 0G Compute & 0G Storage.
     */
    function proposeCreditProof(
        address agent,
        string calldata name,
        uint256 score,
        string calldata grade,
        bytes32 reportRoot,
        bytes32 computeSignatureRoot
    ) external onlyOracle returns (bytes32) {
        require(agent != address(0), "Invalid agent address");
        require(score >= 300 && score <= 850, "Invalid credit score range");
        require(reportRoot != bytes32(0), "0G Storage report root required");
        require(computeSignatureRoot != bytes32(0), "0G Compute signature required");

        bytes32 proofId = keccak256(
            abi.encodePacked(agent, score, grade, reportRoot, computeSignatureRoot, block.timestamp)
        );

        uint256 challengeWindowEnd = block.timestamp + challengePeriod;

        proofProposals[proofId] = ProofProposal({
            proofId: proofId,
            agent: agent,
            name: name,
            creditScore: score,
            ratingGrade: grade,
            creditReportRoot: reportRoot,
            computeSignatureRoot: computeSignatureRoot,
            proposedTimestamp: block.timestamp,
            challengeWindowEnd: challengeWindowEnd,
            isConfirmed: false,
            isDisputed: false,
            disputeReason: ""
        });

        latestProofByAgent[agent] = proofId;

        emit ProofProposed(proofId, agent, score, grade, reportRoot, computeSignatureRoot, challengeWindowEnd);
        return proofId;
    }

    /**
     * @notice Phase 2: Confirm the proof after validation or oracle approval.
     */
    function confirmCreditProof(bytes32 proofId) external nonReentrant {
        ProofProposal storage proposal = proofProposals[proofId];
        require(proposal.proofId != bytes32(0), "Proof proposal not found");
        require(!proposal.isConfirmed, "Proof already confirmed");
        require(!proposal.isDisputed, "Proof is disputed");

        // Can be confirmed immediately by oracle/owner, or by anyone after challenge window expires
        if (msg.sender != creditOracle && msg.sender != owner()) {
            require(block.timestamp >= proposal.challengeWindowEnd, "Challenge window still active");
        }

        proposal.isConfirmed = true;

        AgentProfile storage profile = agentProfiles[proposal.agent];
        profile.agentWallet = proposal.agent;
        profile.name = proposal.name;
        profile.creditScore = proposal.creditScore;
        profile.ratingGrade = proposal.ratingGrade;
        profile.creditReportRoot = proposal.creditReportRoot;
        profile.computeSignatureRoot = proposal.computeSignatureRoot;
        profile.lastUpdatedTimestamp = block.timestamp;
        profile.isVerified = true;

        emit ProofConfirmed(
            proofId,
            proposal.agent,
            proposal.creditScore,
            proposal.ratingGrade,
            proposal.creditReportRoot
        );
    }

    /**
     * @notice Challenge fraudulent or invalid proofs during the verification window.
     */
    function disputeCreditProof(bytes32 proofId, string calldata reason) external onlyOracle {
        ProofProposal storage proposal = proofProposals[proofId];
        require(proposal.proofId != bytes32(0), "Proof proposal not found");
        require(!proposal.isConfirmed, "Cannot dispute confirmed proof");

        proposal.isDisputed = true;
        proposal.disputeReason = reason;

        emit ProofDisputed(proofId, proposal.agent, msg.sender, reason);
    }

    /**
     * @notice Penalize score upon default (called by authorized bond market).
     */
    function penalizeDefault(address agent, uint256 penaltyPoints) external {
        require(msg.sender == owner() || msg.sender == creditOracle, "Unauthorized caller");
        AgentProfile storage profile = agentProfiles[agent];
        if (profile.isVerified) {
            if (profile.creditScore > 300 + penaltyPoints) {
                profile.creditScore -= penaltyPoints;
            } else {
                profile.creditScore = 300;
            }
            profile.ratingGrade = "D";
            profile.lastUpdatedTimestamp = block.timestamp;
        }
    }

    // View Functions
    function isAgentEligibleForDebt(address agent, uint256 minScore) external view returns (bool) {
        AgentProfile memory profile = agentProfiles[agent];
        return profile.isVerified && profile.creditScore >= minScore;
    }

    function getAgentProfile(address agent) external view returns (AgentProfile memory) {
        return agentProfiles[agent];
    }

    function getProofProposal(bytes32 proofId) external view returns (ProofProposal memory) {
        return proofProposals[proofId];
    }
}
