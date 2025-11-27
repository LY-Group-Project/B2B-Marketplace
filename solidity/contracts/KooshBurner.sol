// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title KooshBurner
 * @notice Contract that accepts KooshCoin tokens and burns them by sending to dead address.
 * @dev Users must approve this contract to spend their tokens first.
 *      Since the original KooshCoin doesn't have a burn function, we send tokens
 *      to the dead address (0x000...dEaD) which effectively removes them from circulation.
 */
contract KooshBurner is Ownable, ReentrancyGuard {
    // The KooshCoin token contract
    IERC20 public immutable kooshCoin;
    
    // Dead address where tokens are sent (effectively burned)
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    // Minimum burn amount in USD (with 18 decimals, 1 KSH = 1 USD)
    uint256 public minBurnAmount = 10 * 10**18; // 10 USD minimum
    
    // Total amount of tokens burned through this contract
    uint256 public totalBurned;
    
    // Mapping of user address to total amount burned
    mapping(address => uint256) public userBurnedAmount;
    
    // Burn record struct
    struct BurnRecord {
        address user;
        uint256 amount;
        uint256 timestamp;
        uint256 burnId;
    }
    
    // Array of all burn records
    BurnRecord[] public burnRecords;
    
    // Mapping of user to their burn record indices
    mapping(address => uint256[]) public userBurnIndices;
    
    // Events
    event TokensBurned(
        address indexed user,
        uint256 amount,
        uint256 indexed burnId,
        uint256 timestamp
    );
    
    event MinBurnAmountUpdated(uint256 oldAmount, uint256 newAmount);
    
    /**
     * @notice Constructor sets the KooshCoin token address
     * @param _kooshCoin Address of the KooshCoin ERC20 token
     * @param _initialOwner Address of the initial owner (admin)
     */
    constructor(address _kooshCoin, address _initialOwner) Ownable(_initialOwner) {
        require(_kooshCoin != address(0), "Invalid token address");
        kooshCoin = IERC20(_kooshCoin);
    }
    
    /**
     * @notice Burn tokens by transferring them to the dead address
     * @dev User must have approved this contract to spend their tokens
     * @param amount The amount of tokens to burn (in wei, 18 decimals)
     * @return burnId The ID of this burn record
     */
    function burnTokens(uint256 amount) external nonReentrant returns (uint256 burnId) {
        require(amount >= minBurnAmount, "Amount below minimum");
        require(kooshCoin.balanceOf(msg.sender) >= amount, "Insufficient balance");
        require(
            kooshCoin.allowance(msg.sender, address(this)) >= amount,
            "Insufficient allowance - approve tokens first"
        );
        
        // Transfer tokens from user to burn address
        bool success = kooshCoin.transferFrom(msg.sender, BURN_ADDRESS, amount);
        require(success, "Token transfer failed");
        
        // Update totals
        totalBurned += amount;
        userBurnedAmount[msg.sender] += amount;
        
        // Create burn record
        burnId = burnRecords.length;
        burnRecords.push(BurnRecord({
            user: msg.sender,
            amount: amount,
            timestamp: block.timestamp,
            burnId: burnId
        }));
        
        // Track user's burn indices
        userBurnIndices[msg.sender].push(burnId);
        
        emit TokensBurned(msg.sender, amount, burnId, block.timestamp);
        
        return burnId;
    }
    
    /**
     * @notice Get the number of burn records
     */
    function getBurnRecordCount() external view returns (uint256) {
        return burnRecords.length;
    }
    
    /**
     * @notice Get a user's burn record count
     */
    function getUserBurnCount(address user) external view returns (uint256) {
        return userBurnIndices[user].length;
    }
    
    /**
     * @notice Get a user's burn records (paginated)
     * @param user The user address
     * @param offset Starting index
     * @param limit Maximum records to return
     */
    function getUserBurnRecords(
        address user,
        uint256 offset,
        uint256 limit
    ) external view returns (BurnRecord[] memory) {
        uint256[] storage indices = userBurnIndices[user];
        
        if (offset >= indices.length) {
            return new BurnRecord[](0);
        }
        
        uint256 end = offset + limit;
        if (end > indices.length) {
            end = indices.length;
        }
        
        BurnRecord[] memory records = new BurnRecord[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            records[i - offset] = burnRecords[indices[i]];
        }
        
        return records;
    }
    
    /**
     * @notice Get burn records (paginated)
     * @param offset Starting index
     * @param limit Maximum records to return
     */
    function getBurnRecords(
        uint256 offset,
        uint256 limit
    ) external view returns (BurnRecord[] memory) {
        if (offset >= burnRecords.length) {
            return new BurnRecord[](0);
        }
        
        uint256 end = offset + limit;
        if (end > burnRecords.length) {
            end = burnRecords.length;
        }
        
        BurnRecord[] memory records = new BurnRecord[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            records[i - offset] = burnRecords[i];
        }
        
        return records;
    }
    
    /**
     * @notice Update minimum burn amount (owner only)
     * @param newMinAmount New minimum amount in wei
     */
    function setMinBurnAmount(uint256 newMinAmount) external onlyOwner {
        emit MinBurnAmountUpdated(minBurnAmount, newMinAmount);
        minBurnAmount = newMinAmount;
    }
    
    /**
     * @notice Check how much allowance a user has given this contract
     * @param user The user address
     */
    function checkAllowance(address user) external view returns (uint256) {
        return kooshCoin.allowance(user, address(this));
    }
    
    /**
     * @notice Check a user's token balance
     * @param user The user address
     */
    function checkBalance(address user) external view returns (uint256) {
        return kooshCoin.balanceOf(user);
    }
    
    /**
     * @notice Get the current balance of the burn address (total burned via any method)
     */
    function getBurnAddressBalance() external view returns (uint256) {
        return kooshCoin.balanceOf(BURN_ADDRESS);
    }
}
