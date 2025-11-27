const mongoose = require("mongoose");

const payoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Reference to the burn record that triggered this payout
    burnRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BurnRecord",
      required: true,
    },
    // Reference to user's bank details
    bankDetail: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankDetail",
      required: true,
    },
    // Amount in USD (from burn)
    amountUSD: {
      type: Number,
      required: true,
      min: 10,
    },
    // Amount in INR (USD * exchange rate)
    amountINR: {
      type: Number,
      required: true,
    },
    // Exchange rate used (e.g., 84)
    exchangeRate: {
      type: Number,
      required: true,
      default: 84,
    },
    // Razorpay payout ID
    razorpayPayoutId: {
      type: String,
      default: null,
      index: true,
    },
    // Razorpay fund account ID (created for user's bank details)
    razorpayFundAccountId: {
      type: String,
      default: null,
    },
    // Status of the payout
    status: {
      type: String,
      enum: ["pending", "processing", "sent", "completed", "failed", "reversed", "pending_manual"],
      default: "pending",
      index: true,
    },
    // Razorpay payout status (from webhook/API)
    razorpayStatus: {
      type: String,
      default: null,
    },
    // UTR (Unique Transaction Reference) from bank
    utr: {
      type: String,
      default: null,
    },
    // Failure reason if any
    failureReason: {
      type: String,
      default: null,
    },
    // When the payout was initiated
    initiatedAt: {
      type: Date,
      default: null,
    },
    // When the payout was completed
    completedAt: {
      type: Date,
      default: null,
    },
    // Metadata for debugging
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Manual processing info (when Razorpay Payouts API not available)
    manualProcessing: {
      processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      processedAt: Date,
      utr: String,
      notes: String,
    },
    // Admin notes for tracking status changes
    adminNotes: [{
      note: String,
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      addedAt: Date,
      previousStatus: String,
      newStatus: String,
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes
payoutSchema.index({ user: 1, status: 1 });
payoutSchema.index({ createdAt: -1 });
payoutSchema.index({ razorpayPayoutId: 1 }, { sparse: true });

module.exports = mongoose.model("Payout", payoutSchema);
