const tokenBurnService = require("../services/tokenBurnService");
const razorpayPayoutService = require("../services/razorpayPayoutService");
const burnVerificationService = require("../services/burnVerificationService");
const BurnRecord = require("../models/burnRecordModel");
const Payout = require("../models/payoutModel");
const BankDetail = require("../models/bankDetailModel");
const Web3Key = require("../models/web3KeyModel");

// Initialize services on startup
const initializeServices = async () => {
  try {
    await tokenBurnService.initialize();
    razorpayPayoutService.initialize();
  } catch (err) {
    console.warn("Payout services initialization warning:", err.message);
  }
};
initializeServices();

/**
 * Get user's KooshCoin balance and wallet info
 */
const getBalance = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!tokenBurnService.isInitialized()) {
      console.error("TokenBurnService not initialized. Check env vars: WEB3_RPC_URL, ADMIN_PRIVATE_KEY, KOOSH_COIN_ADDRESS, KOOSH_BURNER_ADDRESS");
      return res.status(503).json({ 
        message: "Token service is not available. Check server configuration.",
        debug: {
          initialized: false,
          hint: "Missing env vars: WEB3_RPC_URL, ADMIN_PRIVATE_KEY, KOOSH_COIN_ADDRESS, KOOSH_BURNER_ADDRESS"
        }
      });
    }

    const balance = await tokenBurnService.getBalanceByUserId(userId);
    
    console.log(`Balance for user ${userId}:`, balance);

    res.json({
      address: balance.address,
      balanceUSD: balance.balanceUSD,
      balanceWei: balance.balanceWei,
      tokenSymbol: "KSH",
      exchangeRate: razorpayPayoutService.getExchangeRate(),
      minClaimAmount: 10,
    });
  } catch (error) {
    console.error("Get balance error:", error);
    res.status(500).json({ message: error.message || "Failed to get balance" });
  }
};

/**
 * Get user's bank details
 */
const getBankDetails = async (req, res) => {
  try {
    const userId = req.user.id;

    const bankDetails = await BankDetail.find({ user: userId, isActive: true })
      .select("-accountNumber") // Don't send full account number
      .sort({ isDefault: -1, createdAt: -1 });

    res.json({ bankDetails });
  } catch (error) {
    console.error("Get bank details error:", error);
    res.status(500).json({ message: "Failed to get bank details" });
  }
};

/**
 * Add new bank detail
 */
const addBankDetail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountHolderName, accountNumber, ifscCode, bankName, accountType, isDefault } = req.body;

    // Validate required fields
    if (!accountHolderName || !accountNumber || !ifscCode || !bankName) {
      return res.status(400).json({ message: "All bank details are required" });
    }

    // Check if this account already exists
    const existingAccount = await BankDetail.findOne({
      user: userId,
      accountNumber,
      ifscCode,
      isActive: true,
    });

    if (existingAccount) {
      return res.status(400).json({ message: "This bank account is already added" });
    }

    // Create new bank detail
    const bankDetail = new BankDetail({
      user: userId,
      accountHolderName,
      accountNumber,
      accountNumberLast4: accountNumber.slice(-4),
      ifscCode: ifscCode.toUpperCase(),
      bankName,
      accountType: accountType || "savings",
      isDefault: isDefault || false,
    });

    await bankDetail.save();

    // Return without full account number
    const response = bankDetail.toObject();
    delete response.accountNumber;

    res.status(201).json({
      message: "Bank details added successfully",
      bankDetail: response,
    });
  } catch (error) {
    console.error("Add bank detail error:", error);
    res.status(500).json({ message: error.message || "Failed to add bank details" });
  }
};

/**
 * Delete bank detail
 */
const deleteBankDetail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const bankDetail = await BankDetail.findOne({ _id: id, user: userId });
    if (!bankDetail) {
      return res.status(404).json({ message: "Bank detail not found" });
    }

    // Soft delete
    bankDetail.isActive = false;
    await bankDetail.save();

    res.json({ message: "Bank detail removed successfully" });
  } catch (error) {
    console.error("Delete bank detail error:", error);
    res.status(500).json({ message: "Failed to delete bank detail" });
  }
};

/**
 * Set default bank detail
 */
const setDefaultBankDetail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const bankDetail = await BankDetail.findOne({ _id: id, user: userId, isActive: true });
    if (!bankDetail) {
      return res.status(404).json({ message: "Bank detail not found" });
    }

    // Update all others to non-default
    await BankDetail.updateMany(
      { user: userId, _id: { $ne: id } },
      { isDefault: false }
    );

    // Set this one as default
    bankDetail.isDefault = true;
    await bankDetail.save();

    res.json({ message: "Default bank account updated" });
  } catch (error) {
    console.error("Set default bank detail error:", error);
    res.status(500).json({ message: "Failed to update default bank" });
  }
};

