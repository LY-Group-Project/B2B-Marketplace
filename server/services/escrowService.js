const Web3 = require("web3");
const path = require("path");
const fs = require("fs");
const Web3Key = require("../models/web3KeyModel");
const { encrypt, decrypt } = require("../utils/crypto");

// Load ABIs from Solidity artifacts
const escrowFactoryArtifact = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../../solidity/artifacts/contracts/EscrowFactory.sol/EscrowFactory.json"),
    "utf8"
  )
);
const escrowArtifact = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../../solidity/artifacts/contracts/Escrow.sol/Escrow.json"),
    "utf8"
  )
);

const EscrowFactoryABI = escrowFactoryArtifact.abi;
const EscrowABI = escrowArtifact.abi;

// Escrow state enum mapping (matches Solidity)
const EscrowState = {
  0: "Locked",
  1: "ReleasePending",
  2: "Disputed",
  3: "Complete",
  4: "Refunded",
};

class EscrowService {
  constructor() {
    this.web3 = null;
    this.factoryContract = null;
    this.adminAccount = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    const rpcUrl = process.env.WEB3_RPC_URL;
    let adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
    const factoryAddress = process.env.ESCROW_FACTORY_ADDRESS;

    if (!rpcUrl || !adminPrivateKey || !factoryAddress) {
      console.warn(
        "EscrowService: Missing WEB3_RPC_URL, ADMIN_PRIVATE_KEY, or ESCROW_FACTORY_ADDRESS. Service disabled."
      );
      return;
    }

    // Ensure private key has 0x prefix
    if (!adminPrivateKey.startsWith("0x")) {
      adminPrivateKey = "0x" + adminPrivateKey;
    }

    this.web3 = new Web3(rpcUrl);
    this.adminAccount = this.web3.eth.accounts.privateKeyToAccount(adminPrivateKey);
    this.web3.eth.accounts.wallet.add(this.adminAccount);
    this.web3.eth.defaultAccount = this.adminAccount.address;

    this.factoryContract = new this.web3.eth.Contract(EscrowFactoryABI, factoryAddress);
    this.initialized = true;
    console.log("EscrowService initialized. Admin address:", this.adminAccount.address);

    // Check admin balance
    const balance = await this.web3.eth.getBalance(this.adminAccount.address);
    const balanceInEth = this.web3.utils.fromWei(balance, "ether");
    console.log(`Admin wallet balance: ${balanceInEth} ETH`);
    if (balance === "0" || balance === 0n) {
      console.warn("⚠️  WARNING: Admin wallet has no ETH! Fund it to pay for gas.");
    }

    // Verify admin is factory owner
    try {
      const owner = await this.factoryContract.methods.owner().call();
      console.log(`Factory owner: ${owner}`);
      if (owner.toLowerCase() !== this.adminAccount.address.toLowerCase()) {
        console.warn(`⚠️  WARNING: Admin address is NOT the factory owner! Escrow creation will fail.`);
        console.warn(`   Admin: ${this.adminAccount.address}`);
        console.warn(`   Owner: ${owner}`);
      }
    } catch (err) {
      console.error("Failed to check factory owner:", err.message);
    }
  }

  isInitialized() {
    return this.initialized;
  }

  // Generate a new wallet for a user and store encrypted private key
  async generateAndStoreKey(userId) {
    const account = this.web3.eth.accounts.create();
    const encryptedKey = encrypt(account.privateKey);

    const web3Key = new Web3Key({
      user: userId,
      address: account.address.toLowerCase(),
      encryptedPrivateKey: encryptedKey,
    });

    await web3Key.save();
    return { address: account.address };
  }

  // Get or create a user's blockchain address
  async getOrCreateUserAddress(userId) {
    let web3Key = await Web3Key.findOne({ user: userId });
    if (!web3Key) {
      return await this.generateAndStoreKey(userId);
    }
    return { address: web3Key.address };
  }

  // Decrypt user's private key (use with caution, only in-memory)
  async decryptUserKey(userId) {
    const web3Key = await Web3Key.findOne({ user: userId });
    if (!web3Key) {
      throw new Error("No blockchain key found for user");
    }
    return decrypt(web3Key.encryptedPrivateKey);
  }

