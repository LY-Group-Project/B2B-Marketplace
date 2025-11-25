const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    user: {
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
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        variant: {
          name: String,
          option: String,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    total: {
      type: Number,
      default: 0,
    },
    itemCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Calculate totals before saving
cartSchema.pre("save", function (next) {
  this.itemCount = this.items.length;
  this.total = this.items.reduce((sum, item) => {
    return sum + item.product.price * item.quantity;
  }, 0);
  next();
});

// Ensure one cart per user
cartSchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.model("Cart", cartSchema);
