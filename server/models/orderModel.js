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
    shippingMethod: {
      name: String,
      cost: Number,
      estimatedDays: Number,
    },
    tracking: {
      carrier: String,
      trackingNumber: String,
      trackingUrl: String,
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
        },
      },
    ],
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
