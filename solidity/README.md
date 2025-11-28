# B2B Marketplace - Smart Contracts

Solidity smart contracts for the B2B Marketplace blockchain escrow system, built with Hardhat and OpenZeppelin.

## 🚀 Features

- **KooshCoin (KSH)** - ERC20 token for platform transactions
- **Escrow System** - Secure fund holding during order lifecycle
- **Dispute Resolution** - Admin-mediated conflict resolution
- **Token Burning** - Convert tokens to fiat payouts
- **Role-Based Access** - Admin and minter role management

## 📁 Contract Structure

```
solidity/
├── contracts/
│   ├── KooshCoin.sol       # ERC20 Token contract
│   ├── Escrow.sol          # Single escrow logic
│   ├── EscrowFactory.sol   # Escrow deployment factory
│   ├── KooshBurner.sol     # Token burning contract
│   └── Identity.sol        # User identity management
├── scripts/
│   ├── deploy.js           # Deployment script
│   └── ...
├── test/
│   └── ...                 # Contract tests
├── artifacts/              # Compiled contracts
├── hardhat.config.js       # Hardhat configuration
└── package.json
```

## 🔗 Smart Contracts

### KooshCoin.sol
The platform's native ERC20 token with role-based minting.

**Features:**
- ERC20 compliant token
- Role-based access control (Admin, Minter)
- Controlled minting by authorized addresses
- Standard transfer, approve, transferFrom

**Functions:**
```solidity
function mint(address to, uint256 amount) external;
function addAdmin(address newAdmin) external;
function removeAdmin(address admin) external;
function addMinter(address newMinter) external;
function removeMinter(address minter) external;
function isAdmin(address account) external view returns (bool);
function isMinter(address account) external view returns (bool);
```

### Escrow.sol
Individual escrow contract for each order transaction.

**States:**
- `Locked` - Initial state, funds held
- `ReleasePending` - Buyer confirmed delivery
- `Disputed` - Dispute raised
- `Complete` - Funds released to seller
- `Refunded` - Funds returned to buyer

**Functions:**
```solidity
function confirmDelivery() external;      // Buyer confirms receipt
function releaseFunds() external;         // Seller claims funds
function raiseDispute() external;         // Either party raises dispute
function resolveDispute(address winner) external;  // Admin resolves
function claimFundsAfterTimeout() external;  // Seller claims after 30 days
function getBalance() external view returns (uint256);
```

**Events:**
```solidity
event FundsDeposited(address indexed from, uint256 amount);
event DeliveryConfirmed(address indexed by);
event FundsReleased(address indexed to, uint256 amount);
event DisputeRaised(address indexed by);
event DisputeResolved(address indexed arbitrator, address indexed winner, uint256 amount);
event FundsRefunded(address indexed to, uint256 amount);
event StateChanged(State oldState, State newState);
```

### EscrowFactory.sol
Factory contract for deploying new escrow contracts.

**Functions:**
```solidity
function createEscrow(
    address seller,
    address arbitrator,
    address tokenAddress,
    uint256 amount
) external returns (address);

function getEscrowsForBuyer(address buyer) external view returns (address[] memory);
function getEscrowsForSeller(address seller) external view returns (address[] memory);
```

### KooshBurner.sol
Token burning contract for converting tokens to fiat.

**Functions:**
```solidity
function burn(uint256 amount) external;
function getBurnHistory(address user) external view returns (BurnRecord[] memory);
```

## 🛠️ Development Setup

### Prerequisites
- Node.js v18+
- npm or yarn

### Installation

```bash
cd solidity
npm install
```

### Compile Contracts

```bash
npx hardhat compile
```

### Run Tests

```bash
npx hardhat test

# With gas reporting
REPORT_GAS=true npx hardhat test
```

### Start Local Node

```bash
npx hardhat node
```

### Deploy to Local Network

```bash
npx hardhat run scripts/deploy.js --network localhost
```

### Deploy to Testnet (Sepolia)

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

## ⚙️ Configuration

### hardhat.config.js

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
```

### Environment Variables

Create a `.env` file:

```env
# Network RPC URLs
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your-project-id

