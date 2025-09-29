const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: false,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    maxlength: 200
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  comparePrice: {
    type: Number,
    min: 0
  },
  costPrice: {
    type: Number,
    min: 0
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  barcode: String,
  trackQuantity: {
    type: Boolean,
    default: true
  },
  quantity: {
    type: Number,
    default: 0,
    min: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 5
  },
  weight: {
    value: Number,
    unit: {
      type: String,
      enum: ['g', 'kg', 'lb', 'oz'],
      default: 'kg'
    }
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      enum: ['cm', 'in', 'm', 'ft'],
      default: 'cm'
    }
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  variants: [{
    name: String,
    options: [String],
    price: Number,
    quantity: Number,
    sku: String
  }],
  attributes: [{
    name: String,
    value: String
  }],
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  isDigital: {
    type: Boolean,
    default: false
  },
  digitalFiles: [{
    name: String,
    url: String,
    size: Number
  }],
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  stats: {
    views: {
      type: Number,
      default: 0
    },
    sales: {
      type: Number,
      default: 0
    },
    rating: {
      average: {
        type: Number,
        default: 0
      },
      count: {
        type: Number,
        default: 0
      }
    }
  }
}, {
  timestamps: true
});

// Create slug from name
productSchema.pre('save', function(next) {
  if (this.isModified('name') || this.isNew) {
    if (this.name) {
      this.slug = this.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    } else {
      this.slug = 'product-' + Date.now();
    }
  }
  next();
});

// Index for search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ vendor: 1, isActive: 1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });

module.exports = mongoose.model('Product', productSchema);

