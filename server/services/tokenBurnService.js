const Web3 = require("web3");
const path = require("path");
const fs = require("fs");
const Web3Key = require("../models/web3KeyModel");
const BurnRecord = require("../models/burnRecordModel");
const { decrypt } = require("../utils/crypto");

// Load ABIs from Solidity artifacts
let KooshCoinABI, KooshBurnerABI;
try {
  const kooshCoinArtifact = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../../solidity/artifacts/contracts/KooshCoin.sol/KooshCoin.json"),
      "utf8"
    )
  );
  KooshCoinABI = kooshCoinArtifact.abi;
} catch (err) {
  console.warn("KooshCoin ABI not found. Token service will not function until contract is compiled.");
  KooshCoinABI = null;
}

try {
  const kooshBurnerArtifact = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../../solidity/artifacts/contracts/KooshBurner.sol/KooshBurner.json"),
      "utf8"
    )
  );
  KooshBurnerABI = kooshBurnerArtifact.abi;
} catch (err) {
  console.warn("KooshBurner ABI not found. Burn service will not function until contract is compiled.");
  KooshBurnerABI = null;
}

class TokenBurnService {
  constructor() {
    this.web3 = null;
    this.tokenContract = null;
    this.burnerContract = null;
    this.adminAccount = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    const rpcUrl = process.env.WEB3_RPC_URL;
    let adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
    const tokenAddress = process.env.KOOSH_COIN_ADDRESS || process.env.KOOSHCOIN_ADDRESS;
    const burnerAddress = process.env.KOOSH_BURNER_ADDRESS;

    if (!rpcUrl || !adminPrivateKey || !tokenAddress) {
      console.warn("TokenBurnService: Missing WEB3_RPC_URL, ADMIN_PRIVATE_KEY, or KOOSH_COIN_ADDRESS. Service disabled.");
      return;
    }

    if (!burnerAddress) {
      console.warn("TokenBurnService: Missing KOOSH_BURNER_ADDRESS. Burn functionality disabled.");
      return;
    }

    if (!KooshCoinABI) {
      console.warn("TokenBurnService: KooshCoin ABI not loaded. Run 'npx hardhat compile' first.");
      return;
    }

    if (!KooshBurnerABI) {
      console.warn("TokenBurnService: KooshBurner ABI not loaded. Run 'npx hardhat compile' first.");
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

    this.tokenContract = new this.web3.eth.Contract(KooshCoinABI, tokenAddress);
    this.burnerContract = new this.web3.eth.Contract(KooshBurnerABI, burnerAddress);
    this.tokenAddress = tokenAddress;
    this.burnerAddress = burnerAddress;
    this.initialized = true;

    console.log("TokenBurnService initialized.");
    console.log("  Token address:", tokenAddress);
    console.log("  Burner address:", burnerAddress);
    console.log("  Admin address:", this.adminAccount.address);
  }

  isInitialized() {
    return this.initialized;
  }

  /**
   * Get token decimals (should be 18 for ERC20)
   */
  async getDecimals() {
    if (!this.initialized) throw new Error("TokenBurnService not initialized");
    try {
      const decimals = await this.tokenContract.methods.decimals().call();
      return parseInt(decimals);
    } catch (err) {
      // Default to 18 if decimals() not available
      return 18;
    }
  }

  /**
   * Convert USD amount to token wei (1 KSH = 1 USD, 18 decimals)
   */
  toWei(amountUSD) {
    return this.web3.utils.toWei(amountUSD.toString(), "ether");
  }

  /**
   * Convert token wei to USD amount
   */
  fromWei(amountWei) {
    return parseFloat(this.web3.utils.fromWei(amountWei.toString(), "ether"));
  }

  /**
   * Get user's token balance in USD
   */
  async getBalance(userAddress) {
    if (!this.initialized) throw new Error("TokenBurnService not initialized");
    const balance = await this.tokenContract.methods.balanceOf(userAddress).call();
    return {
      balanceWei: balance.toString(),
      balanceUSD: this.fromWei(balance),
    };
  }

  /**
   * Get user's token balance by user ID
   */
  async getBalanceByUserId(userId) {
    if (!this.initialized) throw new Error("TokenBurnService not initialized");
    
    const web3Key = await Web3Key.findOne({ user: userId });
    if (!web3Key) {
      return { balanceWei: "0", balanceUSD: 0, address: null };
    }

    const balance = await this.getBalance(web3Key.address);
    return { ...balance, address: web3Key.address };
  }

  /**
   * Decrypt user's private key
   */
  async decryptUserKey(userId) {
    const web3Key = await Web3Key.findOne({ user: userId });
    if (!web3Key) {
      throw new Error("No blockchain wallet found for user");
    }
    return {
      privateKey: decrypt(web3Key.encryptedPrivateKey),
      address: web3Key.address,
    };
  }

  /**
   * Fund user wallet with ETH for gas (from admin account)
   */
  async fundUserWalletForGas(userAddress, estimatedGas = 100000) {
    if (!this.initialized) throw new Error("TokenBurnService not initialized");

    const gasPrice = await this.web3.eth.getGasPrice();
    
    // Calculate required gas cost and multiply by 5 for safety margin
    const estimatedCost = BigInt(estimatedGas) * BigInt(gasPrice);
    const requiredAmount = estimatedCost * BigInt(5);
    
    // Check if user already has enough ETH
    const userBalance = await this.web3.eth.getBalance(userAddress);
    if (BigInt(userBalance) >= requiredAmount) {
      console.log(`User ${userAddress} already has sufficient ETH for gas`);
      return { funded: false, reason: "sufficient_balance" };
    }

    // Fund the difference plus the required amount
    const amountToFund = requiredAmount - BigInt(userBalance);
    console.log(`Funding user ${userAddress} with ${this.web3.utils.fromWei(amountToFund.toString(), "ether")} ETH for gas...`);

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

  /**
   * Burn tokens server-side (decrypts user's key and signs tx)
   * Returns burn record with transaction details
   */
  async burnTokens(userId, amountUSD) {
    if (!this.initialized) throw new Error("TokenBurnService not initialized");

    // Validate minimum amount
    if (amountUSD < 10) {
      throw new Error("Minimum burn amount is 10 USD");
    }

    // Get user's wallet
    const { privateKey, address } = await this.decryptUserKey(userId);
    const userAccount = this.web3.eth.accounts.privateKeyToAccount(privateKey);

    // Check user's token balance
    const { balanceUSD } = await this.getBalance(address);
    if (balanceUSD < amountUSD) {
      throw new Error(`Insufficient token balance. You have ${balanceUSD} KSH, trying to burn ${amountUSD} KSH`);
    }

    // Convert to wei
    const amountWei = this.toWei(amountUSD);

    // Create burn record with pending status
    const burnRecord = new BurnRecord({
      user: userId,
      amountUSD,
      amountWei,
      fromAddress: address,
      txHash: "pending", // Will be updated after tx
      status: "pending",
    });
    await burnRecord.save();

    try {
      // Step 1: Check current allowance
      const currentAllowance = await this.tokenContract.methods
        .allowance(userAccount.address, this.burnerAddress)
        .call();

      // Step 2: Approve burner contract if needed
      if (BigInt(currentAllowance) < BigInt(amountWei)) {
        console.log(`Approving burner contract for ${amountUSD} KSH...`);
        
        // Fund user's wallet for gas (enough for approve + burn)
        await this.fundUserWalletForGas(userAccount.address, 200000);
        
        const approveTx = this.tokenContract.methods.approve(this.burnerAddress, amountWei);
        const approveGas = await approveTx.estimateGas({ from: userAccount.address });
        const approveGasPrice = await this.web3.eth.getGasPrice();
        const approveNonce = await this.web3.eth.getTransactionCount(userAccount.address, "latest");
        
        const approveTxData = {
          to: this.tokenAddress,
          data: approveTx.encodeABI(),
          gas: Math.ceil(Number(approveGas) * 1.6),
          gasPrice: Math.ceil(Number(approveGasPrice) * 1.2), // Slightly higher gas price for faster confirmation
          nonce: approveNonce,
        };
        
        const signedApproveTx = await userAccount.signTransaction(approveTxData);
        const approveReceipt = await this.web3.eth.sendSignedTransaction(signedApproveTx.rawTransaction);
        console.log(`Approval successful. TxHash: ${approveReceipt.transactionHash}, Block: ${approveReceipt.blockNumber}`);
        
        // Brief wait for network propagation (not for confirmation)
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log(`Existing allowance sufficient: ${this.fromWei(currentAllowance)} KSH`);
      }

      // Step 3: Call burner contract to burn tokens
      console.log(`Burning ${amountUSD} KSH via burner contract...`);
      
      // Re-fetch gas price and nonce fresh for burn tx
      const burnGasPrice = await this.web3.eth.getGasPrice();
      // Use "latest" to get the confirmed nonce (after approval tx is mined)
      const burnNonce = await this.web3.eth.getTransactionCount(userAccount.address, "latest");
      console.log(`Burn nonce: ${burnNonce}`);
      
      // Ensure we have enough gas for burn
      await this.fundUserWalletForGas(userAccount.address, 150000);
      
      const burnTx = this.burnerContract.methods.burnTokens(amountWei);
      
      // Estimate gas for burn
      let burnGas;
      try {
        burnGas = await burnTx.estimateGas({ from: userAccount.address });
        console.log(`Estimated burn gas: ${burnGas}`);
      } catch (estimateError) {
        console.error("Gas estimation failed:", estimateError.message);
        // Check what went wrong
        const balance = await this.tokenContract.methods.balanceOf(userAccount.address).call();
        const allowance = await this.tokenContract.methods.allowance(userAccount.address, this.burnerAddress).call();
        console.log(`User balance: ${this.fromWei(balance)}, Allowance: ${this.fromWei(allowance)}, Trying to burn: ${amountUSD}`);
        throw new Error(`Burn transaction would fail: ${estimateError.message}. Balance: ${this.fromWei(balance)} KSH, Allowance: ${this.fromWei(allowance)} KSH`);
      }
      
      const burnTxData = {
        to: this.burnerAddress,
        data: burnTx.encodeABI(),
        gas: Math.ceil(Number(burnGas) * 1.6),
        gasPrice: Math.ceil(Number(burnGasPrice) * 1.2), // Slightly higher gas price
        nonce: burnNonce,
      };

      // Sign and send burn transaction - don't wait for full confirmation
      const signedBurnTx = await userAccount.signTransaction(burnTxData);
      
      // Send transaction and get hash immediately
      const txHash = await new Promise((resolve, reject) => {
        this.web3.eth.sendSignedTransaction(signedBurnTx.rawTransaction)
          .once('transactionHash', (hash) => {
            console.log(`Burn tx submitted: ${hash}`);
            resolve(hash);
          })
          .once('error', (err) => {
            reject(err);
          });
      });

      // Update burn record with tx hash immediately (status: submitted)
      burnRecord.txHash = txHash;
      burnRecord.status = "submitted";
      await burnRecord.save();

      console.log(`Burn submitted. TxHash: ${txHash}, Amount: ${amountUSD} KSH`);

      return {
        success: true,
        burnRecord,
        txHash,
        amountUSD,
        amountWei,
        status: "submitted", // Transaction is submitted, verification will happen in background
      };
    } catch (error) {
      // Update burn record with failure
      burnRecord.status = "failed";
      burnRecord.errorMessage = error.message;
      await burnRecord.save();

      console.error("Burn failed:", error);
      throw error;
    }
  }

  /**
   * Verify a burn transaction on-chain
   */
  async verifyBurn(txHash) {
    if (!this.initialized) throw new Error("TokenBurnService not initialized");

    const receipt = await this.web3.eth.getTransactionReceipt(txHash);
    if (!receipt) {
      return { verified: false, reason: "Transaction not found" };
    }

    if (!receipt.status) {
      return { verified: false, reason: "Transaction failed" };
    }

    // Look for TokensBurned event from the KooshBurner contract
    // Event: TokensBurned(address indexed user, uint256 amount, uint256 indexed burnId, uint256 timestamp)
    // topics[0] = event signature
    // topics[1] = user (indexed)
    // topics[2] = burnId (indexed)
    // data = amount, timestamp (non-indexed)
    const burnEventSignature = this.web3.utils.sha3("TokensBurned(address,uint256,uint256,uint256)");
    const burnLog = receipt.logs.find(
      (log) =>
        log.address.toLowerCase() === this.burnerAddress.toLowerCase() &&
        log.topics[0] === burnEventSignature
    );

    if (!burnLog) {
      // Also check for Transfer to dead address as fallback
      const transferEventSignature = this.web3.utils.sha3("Transfer(address,address,uint256)");
      const deadAddress = "0x000000000000000000000000000000000000dEaD".toLowerCase();
      const transferLog = receipt.logs.find(
        (log) =>
          log.address.toLowerCase() === this.tokenAddress.toLowerCase() &&
          log.topics[0] === transferEventSignature &&
          log.topics[2] && 
          log.topics[2].toLowerCase().includes("dead")
      );

      if (transferLog) {
        try {
          const from = this.web3.eth.abi.decodeParameter("address", transferLog.topics[1]);
          const amount = this.web3.eth.abi.decodeParameter("uint256", transferLog.data);
          return {
            verified: true,
            burner: from.toLowerCase(),
            amountWei: amount.toString(),
            amountUSD: this.fromWei(amount),
            blockNumber: Number(receipt.blockNumber),
            txHash,
          };
        } catch (decodeErr) {
          console.error("Error decoding Transfer log:", decodeErr.message);
        }
      }

      return { verified: false, reason: "No burn event found in transaction" };
    }

    try {
      // Decode the burn event from KooshBurner
      const burner = this.web3.eth.abi.decodeParameter("address", burnLog.topics[1]);
      // amount and timestamp are non-indexed, in data (only 2 values, not 3)
      const decoded = this.web3.eth.abi.decodeParameters(
        ["uint256", "uint256"],
        burnLog.data
      );
      const amount = decoded[0];

      return {
        verified: true,
        burner: burner.toLowerCase(),
        amountWei: amount.toString(),
        amountUSD: this.fromWei(amount),
        blockNumber: Number(receipt.blockNumber),
        txHash,
      };
    } catch (decodeErr) {
      console.error("Error decoding TokensBurned log:", decodeErr.message);
      // If decoding fails but we found the event, still mark as verified
      // Just extract what we can
      return {
        verified: true,
        burner: "unknown",
        amountWei: "0",
        amountUSD: "0",
        blockNumber: Number(receipt.blockNumber),
        txHash,
        note: "Event found but could not decode parameters",
      };
    }
  }

  /**
   * Get burn history for a user
   */
  async getBurnHistory(userId, options = {}) {
    const { limit = 20, skip = 0, status } = options;
    const query = { user: userId };
    if (status) query.status = status;

    const burns = await BurnRecord.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("payout");

    const total = await BurnRecord.countDocuments(query);

    return { burns, total };
  }

  /**
   * Retry a failed burn (for cases where approval succeeded but burn failed)
   */
  async retryBurn(burnRecordId, userId) {
    if (!this.initialized) throw new Error("TokenBurnService not initialized");

    // Find the failed burn record
    const burnRecord = await BurnRecord.findOne({
      _id: burnRecordId,
      user: userId,
      status: "failed",
    });

    if (!burnRecord) {
      throw new Error("Failed burn record not found or does not belong to user");
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const userAddress = user.web3Key?.publicAddress;
    if (!userAddress) throw new Error("User has no wallet");

    // Get user's private key
    const web3Key = await Web3Key.findOne({ user: userId });
    if (!web3Key || !web3Key.encryptedPrivateKey) {
      throw new Error("User wallet key not found");
    }

    const privateKey = cryptoUtils.decrypt(web3Key.encryptedPrivateKey);
    const userAccount = this.web3.eth.accounts.privateKeyToAccount(privateKey);

    const amountWei = burnRecord.amountWei;
    const amountUSD = burnRecord.amountUSD;

    // Check if user has enough tokens
    const balance = await this.tokenContract.methods.balanceOf(userAccount.address).call();
    if (BigInt(balance) < BigInt(amountWei)) {
      throw new Error(`Insufficient balance for retry. Have: ${this.fromWei(balance)} KSH, Need: ${amountUSD} KSH`);
    }

    // Check current allowance
    const allowance = await this.tokenContract.methods
      .allowance(userAccount.address, this.burnerAddress)
      .call();
    
    if (BigInt(allowance) < BigInt(amountWei)) {
      throw new Error(`Insufficient allowance. Need to re-approve or claim a fresh amount. Allowance: ${this.fromWei(allowance)} KSH`);
    }

    console.log(`Retrying burn for record ${burnRecordId}: ${amountUSD} KSH`);

    try {
      // Fund wallet for gas
      await this.fundUserWalletForGas(userAccount.address, 150000);

      // Get fresh gas price and nonce
      const burnGasPrice = await this.web3.eth.getGasPrice();
      const burnNonce = await this.web3.eth.getTransactionCount(userAccount.address, "latest");

      const burnTx = this.burnerContract.methods.burnTokens(amountWei);
      
      let burnGas;
      try {
        burnGas = await burnTx.estimateGas({ from: userAccount.address });
      } catch (estimateError) {
        throw new Error(`Burn would still fail: ${estimateError.message}`);
      }

      const burnTxData = {
        to: this.burnerAddress,
        data: burnTx.encodeABI(),
        gas: Math.ceil(Number(burnGas) * 1.5),
        gasPrice: burnGasPrice,
        nonce: burnNonce,
      };

      const signedBurnTx = await userAccount.signTransaction(burnTxData);
      const receipt = await this.web3.eth.sendSignedTransaction(signedBurnTx.rawTransaction);

      // Update burn record
      burnRecord.txHash = receipt.transactionHash;
      burnRecord.blockNumber = Number(receipt.blockNumber);
      burnRecord.status = "confirmed";
      burnRecord.verifiedAt = new Date();
      burnRecord.errorMessage = null;
      await burnRecord.save();

      console.log(`Retry burn successful. TxHash: ${receipt.transactionHash}`);

      return {
        success: true,
        burnRecord,
        txHash: receipt.transactionHash,
        blockNumber: Number(receipt.blockNumber),
        amountUSD,
      };
    } catch (error) {
      burnRecord.errorMessage = `Retry failed: ${error.message}`;
      await burnRecord.save();
      throw error;
    }
  }

  /**
   * Get admin/token contract address
   */
  getAdminAddress() {
    return this.adminAccount ? this.adminAccount.address : null;
  }

  getTokenAddress() {
    return this.tokenAddress || null;
  }

  getBurnerAddress() {
    return this.burnerAddress || null;
  }
}

// Export singleton instance
const tokenBurnService = new TokenBurnService();
module.exports = tokenBurnService;
