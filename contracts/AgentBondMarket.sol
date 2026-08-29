// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AgentCreditRegistry.sol";
import "./AgentBondEscrow.sol";

/**
 * @title AgentBondMarket
 * @notice Verifiable AI Agent Micro-Bond Market on 0G Chain.
 * @dev Powered by AgentCreditRegistry (0G Compute & Storage proofs) and AgentBondEscrow (Non-custodial settlements).
 */
contract AgentBondMarket is Ownable, ReentrancyGuard {

    enum BondStatus { Funding, Active, Matured, Defaulted }

    struct Bond {
        uint256 bondId;
        address agent;
        uint256 principalGoal;
        uint256 totalRaised;
        uint256 couponRateBps; // 500 = 5.00%
        uint256 maturityTimestamp;
        uint256 totalRepaid;
        BondStatus status;
        bytes32 prospectusRoot; // 0G Storage Merkle root
    }

    uint256 public nextBondId = 1;
    AgentCreditRegistry public creditRegistry;
    AgentBondEscrow public bondEscrow;

    mapping(uint256 => Bond) public bonds;
    mapping(uint256 => mapping(address => uint256)) public investorInvestments;
    mapping(uint256 => mapping(address => bool)) public investorClaimed;

    event BondIssued(uint256 indexed bondId, address indexed agent, uint256 principalGoal, uint256 couponRateBps);
    event BondSubscribed(uint256 indexed bondId, address indexed investor, uint256 amount);
    event BondRepaid(uint256 indexed bondId, uint256 totalAmount);
    event YieldClaimed(uint256 indexed bondId, address indexed investor, uint256 amount);
    event BondDefaulted(uint256 indexed bondId, address indexed agent);

    constructor(address _creditRegistry, address payable _bondEscrow) Ownable(msg.sender) {
        require(_creditRegistry != address(0), "Invalid registry address");
        require(_bondEscrow != address(0), "Invalid escrow address");
        creditRegistry = AgentCreditRegistry(_creditRegistry);
        bondEscrow = AgentBondEscrow(_bondEscrow);
    }

    function setRegistry(address _creditRegistry) external onlyOwner {
        creditRegistry = AgentCreditRegistry(_creditRegistry);
    }

    function setEscrow(address payable _bondEscrow) external onlyOwner {
        bondEscrow = AgentBondEscrow(_bondEscrow);
    }

    /**
     * @notice Issue a micro-bond; requires confirmed 0G credit rating (Score >= 600).
     */
    function issueBond(
        uint256 principalGoal,
        uint256 couponRateBps,
        uint256 durationSeconds,
        bytes32 prospectusRoot
    ) external returns (uint256) {
        require(creditRegistry.isAgentEligibleForDebt(msg.sender, 600), "Credit score too low or unconfirmed on 0G");
        require(principalGoal > 0, "Principal must be > 0");
        require(durationSeconds > 0, "Duration must be > 0");
        require(prospectusRoot != bytes32(0), "0G Storage prospectus root required");

        uint256 bondId = nextBondId++;
        bonds[bondId] = Bond({
            bondId: bondId,
            agent: msg.sender,
            principalGoal: principalGoal,
            totalRaised: 0,
            couponRateBps: couponRateBps,
            maturityTimestamp: block.timestamp + durationSeconds,
            totalRepaid: 0,
            status: BondStatus.Funding,
            prospectusRoot: prospectusRoot
        });

        emit BondIssued(bondId, msg.sender, principalGoal, couponRateBps);
        return bondId;
    }

    /**
     * @notice Subscribe to bond funding phase. Funds are escrowed until target is reached.
     */
    function subscribeToBond(uint256 bondId) external payable nonReentrant {
        Bond storage bond = bonds[bondId];
        require(bond.status == BondStatus.Funding, "Bond not in funding phase");
        require(msg.value > 0, "Subscription must be > 0");
        require(bond.totalRaised + msg.value <= bond.principalGoal, "Exceeds principal goal");

        bond.totalRaised += msg.value;
        investorInvestments[bondId][msg.sender] += msg.value;

        // Deposit into non-custodial escrow
        bondEscrow.depositSubscription{value: msg.value}(bondId);

        if (bond.totalRaised == bond.principalGoal) {
            bond.status = BondStatus.Active;
            // Escrow automatically disburses to agent
            bondEscrow.disburseToAgent(bondId, bond.agent);
        }

        emit BondSubscribed(bondId, msg.sender, msg.value);
    }

    function calculateRepaymentAmount(uint256 bondId) public view returns (uint256) {
        Bond memory bond = bonds[bondId];
        uint256 interest = (bond.principalGoal * bond.couponRateBps) / 10000;
        return bond.principalGoal + interest;
    }

    /**
     * @notice Agent repays principal + coupon yield into escrow.
     */
    function repayBond(uint256 bondId) external payable nonReentrant {
        Bond storage bond = bonds[bondId];
        require(bond.status == BondStatus.Active, "Bond is not active");
        require(msg.sender == bond.agent, "Only issuing agent can repay");

        uint256 requiredAmount = calculateRepaymentAmount(bondId);
        require(msg.value >= requiredAmount, "Insufficient repayment amount");

        bond.status = BondStatus.Matured;
        bond.totalRepaid = msg.value;

        // Forward repayment into escrow for investor claims
        bondEscrow.depositRepayment{value: msg.value}(bondId);

        emit BondRepaid(bondId, msg.value);
    }

    /**
     * @notice Investors claim their share of principal + yield from escrow.
     */
    function claimYield(uint256 bondId) external nonReentrant {
        Bond memory bond = bonds[bondId];
        require(bond.status == BondStatus.Matured, "Bond has not matured");

        uint256 investment = investorInvestments[bondId][msg.sender];
        require(investment > 0, "No investment found for caller");
        require(!investorClaimed[bondId][msg.sender], "Yield already claimed");

        investorClaimed[bondId][msg.sender] = true;

        uint256 claimAmount = (investment * bond.totalRepaid) / bond.principalGoal;
        require(claimAmount > 0, "Nothing to claim");

        // Escrow pays out to investor
        bondEscrow.payoutYield(bondId, payable(msg.sender), claimAmount);

        emit YieldClaimed(bondId, msg.sender, claimAmount);
    }

    /**
     * @notice Mark defaulted bonds and trigger score penalization in registry.
     */
    function markDefaulted(uint256 bondId) external {
        Bond storage bond = bonds[bondId];
        require(bond.status == BondStatus.Active, "Bond not active");
        require(block.timestamp > bond.maturityTimestamp, "Bond has not expired yet");

        bond.status = BondStatus.Defaulted;

        // Trigger on-chain registry penalty
        try creditRegistry.penalizeDefault(bond.agent, 150) {} catch {}

        emit BondDefaulted(bondId, bond.agent);
    }

    function getBond(uint256 bondId) external view returns (Bond memory) {
        return bonds[bondId];
    }

    function getTotalBonds() external view returns (uint256) {
        return nextBondId - 1;
    }
}
