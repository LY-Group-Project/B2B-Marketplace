// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Escrow
 * @notice The logic for a single transaction, holding KooshCoin tokens.
 */
contract Escrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --- State Variables ---
    address public immutable buyer;
    address public immutable seller;
    address public immutable arbitrator;
    IERC20 public immutable token;
    uint256 public immutable amount;
    uint256 public immutable creationTimestamp;
    uint256 public constant TIMEOUT_PERIOD = 30 days;

    enum State { Locked, ReleasePending, Disputed, Complete, Refunded }
    State public currentState;

    bool public buyerConfirmedDelivery = false;

    // --- Events ---
    event FundsDeposited(address indexed from, uint256 amount);
    event DeliveryConfirmed(address indexed by);
    event FundsReleased(address indexed to, uint256 amount);
    event DisputeRaised(address indexed by);
    event DisputeResolved(address indexed arbitrator, address indexed winner, uint256 amount);
    event FundsRefunded(address indexed to, uint256 amount);
    event StateChanged(State oldState, State newState);

    constructor(
        address _seller,
        address _arbitrator,
        address _tokenAddress,
        uint256 _amount,
        address _buyer
    ) {
        buyer = _buyer;
        seller = _seller;
        arbitrator = _arbitrator;
        token = IERC20(_tokenAddress);
        amount = _amount;
        creationTimestamp = block.timestamp;
        _updateState(State.Locked);
        emit FundsDeposited(buyer, amount);
    }

    function confirmDelivery() external {
        require(msg.sender == buyer, "Only buyer can call.");
        require(currentState == State.Locked, "Escrow not locked.");
        buyerConfirmedDelivery = true;
        _updateState(State.ReleasePending);
        emit DeliveryConfirmed(buyer);
    }

    function releaseFunds() external nonReentrant {
        require(msg.sender == seller, "Only seller can call.");
        require(currentState == State.ReleasePending, "Release not pending.");
        require(buyerConfirmedDelivery, "Delivery not confirmed.");
        _updateState(State.Complete);
        token.safeTransfer(seller, amount);
        emit FundsReleased(seller, amount);
    }

    function raiseDispute() external {
        require(msg.sender == buyer || msg.sender == seller, "Only participants can dispute.");
        require(currentState == State.Locked, "Escrow not locked.");
        _updateState(State.Disputed);
        emit DisputeRaised(msg.sender);
    }

    function resolveDispute(address _winner) external nonReentrant {
        require(msg.sender == arbitrator, "Only arbitrator can resolve.");
        require(currentState == State.Disputed, "Escrow not in dispute.");
        require(_winner == buyer || _winner == seller, "Winner must be buyer or seller.");
        
        if (_winner == seller) {
            _updateState(State.Complete);
            token.safeTransfer(seller, amount);
            emit FundsReleased(_winner, amount);
        } else {
            _updateState(State.Refunded);
            token.safeTransfer(buyer, amount);
            emit FundsRefunded(_winner, amount);
        }
        emit DisputeResolved(arbitrator, _winner, amount);
    }

    function claimFundsAfterTimeout() external nonReentrant {
        require(msg.sender == seller, "Only seller can call.");
        require(currentState == State.Locked, "Escrow not locked.");
        require(block.timestamp >= creationTimestamp + TIMEOUT_PERIOD, "Timeout period has not passed.");
        _updateState(State.Complete);
        token.safeTransfer(seller, amount);
        emit FundsReleased(seller, amount);
    }

    function getBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
    
    function _updateState(State _newState) internal {
        emit StateChanged(currentState, _newState);
        currentState = _newState;
    }
}