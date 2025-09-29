const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getVendorProducts,
  updateProductStatus,
  getFeaturedProducts,
  getRelatedProducts
} = require('../controllers/productController');
const { auth, vendorAuth } = require('../middleware/auth');
const { validateProduct, validateObjectId } = require('../middleware/validation');

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:id', validateObjectId('id'), getProduct);
router.get('/:id/related', validateObjectId('id'), getRelatedProducts);

// Vendor routes
router.post('/', auth, vendorAuth, validateProduct, createProduct);
router.get('/vendor/my-products', auth, vendorAuth, getVendorProducts);
router.put('/:id', auth, vendorAuth, validateObjectId('id'), updateProduct);
router.delete('/:id', auth, vendorAuth, validateObjectId('id'), deleteProduct);
router.patch('/:id/status', auth, vendorAuth, validateObjectId('id'), updateProductStatus);

module.exports = router;