# Deployment Account
PRIVATE_KEY=your-private-key

# Etherscan Verification
ETHERSCAN_API_KEY=your-etherscan-api-key
```

## 📜 Contract Interactions

### Using Ethers.js

```javascript
const { ethers } = require("ethers");

// Connect to provider
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

// Load contract
const kooshCoin = new ethers.Contract(
  KOOSH_TOKEN_ADDRESS,
  KooshCoinABI,
  signer
);

// Mint tokens
await kooshCoin.mint(userAddress, ethers.utils.parseEther("100"));

// Create escrow
const escrowFactory = new ethers.Contract(
  ESCROW_FACTORY_ADDRESS,
  EscrowFactoryABI,
  signer
);

const tx = await escrowFactory.createEscrow(
  sellerAddress,
  arbitratorAddress,
  KOOSH_TOKEN_ADDRESS,
  ethers.utils.parseEther("50")
);
const receipt = await tx.wait();
```

### Escrow Flow

```javascript
// 1. Buyer approves tokens for escrow factory
await kooshCoin.approve(
  ESCROW_FACTORY_ADDRESS,
  ethers.utils.parseEther("50")
);

// 2. Create escrow (factory transfers tokens)
const escrowAddress = await escrowFactory.createEscrow(
  sellerAddress,
  arbitratorAddress,
  KOOSH_TOKEN_ADDRESS,
  ethers.utils.parseEther("50")
);

// 3. Load escrow contract
const escrow = new ethers.Contract(
  escrowAddress,
  EscrowABI,
  signer
);

// 4. Buyer confirms delivery
await escrow.connect(buyerSigner).confirmDelivery();

// 5. Seller releases funds
await escrow.connect(sellerSigner).releaseFunds();
```

### Dispute Resolution

```javascript
// Raise dispute (buyer or seller)
await escrow.connect(buyerSigner).raiseDispute();

// Admin resolves dispute
await escrow.connect(adminSigner).resolveDispute(winnerAddress);
```

## 🔐 Security Considerations

1. **Reentrancy Protection** - All contracts use OpenZeppelin's ReentrancyGuard
2. **Access Control** - Role-based permissions for admin functions
3. **Safe Token Transfers** - Using SafeERC20 for token operations
4. **Timeout Protection** - 30-day timeout for seller to claim funds
5. **Input Validation** - All inputs validated before state changes

## 🧪 Testing

### Run All Tests
```bash
npx hardhat test
```

### Run Specific Test
```bash
npx hardhat test test/Escrow.test.js
```

### Coverage Report
```bash
npx hardhat coverage
```

### Gas Report
```bash
REPORT_GAS=true npx hardhat test
```

## 📊 Gas Estimates

| Function | Gas Used |
|----------|----------|
| KooshCoin: mint | ~51,000 |
| EscrowFactory: createEscrow | ~250,000 |
| Escrow: confirmDelivery | ~45,000 |
| Escrow: releaseFunds | ~55,000 |
| Escrow: raiseDispute | ~43,000 |
| Escrow: resolveDispute | ~65,000 |
| KooshBurner: burn | ~48,000 |

## 🔗 Deployed Addresses

### Sepolia Testnet
```
KooshCoin: 0x...
EscrowFactory: 0x...
KooshBurner: 0x...
```

### Mainnet
```
KooshCoin: 0x...
EscrowFactory: 0x...
KooshBurner: 0x...
```

## 📚 Dependencies

- `@openzeppelin/contracts` - Security-audited contract libraries
- `hardhat` - Development environment
- `@nomicfoundation/hardhat-toolbox` - Hardhat plugins bundle
- `ethers` - Ethereum library

## 🚀 Deployment Checklist

- [ ] Audit contracts
- [ ] Test on testnet
- [ ] Verify on Etherscan
- [ ] Set up admin multisig
- [ ] Configure minter roles
- [ ] Update backend with addresses
- [ ] Monitor initial transactions

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Write tests for new features
3. Ensure all tests pass
4. Submit pull request

## 📖 Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Solidity Documentation](https://docs.soliditylang.org)
- [Ethereum Development](https://ethereum.org/developers)