  // Get user's blockchain address
  async getUserAddress(userId) {
    const web3Key = await Web3Key.findOne({ user: userId });
    return web3Key ? web3Key.address : null;
  }

  // Create escrow for an order using the factory (admin-only call)
  async createEscrow(buyerAddress, sellerAddress, amountInWei) {
    if (!this.initialized) {
      throw new Error("EscrowService not initialized");
    }

    console.log("Creating escrow with params:", {
      buyer: buyerAddress,
      seller: sellerAddress,
      arbitrator: this.adminAccount.address,
      amount: amountInWei,
    });

    // Arbitrator is the admin for dispute resolution
    const arbitratorAddress = this.adminAccount.address;

    try {
      const tx = this.factoryContract.methods.createEscrow(
        buyerAddress,
        sellerAddress,
        arbitratorAddress,
        amountInWei
      );

      const gas = await tx.estimateGas({ from: this.adminAccount.address });
      console.log("Estimated gas:", gas);
      
      const gasPrice = await this.web3.eth.getGasPrice();
      console.log("Gas price:", gasPrice);

      const receipt = await tx.send({
        from: this.adminAccount.address,
        gas: Math.ceil(Number(gas) * 1.2), // 20% buffer
        gasPrice,
      });

      // Extract escrow address from NewEscrowCreated event
      const event = receipt.events.NewEscrowCreated;
      const escrowAddress = event ? event.returnValues.escrowContractAddress : null;

      console.log("Escrow created at:", escrowAddress, "tx:", receipt.transactionHash);

      return {
        escrowAddress,
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error("createEscrow error details:", error.message);
      if (error.data) console.error("Error data:", error.data);
      throw error;
    }
  }

  // Create escrow for an order object (handles address lookup and order update)
  async createEscrowForOrder(order) {
    if (!this.initialized) {
      throw new Error("EscrowService not initialized");
    }

    // Get buyer (customer) address - handle both ObjectId and populated object
    const customerId = order.customer._id || order.customer;
    const buyerData = await this.getOrCreateUserAddress(customerId);
    const buyerAddress = buyerData.address;

    // Get seller (vendor) address - use first vendor in vendorOrders
    const vendorObj = order.vendorOrders?.[0]?.vendor || order.items?.[0]?.vendor;
    const vendorId = vendorObj?._id || vendorObj;
    if (!vendorId) {
      throw new Error("No vendor found for order");
    }
    const sellerData = await this.getOrCreateUserAddress(vendorId);
    const sellerAddress = sellerData.address;

    // Convert order total to wei (assuming 1 token = 1 USD for simplicity)
    // Multiply by 10^18 for token decimals
    const amountInWei = this.web3.utils.toWei(order.total.toString(), "ether");

    // Create the escrow on blockchain
    const result = await this.createEscrow(buyerAddress, sellerAddress, amountInWei);

    // Update order with escrow info
    const Order = require("../models/orderModel");
    await Order.findByIdAndUpdate(order._id, {
      escrow: {
        address: result.escrowAddress,
        status: "Locked",
        buyerAddress,
        sellerAddress,
        amount: order.total.toString(),
        transactions: [{ 
          type: "created", 
          txHash: result.txHash, 
          blockNumber: result.blockNumber,
          timestamp: new Date() 
        }],
        createdAt: new Date(),
      },
    });

    return result;
  }

  // Get escrow contract instance
  getEscrowContract(escrowAddress) {
    return new this.web3.eth.Contract(EscrowABI, escrowAddress);
  }

  // Get escrow state and details
  async getEscrowDetails(escrowAddress) {
    if (!this.initialized) {
      throw new Error("EscrowService not initialized");
    }

    const escrow = this.getEscrowContract(escrowAddress);

    const [
      buyer,
      seller,
      arbitrator,
      amount,
      currentState,
      buyerConfirmedDelivery,
      balance,
      creationTimestamp,
    ] = await Promise.all([
      escrow.methods.buyer().call(),
      escrow.methods.seller().call(),
      escrow.methods.arbitrator().call(),
      escrow.methods.amount().call(),
      escrow.methods.currentState().call(),
      escrow.methods.buyerConfirmedDelivery().call(),
      escrow.methods.getBalance().call(),
      escrow.methods.creationTimestamp().call(),
    ]);

    return {
      buyer: buyer.toLowerCase(),
      seller: seller.toLowerCase(),
      arbitrator: arbitrator.toLowerCase(),
      amount: amount.toString(),
      state: EscrowState[currentState] || "Unknown",
      stateCode: parseInt(currentState),
      buyerConfirmedDelivery,
      balance: balance.toString(),
      creationTimestamp: parseInt(creationTimestamp),
    };
  }

  // Fund a user's wallet with ETH from admin (for gas)
  // estimatedGas: optional gas estimate for the transaction the user will perform
  async fundUserWalletForGas(userAddress, estimatedGas = 100000) {
    if (!this.initialized) {
      throw new Error("EscrowService not initialized");
    }

    const gasPrice = await this.web3.eth.getGasPrice();
    
    // Calculate required gas cost and multiply by 5 for safety margin
    const estimatedCost = BigInt(estimatedGas) * BigInt(gasPrice);
    const requiredAmount = estimatedCost * BigInt(5);
    
    // Check if user already has enough ETH
    const userBalance = await this.web3.eth.getBalance(userAddress);
    if (BigInt(userBalance) >= requiredAmount) {
      console.log(`User ${userAddress} already has sufficient ETH: ${this.web3.utils.fromWei(userBalance, "ether")} ETH (required: ${this.web3.utils.fromWei(requiredAmount.toString(), "ether")} ETH)`);
      return { funded: false, balance: userBalance };
    }

    // Fund the difference plus the required amount
    const amountToFund = requiredAmount - BigInt(userBalance);
    console.log(`Funding user ${userAddress} with ${this.web3.utils.fromWei(amountToFund.toString(), "ether")} ETH for gas (5x estimated cost)...`);

    const tx = {
      from: this.adminAccount.address,
      to: userAddress,
      value: amountToFund.toString(),
      gas: 21000,
      gasPrice,
    };

    const receipt = await this.web3.eth.sendTransaction(tx);
    console.log(`Funded user wallet. TxHash: ${receipt.transactionHash}`);

    return {
      funded: true,
      txHash: receipt.transactionHash,
      amount: this.web3.utils.fromWei(amountToFund.toString(), "ether"),
    };
  }

  // Confirm delivery (buyer action) - admin funds buyer's wallet for gas
  async confirmDelivery(escrowAddress, buyerUserId) {
    if (!this.initialized) {
      throw new Error("EscrowService not initialized");
    }

    // Get buyer's private key and create account
    const buyerPrivateKey = await this.decryptUserKey(buyerUserId);
    const buyerAccount = this.web3.eth.accounts.privateKeyToAccount(buyerPrivateKey);

    const escrow = this.getEscrowContract(escrowAddress);
    const tx = escrow.methods.confirmDelivery();

    // Estimate gas first, then fund wallet with 5x if needed
    const gas = await tx.estimateGas({ from: buyerAccount.address });
    await this.fundUserWalletForGas(buyerAccount.address, gas);
    const gasPrice = await this.web3.eth.getGasPrice();
    const nonce = await this.web3.eth.getTransactionCount(buyerAccount.address, "pending");

    const txData = {
      to: escrowAddress,
      data: tx.encodeABI(),
      gas: Math.ceil(Number(gas) * 1.2),
      gasPrice,
      nonce,
    };

    const signedTx = await buyerAccount.signTransaction(txData);
    const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    return {
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    };
  }

  // Release funds (seller action) - admin funds seller's wallet for gas
  async releaseFunds(escrowAddress, sellerUserId) {
    if (!this.initialized) {
      throw new Error("EscrowService not initialized");
    }

    const sellerPrivateKey = await this.decryptUserKey(sellerUserId);
    const sellerAccount = this.web3.eth.accounts.privateKeyToAccount(sellerPrivateKey);

    const escrow = this.getEscrowContract(escrowAddress);
    const tx = escrow.methods.releaseFunds();

    // Estimate gas first, then fund wallet with 5x if needed
    const gas = await tx.estimateGas({ from: sellerAccount.address });
    await this.fundUserWalletForGas(sellerAccount.address, gas);
    const gasPrice = await this.web3.eth.getGasPrice();
    const nonce = await this.web3.eth.getTransactionCount(sellerAccount.address, "pending");

    const txData = {
      to: escrowAddress,
      data: tx.encodeABI(),
      gas: Math.ceil(Number(gas) * 1.2),
      gasPrice,
      nonce,
    };

    const signedTx = await sellerAccount.signTransaction(txData);
    const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    return {
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    };
  }

  // Raise dispute (buyer or seller action) - admin funds user's wallet for gas
  async raiseDispute(escrowAddress, userId) {
    if (!this.initialized) {
      throw new Error("EscrowService not initialized");
    }

    const userPrivateKey = await this.decryptUserKey(userId);
    const userAccount = this.web3.eth.accounts.privateKeyToAccount(userPrivateKey);

    const escrow = this.getEscrowContract(escrowAddress);
    const tx = escrow.methods.raiseDispute();

    // Estimate gas first, then fund wallet with 5x if needed
    const gas = await tx.estimateGas({ from: userAccount.address });
    await this.fundUserWalletForGas(userAccount.address, gas);
    const gasPrice = await this.web3.eth.getGasPrice();
    const nonce = await this.web3.eth.getTransactionCount(userAccount.address, "pending");

    const txData = {
      to: escrowAddress,
      data: tx.encodeABI(),
      gas: Math.ceil(Number(gas) * 1.2),
      gasPrice,
      nonce,
    };

    const signedTx = await userAccount.signTransaction(txData);
    const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    return {
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    };
  }

  // Resolve dispute (admin/arbitrator action)
  async resolveDispute(escrowAddress, winnerAddress) {
    if (!this.initialized) {
      throw new Error("EscrowService not initialized");
    }

    const escrow = this.getEscrowContract(escrowAddress);
    const tx = escrow.methods.resolveDispute(winnerAddress);

    const gas = await tx.estimateGas({ from: this.adminAccount.address });
    const gasPrice = await this.web3.eth.getGasPrice();

    const receipt = await tx.send({
      from: this.adminAccount.address,
      gas: Math.ceil(gas * 1.2),
      gasPrice,
    });

    return {
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    };
  }

  // Claim funds after timeout (seller action) - admin funds seller's wallet for gas
  async claimFundsAfterTimeout(escrowAddress, sellerUserId) {
    if (!this.initialized) {
      throw new Error("EscrowService not initialized");
    }

    const sellerPrivateKey = await this.decryptUserKey(sellerUserId);
    const sellerAccount = this.web3.eth.accounts.privateKeyToAccount(sellerPrivateKey);

    const escrow = this.getEscrowContract(escrowAddress);
    const tx = escrow.methods.claimFundsAfterTimeout();

    // Estimate gas first, then fund wallet with 5x if needed
    const gas = await tx.estimateGas({ from: sellerAccount.address });
    await this.fundUserWalletForGas(sellerAccount.address, gas);
    const gasPrice = await this.web3.eth.getGasPrice();
    const nonce = await this.web3.eth.getTransactionCount(sellerAccount.address, "pending");

    const txData = {
      to: escrowAddress,
      data: tx.encodeABI(),
      gas: Math.ceil(Number(gas) * 1.2),
      gasPrice,
      nonce,
    };

    const signedTx = await sellerAccount.signTransaction(txData);
    const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    return {
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    };
  }

  // Get admin address
  getAdminAddress() {
    return this.adminAccount ? this.adminAccount.address : null;
  }

  // Convert amount to wei (assuming 18 decimals like ERC20)
  toWei(amount) {
    return this.web3.utils.toWei(amount.toString(), "ether");
  }

  // Convert wei to normal amount
  fromWei(weiAmount) {
    return this.web3.utils.fromWei(weiAmount.toString(), "ether");
  }
}

// Export singleton instance
const escrowService = new EscrowService();
module.exports = escrowService;
