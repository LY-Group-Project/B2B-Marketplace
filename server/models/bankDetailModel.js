const mongoose = require("mongoose");

const bankDetailSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Account holder's name (as per bank records)
    accountHolderName: {
      type: String,
      required: true,
      trim: true,
    },
    // Bank account number (stored securely)
    accountNumber: {
      type: String,
      required: true,
    },
    // Last 4 digits of account number (for display)
    accountNumberLast4: {
      type: String,
      required: true,
    },
    // IFSC code (Indian Financial System Code)
    ifscCode: {
      type: String,
      required: true,
      uppercase: true,
      match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"],
    },
    // Bank name (derived from IFSC or user input)
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    // Account type
    accountType: {
      type: String,
      enum: ["savings", "current"],
      default: "savings",
    },
    // Whether this is the default/primary bank account
    isDefault: {
      type: Boolean,
      default: false,
    },
    // Verification status
    isVerified: {
      type: Boolean,
      default: false,
    },
    // Razorpay contact ID (for payouts)
    razorpayContactId: {
      type: String,
      default: null,
    },
    // Razorpay fund account ID
    razorpayFundAccountId: {
      type: String,
      default: null,
    },
    // Soft delete flag
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one default bank account per user
bankDetailSchema.pre("save", async function (next) {
  if (this.isDefault && this.isModified("isDefault")) {
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

// Index for finding user's bank details
bankDetailSchema.index({ user: 1, isActive: 1 });
bankDetailSchema.index({ user: 1, isDefault: 1 });

module.exports = mongoose.model("BankDetail", bankDetailSchema);
