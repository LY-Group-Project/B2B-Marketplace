const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    images: [
      {
        url: String,
        alt: String,
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    helpful: {
      count: {
        type: Number,
        default: 0,
      },
      users: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },
    vendorResponse: {
      comment: String,
      respondedAt: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Ensure one review per customer per product
reviewSchema.index({ product: 1, customer: 1 }, { unique: true });

// Index for queries
reviewSchema.index({ product: 1, isApproved: 1, rating: -1 });
reviewSchema.index({ customer: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