/**
 * Claim funds - burn tokens and request INR payout
 */
const claimFunds = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amountUSD, bankDetailId } = req.body;

    // Validate services
    if (!tokenBurnService.isInitialized()) {
      return res.status(503).json({ message: "Token burn service is not available" });
    }

    if (!razorpayPayoutService.isInitialized()) {
      return res.status(503).json({ message: "Payout service is not available" });
    }

    // Validate amount
    if (!amountUSD || amountUSD < 10) {
      return res.status(400).json({ message: "Minimum claim amount is 10 USD" });
    }

    // Validate bank detail
    const bankDetail = await BankDetail.findOne({
      _id: bankDetailId,
      user: userId,
      isActive: true,
    });

    if (!bankDetail) {
      return res.status(400).json({ message: "Please add bank details first" });
    }

    // Check balance
    const balance = await tokenBurnService.getBalanceByUserId(userId);
    if (balance.balanceUSD < amountUSD) {
      return res.status(400).json({
        message: `Insufficient balance. You have ${balance.balanceUSD} KSH`,
      });
    }

    // Step 1: Burn tokens on-chain
    const burnResult = await tokenBurnService.burnTokens(userId, amountUSD);

    // Step 2: Calculate INR amount
    const exchangeRate = razorpayPayoutService.getExchangeRate();
    const amountINR = razorpayPayoutService.convertUsdToInr(amountUSD);

    // Step 3: Create payout record
    const payout = new Payout({
      user: userId,
      burnRecord: burnResult.burnRecord._id,
      bankDetail: bankDetail._id,
      amountUSD,
      amountINR,
      exchangeRate,
      status: "pending",
    });
    await payout.save();

    // Update burn record with payout reference
    burnResult.burnRecord.payout = payout._id;
    await burnResult.burnRecord.save();

    // Step 4: Initiate Razorpay payout
    try {
      const payoutResult = await razorpayPayoutService.createPayout(payout);

      res.status(201).json({
        message: "Claim submitted successfully",
        claim: {
          burnTxHash: burnResult.txHash,
          amountUSD,
          amountINR,
          exchangeRate,
          payoutId: payout._id,
          razorpayPayoutId: payoutResult.razorpayPayoutId,
          status: payout.status,
        },
      });
    } catch (payoutError) {
      // Burn succeeded but payout failed - mark for manual review
      payout.status = "failed";
      payout.failureReason = payoutError.message;
      await payout.save();

      res.status(201).json({
        message: "Tokens burned successfully. Payout will be processed manually.",
        claim: {
          burnTxHash: burnResult.txHash,
          amountUSD,
          amountINR,
          exchangeRate,
          payoutId: payout._id,
          status: "pending_manual",
          note: "Automatic payout failed. Our team will process this manually within 24 hours.",
        },
      });
    }
  } catch (error) {
    console.error("Claim funds error:", error);
    res.status(500).json({ message: error.message || "Failed to process claim" });
  }
};

/**
 * Get user's claim/payout history
 */
const getClaimHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payouts = await Payout.find({ user: userId })
      .populate("burnRecord", "_id txHash amountUSD amountWei status createdAt")
      .populate("bankDetail", "bankName accountNumberLast4 ifscCode")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payout.countDocuments({ user: userId });

    res.json({
      claims: payouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get claim history error:", error);
    res.status(500).json({ message: "Failed to get claim history" });
  }
};

/**
 * Get single claim/payout details
 */
const getClaimDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const payout = await Payout.findOne({ _id: id, user: userId })
      .populate("burnRecord")
      .populate("bankDetail", "bankName accountNumberLast4 ifscCode accountHolderName");

    if (!payout) {
      return res.status(404).json({ message: "Claim not found" });
    }

    // Try to sync status with Razorpay if pending
    if (payout.razorpayPayoutId && ["processing", "sent"].includes(payout.status)) {
      try {
        await razorpayPayoutService.syncPayoutStatus(payout._id);
        await payout.reload();
      } catch (syncError) {
        console.warn("Failed to sync payout status:", syncError.message);
      }
    }

    res.json({ claim: payout });
  } catch (error) {
    console.error("Get claim details error:", error);
    res.status(500).json({ message: "Failed to get claim details" });
  }
};

/**
 * Get burn history (without payouts)
 */
const getBurnHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const result = await tokenBurnService.getBurnHistory(userId, {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    });

    res.json({
      burns: result.burns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total,
        pages: Math.ceil(result.total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get burn history error:", error);
    res.status(500).json({ message: "Failed to get burn history" });
  }
};

/**
 * Retry a failed burn
 */
const retryBurn = async (req, res) => {
  try {
    const userId = req.user.id;
    const { burnRecordId } = req.params;

    if (!tokenBurnService.isInitialized()) {
      return res.status(503).json({ message: "Token burn service is not available" });
    }

    const result = await tokenBurnService.retryBurn(burnRecordId, userId);

    res.json({
      message: "Burn retried successfully",
      txHash: result.txHash,
      blockNumber: result.blockNumber,
      amountUSD: result.amountUSD,
    });
  } catch (error) {
    console.error("Retry burn error:", error);
    res.status(500).json({ message: error.message || "Failed to retry burn" });
  }
};

/**
 * Manually verify/check a burn transaction status
 */
const verifyBurn = async (req, res) => {
  try {
    const userId = req.user.id;
    const { burnRecordId } = req.params;

    // Find the burn record
    const burnRecord = await BurnRecord.findOne({
      _id: burnRecordId,
      user: userId,
    });

    if (!burnRecord) {
      return res.status(404).json({ message: "Burn record not found" });
    }

    // If already confirmed, check if payout needs processing
    if (burnRecord.status === "confirmed") {
      // Try to re-process any failed payout
      await burnVerificationService.processPendingPayout(burnRecord);
      
      // Get updated payout status
      const payout = await Payout.findOne({ burnRecord: burnRecordId });
      
      return res.json({
        message: "Burn already confirmed",
        burn: burnRecord,
        payout: payout ? { status: payout.status, failureReason: payout.failureReason } : null,
      });
    }

    // For failed, submitted, or pending - try to verify on-chain
    // (failed burns might have actually succeeded, we just had a decoding error)
    if (!burnRecord.txHash || burnRecord.txHash === "pending") {
      return res.json({
        message: "No transaction hash to verify",
        burn: burnRecord,
      });
    }

    // Trigger verification
    await burnVerificationService.verifyBurn(burnRecord);

    // Reload the record to get updated status
    const updatedBurn = await BurnRecord.findById(burnRecordId);
    
    // Get payout status too
    const payout = await Payout.findOne({ burnRecord: burnRecordId });

    res.json({
      message: `Burn status: ${updatedBurn.status}`,
      burn: updatedBurn,
      payout: payout ? { status: payout.status, failureReason: payout.failureReason } : null,
    });
  } catch (error) {
    console.error("Verify burn error:", error);
    res.status(500).json({ message: error.message || "Failed to verify burn" });
  }
};

/**
 * Webhook handler for Razorpay payout events
 */
const razorpayWebhook = async (req, res) => {
  try {
    const webhookSignature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify webhook signature if secret is configured
    if (webhookSecret && webhookSignature) {
      const crypto = require("crypto");
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (expectedSignature !== webhookSignature) {
        return res.status(400).json({ message: "Invalid webhook signature" });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log("Razorpay webhook received:", event);

    if (event?.startsWith("payout.")) {
      const payoutId = payload?.payout?.entity?.reference_id;
      await razorpayPayoutService.updatePayoutFromWebhook(payoutId, req.body);
    }

    res.json({ status: "ok" });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    res.status(500).json({ message: "Webhook processing failed" });
  }
};

/**
 * Admin: Get all payouts with filtering
 */
const getAdminPayouts = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, userId, from, to } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (userId) {
      query.user = userId;
    }
    
    // Date range filter
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const payouts = await Payout.find(query)
      .populate("user", "name email")
      .populate("burnRecord", "txHash amountUSD status confirmedAt")
      .populate("bankDetail", "bankName accountNumberLast4 ifscCode accountHolderName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payout.countDocuments(query);

    // Get summary stats
    const stats = await Payout.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmountINR: { $sum: "$amountINR" },
          totalAmountUSD: { $sum: "$amountUSD" },
        },
      },
    ]);

    res.json({
      payouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
      stats: stats.reduce((acc, s) => {
        acc[s._id] = { count: s.count, totalAmountINR: s.totalAmountINR, totalAmountUSD: s.totalAmountUSD };
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error("Admin get payouts error:", error);
    res.status(500).json({ message: "Failed to get payouts" });
  }
};

/**
 * Admin: Get all pending payouts (legacy endpoint)
 */
const getAdminPendingPayouts = async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = status ? { status } : { status: { $in: ["pending", "processing", "failed", "pending_manual"] } };

    const payouts = await Payout.find(query)
      .populate("user", "name email")
      .populate("burnRecord", "txHash amountUSD status")
      .populate("bankDetail", "bankName accountNumberLast4 ifscCode accountHolderName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payout.countDocuments(query);

    res.json({
      payouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Admin get pending payouts error:", error);
    res.status(500).json({ message: "Failed to get pending payouts" });
  }
};

/**
 * Admin: Retry failed payout
 */
const adminRetryPayout = async (req, res) => {
  try {
    const { id } = req.params;

    const payout = await Payout.findById(id);
    if (!payout) {
      return res.status(404).json({ message: "Payout not found" });
    }

    if (payout.status !== "failed") {
      return res.status(400).json({ message: "Only failed payouts can be retried" });
    }

    // Reset status and retry
    payout.status = "pending";
    payout.failureReason = null;
    payout.razorpayPayoutId = null;
    await payout.save();

    const result = await razorpayPayoutService.createPayout(payout);

    res.json({
      message: "Payout retry initiated",
      razorpayPayoutId: result.razorpayPayoutId,
      status: payout.status,
    });
  } catch (error) {
    console.error("Admin retry payout error:", error);
    res.status(500).json({ message: error.message || "Failed to retry payout" });
  }
};

/**
 * Admin: Mark payout as complete (manual processing)
 */
const markPayoutComplete = async (req, res) => {
  try {
    const { id } = req.params;
    const { utr, notes } = req.body;

    const payout = await Payout.findById(id)
      .populate("user", "name email")
      .populate("bankDetail", "bankName accountNumberLast4 ifscCode accountHolderName");

    if (!payout) {
      return res.status(404).json({ message: "Payout not found" });
    }

    if (payout.status === "completed") {
      return res.status(400).json({ message: "Payout is already completed" });
    }

    if (!["pending_manual", "pending", "processing", "failed"].includes(payout.status)) {
      return res.status(400).json({ message: `Cannot complete payout with status: ${payout.status}` });
    }

    // Update payout as completed
    payout.status = "completed";
    payout.completedAt = new Date();
    payout.manualProcessing = {
      processedBy: req.user.id,
      processedAt: new Date(),
      utr: utr || null,
      notes: notes || null,
    };
    
    await payout.save();

    res.json({
      message: "Payout marked as completed",
      payout: {
        _id: payout._id,
        amountUSD: payout.amountUSD,
        amountINR: payout.amountINR,
        status: payout.status,
        completedAt: payout.completedAt,
        utr: utr,
        user: payout.user,
        bankDetail: payout.bankDetail,
      },
    });
  } catch (error) {
    console.error("Admin mark payout complete error:", error);
    res.status(500).json({ message: error.message || "Failed to mark payout as complete" });
  }
};

/**
 * Admin: Update payout status
 */
const updatePayoutStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, failureReason } = req.body;

    const validStatuses = ["pending", "processing", "completed", "failed", "pending_manual", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    const payout = await Payout.findById(id)
      .populate("user", "name email")
      .populate("bankDetail", "bankName accountNumberLast4 ifscCode accountHolderName");

    if (!payout) {
      return res.status(404).json({ message: "Payout not found" });
    }

    const previousStatus = payout.status;
    payout.status = status;

    if (status === "completed") {
      payout.completedAt = new Date();
    }

    if (status === "failed" && failureReason) {
      payout.failureReason = failureReason;
    }

    if (notes) {
      payout.adminNotes = payout.adminNotes || [];
      payout.adminNotes.push({
        note: notes,
        addedBy: req.user.id,
        addedAt: new Date(),
        previousStatus,
        newStatus: status,
      });
    }

    await payout.save();

    res.json({
      message: `Payout status updated to ${status}`,
      payout: {
        _id: payout._id,
        status: payout.status,
        previousStatus,
        amountUSD: payout.amountUSD,
        amountINR: payout.amountINR,
        user: payout.user,
      },
    });
  } catch (error) {
    console.error("Admin update payout status error:", error);
    res.status(500).json({ message: error.message || "Failed to update payout status" });
  }
};

module.exports = {
  getBalance,
  getBankDetails,
  addBankDetail,
  deleteBankDetail,
  setDefaultBankDetail,
  claimFunds,
  getClaimHistory,
  getClaimDetails,
  getBurnHistory,
  retryBurn,
  verifyBurn,
  razorpayWebhook,
  getAdminPayouts,
  getAdminPendingPayouts,
  adminRetryPayout,
  markPayoutComplete,
  updatePayoutStatus,
};
