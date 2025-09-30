// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title KooshCoin
 * @notice The platform's native ERC20 token with role-based minting. 
 */
contract KooshCoin is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /**
     * @notice Sets up the token name, symbol, and initial admin/minter.
     * @param initialAdmin The address that will have full control at the start.
     */
    constructor(address initialAdmin) ERC20("KooshCoin", "KSH") {
        // The deployer gets the admin role to manage other roles.
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        // The deployer also gets the minter role initially.
        _grantRole(MINTER_ROLE, initialAdmin);
    }

    /**
     * @notice Creates new tokens. Can only be called by accounts with MINTER_ROLE.
     */
    function mint(address to, uint256 amount) external {
        require(hasRole(MINTER_ROLE, msg.sender), "Caller does not have the minter role");
        _mint(to, amount);
    }
}