const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  senderRole: {
    type: String,
    enum: ["buyer", "seller", "admin"],
    required: true,
  },
  content: {
    type: String,
    required: function() {
      return !this.images || this.images.length === 0;
    },
  },
  images: [{
    filename: String,
    originalName: String,
    path: String,
    mimeType: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  }],
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    readAt: Date,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const disputeSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    raisedByRole: {
      type: String,
      enum: ["buyer", "seller"],
      required: true,
    },
    reason: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["open", "under_review", "resolved", "closed"],
      default: "open",
    },
    resolution: {
      winner: {
        type: String,
        enum: ["buyer", "seller"],
      },
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      resolvedAt: Date,
      notes: String,
    },
    messages: [messageSchema],
    assignedAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Update lastActivityAt on new messages
disputeSchema.pre("save", function(next) {
  if (this.isModified("messages")) {
    this.lastActivityAt = new Date();
  }
  next();
});

// Indexes
disputeSchema.index({ order: 1 });
disputeSchema.index({ buyer: 1 });
disputeSchema.index({ seller: 1 });
disputeSchema.index({ status: 1 });
disputeSchema.index({ assignedAdmin: 1 });
disputeSchema.index({ lastActivityAt: -1 });

module.exports = mongoose.model("Dispute", disputeSchema);
