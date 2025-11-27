const express = require("express");
const router = express.Router();
const {
  createEscrowForOrder,
  getEscrow,
  confirmDelivery,
  releaseFunds,
  raiseDispute,
  resolveDispute,
  getWalletInfo,
} = require("../controllers/escrowController");
const { auth, adminAuth } = require("../middleware/auth");
const { body, param } = require("express-validator");
const { handleValidationErrors, validateObjectId } = require("../middleware/validation");

// Get user's blockchain wallet info
router.get("/wallet", auth, getWalletInfo);

// Create escrow for an order
router.post(
  "/",
  auth,
  [body("orderId").isMongoId().withMessage("Valid order ID is required")],
  handleValidationErrors,
  createEscrowForOrder
);

// Get escrow details for an order
router.get("/:orderId", auth, validateObjectId("orderId"), getEscrow);

// Confirm delivery (buyer action)
router.post("/:orderId/confirm-delivery", auth, validateObjectId("orderId"), confirmDelivery);

// Release funds (seller action)
router.post("/:orderId/release", auth, validateObjectId("orderId"), releaseFunds);

// Raise dispute (buyer or seller)
router.post("/:orderId/dispute", auth, validateObjectId("orderId"), raiseDispute);

// Resolve dispute (admin only)
router.post(
  "/:orderId/resolve",
  auth,
  adminAuth,
  validateObjectId("orderId"),
  [body("winner").isIn(["buyer", "seller"]).withMessage("Winner must be 'buyer' or 'seller'")],
  handleValidationErrors,
  resolveDispute
);

module.exports = router;
