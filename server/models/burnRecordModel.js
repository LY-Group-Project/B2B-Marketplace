const mongoose = require("mongoose");

const burnRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Amount in USD (1 KSH = 1 USD)
    amountUSD: {
      type: Number,
      required: true,
      min: 10, // Minimum 10 USD
    },
    // Amount in token wei (18 decimals)
    amountWei: {
      type: String,
      required: true,
    },
    // User's blockchain address that performed the burn
    fromAddress: {
      type: String,
      required: true,
      lowercase: true,
    },
    // Transaction hash of the burn
    txHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Block number where burn was confirmed
    blockNumber: {
      type: Number,
      default: null,
    },
    // Status of the burn record
    status: {
      type: String,
      enum: ["pending", "submitted", "confirmed", "failed"],
      default: "pending",
      index: true,
    },
    // Error message if burn failed
    errorMessage: {
      type: String,
      default: null,
    },
    // When the burn was verified on-chain
    verifiedAt: {
      type: Date,
      default: null,
    },
    // Associated payout (if any)
    payout: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payout",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding burns by user and status
burnRecordSchema.index({ user: 1, status: 1 });
burnRecordSchema.index({ createdAt: -1 });

module.exports = mongoose.model("BurnRecord", burnRecordSchema);
