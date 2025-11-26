const express = require("express");
const router = express.Router();
const {
  getRazorpayKeyId,
  createRazorpayOrder,
  verifyRazorpayPayment,
} = require("../controllers/razorpayController");
const { auth } = require("../middleware/auth");

// Get Razorpay Key ID (public route for frontend initialization)
router.get("/key-id", getRazorpayKeyId);

// Create Razorpay order (requires authentication)
router.post("/create-order", auth, createRazorpayOrder);

// Verify payment and create order (requires authentication)
router.post("/verify-payment", auth, verifyRazorpayPayment);

module.exports = router;
