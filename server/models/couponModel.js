const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed_amount', 'free_shipping'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  minimumAmount: {
    type: Number,
    default: 0
  },
  maximumDiscount: {
    type: Number,
    default: null
  },
  usageLimit: {
    type: Number,
    default: null
  },
  usedCount: {
    type: Number,
    default: 0
  },
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  applicableVendors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  userRestrictions: {
    newUsersOnly: {
      type: Boolean,
      default: false
    },
    specificUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }
}, {
  timestamps: true
});

// Validate dates
couponSchema.pre('save', function(next) {
  if (this.validUntil <= this.validFrom) {
    return next(new Error('Valid until date must be after valid from date'));
  }
  next();
});

// Index for queries
couponSchema.index({ code: 1, isActive: 1 });
couponSchema.index({ validFrom: 1, validUntil: 1 });

module.exports = mongoose.model('Coupon', couponSchema);

