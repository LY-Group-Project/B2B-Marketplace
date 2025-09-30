// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// These imports link to the other files in your `contracts` directory.
import "./KooshCoin.sol";
import "./Escrow.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EscrowFactory (Minter Version)
 * @notice This factory MINTS new KooshCoin tokens for each escrow transaction.
 */
contract EscrowFactory is Ownable {
    // --- State Variables ---
    address[] public allEscrows;
    mapping(address => address[]) public escrowsByBuyer;
    mapping(address => address[]) public escrowsBySeller;
    KooshCoin public immutable kooshCoin;

    // --- Event ---
    event NewEscrowCreated(
        address indexed escrowContractAddress,
        address indexed buyer,
        address indexed seller,
        uint256 amount
    );

    constructor(address _kooshCoinAddress) Ownable(msg.sender) {
        require(_kooshCoinAddress != address(0), "Invalid token address");
        kooshCoin = KooshCoin(_kooshCoinAddress);
    }

    /**
     * @notice Creates a new escrow by MINTING the required amount of tokens.
     */
    function createEscrow(
        address _buyer,
        address payable _seller,
        address _arbitrator,
        uint256 _amount
    ) external onlyOwner returns (address) {
        require(_buyer != address(0), "Factory: Invalid buyer address.");
        require(_seller != address(0), "Factory: Invalid seller address.");
        require(_arbitrator != address(0), "Factory: Invalid arbitrator address.");
        require(_amount > 0, "Factory: Amount must be greater than 0.");

        Escrow newEscrow = new Escrow(_seller, _arbitrator, address(kooshCoin), _amount, _buyer);
        
        address newEscrowAddress = address(newEscrow);
        
        // The factory calls the mint function on the KooshCoin contract.
        kooshCoin.mint(newEscrowAddress, _amount);

        // Record the new escrow's address.
        allEscrows.push(newEscrowAddress);
        escrowsByBuyer[_buyer].push(newEscrowAddress);
        escrowsBySeller[_seller].push(newEscrowAddress);

        emit NewEscrowCreated(newEscrowAddress, _buyer, _seller, _amount);

        return newEscrowAddress;
    }

    // --- View Functions ---
    function getPaginatedEscrows(uint256 _page, uint256 _pageSize) external view returns (address[] memory) {
        require(_pageSize > 0, "Page size must be greater than 0.");
        uint256 totalEscrows = allEscrows.length;
        uint256 startIndex = _page * _pageSize;
        require(startIndex < totalEscrows, "Page is out of bounds.");
        uint256 endIndex = startIndex + _pageSize;
        if (endIndex > totalEscrows) {
            endIndex = totalEscrows;
        }
        address[] memory page = new address[](endIndex - startIndex);
        for (uint256 i = 0; i < page.length; i++) {
            page[i] = allEscrows[startIndex + i];
        }
        return page;
    }

    function getEscrowsForBuyer(address _buyer) external view returns (address[] memory) {
        return escrowsByBuyer[_buyer];
    }

    function getEscrowsForSeller(address _seller) external view returns (address[] memory) {
        return escrowsBySeller[_seller];
    }

    function getEscrowCount() external view returns (uint256) {
        return allEscrows.length;
    }
}