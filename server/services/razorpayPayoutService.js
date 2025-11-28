const Razorpay = require("razorpay");
const BankDetail = require("../models/bankDetailModel");
const Payout = require("../models/payoutModel");
const User = require("../models/userModel");

// USD to INR exchange rate (can be made dynamic later)
const USD_TO_INR_RATE = parseFloat(process.env.USD_TO_INR_RATE) || 89;

class RazorpayPayoutService {
  constructor() {
    this.razorpay = null;
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) return;

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const accountNumber = process.env.RAZORPAY_ACCOUNT_NUMBER;

    if (!keyId || !keySecret) {
      console.warn("RazorpayPayoutService: Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET. Service disabled.");
      return;
    }

    if (!accountNumber) {
      console.warn("RazorpayPayoutService: Missing RAZORPAY_ACCOUNT_NUMBER. Payouts will require manual processing.");
    }

    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // Check if payouts API is available (requires RazorpayX)
    this.payoutsAvailable = !!(this.razorpay.payouts || this.razorpay.payout);
    if (!this.payoutsAvailable) {
      console.warn("RazorpayPayoutService: Payouts API not available. You need RazorpayX (business banking) for automated payouts.");
      console.warn("Payouts will be marked for manual processing.");
    }

    this.initialized = true;
    console.log("RazorpayPayoutService initialized.", this.payoutsAvailable ? "Payouts API available." : "Manual payouts only.");
  }

  isInitialized() {
    return this.initialized;
  }

  /**
   * Convert USD to INR using configured exchange rate
   */
  convertUsdToInr(amountUSD) {
    return Math.round(amountUSD * USD_TO_INR_RATE * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get current exchange rate
   */
  getExchangeRate() {
    return USD_TO_INR_RATE;
  }

  /**
   * Create or get Razorpay contact for a user
   */
  async getOrCreateContact(userId) {
    if (!this.initialized) throw new Error("RazorpayPayoutService not initialized");

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    // Check if user already has a bank detail with contact ID
    const existingBankDetail = await BankDetail.findOne({
      user: userId,
      razorpayContactId: { $ne: null },
      isActive: true,
    });

    if (existingBankDetail && existingBankDetail.razorpayContactId) {
      return existingBankDetail.razorpayContactId;
    }

    // Create new contact in Razorpay
    const contact = await this.razorpay.contacts.create({
      name: user.name,
      email: user.email,
      contact: user.phone || undefined,
      type: "customer",
      reference_id: userId.toString(),
      notes: {
        userId: userId.toString(),
        platform: "B2B-Marketplace",
      },
    });

    return contact.id;
  }

  /**
   * Create fund account for a bank detail in Razorpay
   */
  async createFundAccount(bankDetailId, contactId) {
    if (!this.initialized) throw new Error("RazorpayPayoutService not initialized");

    const bankDetail = await BankDetail.findById(bankDetailId);
    if (!bankDetail) throw new Error("Bank detail not found");

    // Create fund account
    const fundAccount = await this.razorpay.fundAccount.create({
      contact_id: contactId,
      account_type: "bank_account",
      bank_account: {
        name: bankDetail.accountHolderName,
        ifsc: bankDetail.ifscCode,
        account_number: bankDetail.accountNumber,
      },
    });

    // Update bank detail with Razorpay IDs
    bankDetail.razorpayContactId = contactId;
    bankDetail.razorpayFundAccountId = fundAccount.id;
    await bankDetail.save();

    return fundAccount.id;
  }

  /**
   * Get or create fund account for a bank detail
   */
  async getOrCreateFundAccount(bankDetailId, userId) {
    const bankDetail = await BankDetail.findById(bankDetailId);
    if (!bankDetail) throw new Error("Bank detail not found");

    if (bankDetail.razorpayFundAccountId) {
      return bankDetail.razorpayFundAccountId;
    }

    // Get or create contact first
    const contactId = await this.getOrCreateContact(userId);

    // Create fund account
    return await this.createFundAccount(bankDetailId, contactId);
  }

  /**
   * Create a payout to user's bank account
   */
  async createPayout(payoutRecord) {
    if (!this.initialized) throw new Error("RazorpayPayoutService not initialized");
    
    // Check if Payouts API is available (requires RazorpayX)
    if (!this.payoutsAvailable) {
      throw new Error("Razorpay Payouts API not available. RazorpayX (business banking) required for automated payouts. Please process this payout manually.");
    }

    const bankDetail = await BankDetail.findById(payoutRecord.bankDetail);
    if (!bankDetail) throw new Error("Bank detail not found");

    // Ensure fund account exists
    const fundAccountId = await this.getOrCreateFundAccount(
      payoutRecord.bankDetail,
      payoutRecord.user
    );

    // Amount in paise (smallest INR unit)
    const amountInPaise = Math.round(payoutRecord.amountINR * 100);

    // Create payout via Razorpay
    const razorpayPayout = await this.razorpay.payouts.create({
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER, // Your Razorpay account number
      fund_account_id: fundAccountId,
      amount: amountInPaise,
      currency: "INR",
      mode: "IMPS", // Can be NEFT, RTGS, IMPS, UPI
      purpose: "payout",
      queue_if_low_balance: true,
      reference_id: payoutRecord._id.toString(),
      narration: `KooshCoin Payout - ${payoutRecord.amountUSD} USD`,
      notes: {
        payoutId: payoutRecord._id.toString(),
        burnRecordId: payoutRecord.burnRecord.toString(),
        userId: payoutRecord.user.toString(),
        amountUSD: payoutRecord.amountUSD.toString(),
      },
    });

    // Update payout record
    payoutRecord.razorpayPayoutId = razorpayPayout.id;
    payoutRecord.razorpayFundAccountId = fundAccountId;
    payoutRecord.razorpayStatus = razorpayPayout.status;
    payoutRecord.status = this.mapRazorpayStatus(razorpayPayout.status);
    payoutRecord.initiatedAt = new Date();
    payoutRecord.metadata = {
      ...payoutRecord.metadata,
      razorpayResponse: razorpayPayout,
    };
    await payoutRecord.save();

    return {
      success: true,
      razorpayPayoutId: razorpayPayout.id,
      status: razorpayPayout.status,
      utr: razorpayPayout.utr || null,
    };
  }

  /**
   * Map Razorpay payout status to our status
   */
  mapRazorpayStatus(razorpayStatus) {
    const statusMap = {
      created: "processing",
      queued: "processing",
      pending: "processing",
      processing: "processing",
      processed: "sent",
      reversed: "reversed",
      cancelled: "failed",
      rejected: "failed",
    };
    return statusMap[razorpayStatus] || "pending";
  }

  /**
   * Get payout status from Razorpay
   */
  async getPayoutStatus(razorpayPayoutId) {
    if (!this.initialized) throw new Error("RazorpayPayoutService not initialized");

    const payout = await this.razorpay.payouts.fetch(razorpayPayoutId);
    return {
      status: payout.status,
      utr: payout.utr || null,
      failureReason: payout.failure_reason || null,
    };
  }

  /**
   * Update payout record from webhook or polling
   */
  async updatePayoutFromWebhook(payoutId, webhookData) {
    const payout = await Payout.findOne({
      $or: [
        { _id: payoutId },
        { razorpayPayoutId: webhookData.payload?.payout?.entity?.id },
      ],
    });

    if (!payout) {
      console.warn("Payout not found for webhook:", payoutId, webhookData);
      return null;
    }

    const razorpayPayout = webhookData.payload?.payout?.entity;
    if (razorpayPayout) {
      payout.razorpayStatus = razorpayPayout.status;
      payout.status = this.mapRazorpayStatus(razorpayPayout.status);
      payout.utr = razorpayPayout.utr || payout.utr;
      payout.failureReason = razorpayPayout.failure_reason || payout.failureReason;

      if (razorpayPayout.status === "processed") {
        payout.status = "completed";
        payout.completedAt = new Date();
      }

      payout.metadata = {
        ...payout.metadata,
        lastWebhook: webhookData,
      };

      await payout.save();
    }

    return payout;
  }

  /**
   * Sync payout status with Razorpay (for polling)
   */
  async syncPayoutStatus(payoutId) {
    const payout = await Payout.findById(payoutId);
    if (!payout || !payout.razorpayPayoutId) {
      throw new Error("Payout not found or not yet submitted to Razorpay");
    }

    const status = await this.getPayoutStatus(payout.razorpayPayoutId);

    payout.razorpayStatus = status.status;
    payout.status = this.mapRazorpayStatus(status.status);
    payout.utr = status.utr || payout.utr;
    payout.failureReason = status.failureReason || payout.failureReason;

    if (status.status === "processed") {
      payout.status = "completed";
      payout.completedAt = new Date();
    }

    await payout.save();
    return payout;
  }
}

// Export singleton instance
const razorpayPayoutService = new RazorpayPayoutService();
module.exports = razorpayPayoutService;
