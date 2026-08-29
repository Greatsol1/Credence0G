// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AgentBondEscrow
 * @notice Non-custodial escrow for bond subscriptions, proof-gated disbursements, and investor yield payouts.
 */
contract AgentBondEscrow is Ownable, ReentrancyGuard {

    address public bondMarket;

    mapping(uint256 => uint256) public escrowedFunds;
    mapping(uint256 => uint256) public repaidFunds;

    event FundsEscrowed(uint256 indexed bondId, uint256 amount);
    event FundsDisbursed(uint256 indexed bondId, address indexed recipient, uint256 amount);
    event RepaymentReceived(uint256 indexed bondId, uint256 amount);
    event YieldPaid(uint256 indexed bondId, address indexed investor, uint256 amount);

    modifier onlyMarket() {
        require(msg.sender == bondMarket, "Only BondMarket can call escrow");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function setBondMarket(address _bondMarket) external onlyOwner {
        require(_bondMarket != address(0), "Invalid market address");
        bondMarket = _bondMarket;
    }

    function depositSubscription(uint256 bondId) external payable onlyMarket {
        require(msg.value > 0, "Deposit must be > 0");
        escrowedFunds[bondId] += msg.value;
        emit FundsEscrowed(bondId, msg.value);
    }

    function disburseToAgent(uint256 bondId, address recipient) external onlyMarket nonReentrant {
        uint256 amount = escrowedFunds[bondId];
        require(amount > 0, "No escrowed funds to disburse");
        escrowedFunds[bondId] = 0;

        (bool sent, ) = payable(recipient).call{value: amount}("");
        require(sent, "Disbursement failed");

        emit FundsDisbursed(bondId, recipient, amount);
    }

    function depositRepayment(uint256 bondId) external payable onlyMarket {
        require(msg.value > 0, "Repayment must be > 0");
        repaidFunds[bondId] += msg.value;
        emit RepaymentReceived(bondId, msg.value);
    }

    function payoutYield(uint256 bondId, address payable investor, uint256 amount) external onlyMarket nonReentrant {
        require(amount > 0, "Payout must be > 0");
        require(repaidFunds[bondId] >= amount, "Insufficient repaid escrow");

        repaidFunds[bondId] -= amount;

        (bool sent, ) = investor.call{value: amount}("");
        require(sent, "Yield transfer failed");

        emit YieldPaid(bondId, investor, amount);
    }
}
