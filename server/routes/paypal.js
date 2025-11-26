const express = require("express");
const router = express.Router();
const {
  createPayPalOrder,
  capturePayPalOrder,
  getPayPalClientId,
} = require("../controllers/paypalController");
const { auth } = require("../middleware/auth");

// Get PayPal client ID (public route for frontend initialization)
router.get("/client-id", getPayPalClientId);

// Create PayPal order (requires authentication)
router.post("/create-order", auth, createPayPalOrder);

// Capture PayPal order after approval (requires authentication)
router.post("/capture-order/:orderID", auth, capturePayPalOrder);

module.exports = router;
