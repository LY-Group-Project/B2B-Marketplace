const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        vendor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
        variant: {
          name: String,
          option: String,
        },
      },
    ],
    shippingAddress: {
      name: String,
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      phone: String,
    },
    billingAddress: {
      name: String,
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      phone: String,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      default: 0,
    },
    shipping: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: [
        "credit_card",
        "debit_card",
        "paypal",
        "stripe",
        "razorpay",
        "bank_transfer",
        "cash_on_delivery",
      ],
      required: true,
    },
    paymentDetails: {
      transactionId: String,
      paymentIntentId: String,
      paidAt: Date,
    },
    // PayPal-specific fields
    paypalOrderId: {
      type: String,
    },
    paypalCaptureId: {
      type: String,
    },
    // Razorpay-specific fields
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    shippingMethod: {
      name: String,
      cost: Number,
      estimatedDays: Number,
    },
    tracking: {
      carrier: String,
      trackingNumber: String,
      trackingUrl: String,
      validatedAt: Date,
      trackingHistory: [
        {
          timestamp: Date,
          location: String,
          status: String,
          description: String,
          rawData: mongoose.Schema.Types.Mixed,
        },
      ],
      lastUpdated: Date,
      courierCode: String, // For API lookup (e.g., 'fedex', 'ups', 'usps', 'dhl')
    },
    notes: String,
    vendorOrders: [
      {
        vendor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        items: [
          {
            product: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Product",
            },
            quantity: Number,
            price: Number,
          },
        ],
        subtotal: Number,
        commission: Number,
        vendorAmount: Number,
        status: {
          type: String,
          enum: [
            "pending",
            "confirmed",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
          ],
          default: "pending",
        },
        tracking: {
          carrier: String,
          trackingNumber: String,
          trackingUrl: String,
          validatedAt: Date,
          trackingHistory: [
            {
              timestamp: Date,
              location: String,
              status: String,
              description: String,
              rawData: mongoose.Schema.Types.Mixed,
            },
          ],
          lastUpdated: Date,
          courierCode: String,
        },
      },
    ],
    // Web3 Escrow fields
    escrow: {
      address: String,
      status: {
        type: String,
        enum: ["Locked", "ReleasePending", "Disputed", "Complete", "Refunded"],
      },
      buyerAddress: String,
      sellerAddress: String,
      amount: String,
      transactions: [
        {
          type: { type: String },
          txHash: String,
          blockNumber: Number,
          timestamp: Date,
          by: mongoose.Schema.Types.ObjectId,
          winner: String,
        },
      ],
      createdAt: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Generate order number
orderSchema.pre("save", function (next) {
  if (this.isNew && !this.orderNumber) {
    this.orderNumber =
      "ORD-" +
      Date.now() +
      "-" +
      Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  next();
});

// Index for queries
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ "vendorOrders.vendor": 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1, paymentStatus: 1 });

module.exports = mongoose.model("Order", orderSchema);
