const express = require("express");
const router = express.Router();
const {
  getBalance,
  getBankDetails,
  addBankDetail,
  deleteBankDetail,
  setDefaultBankDetail,
  claimFunds,
  getClaimHistory,
  getClaimDetails,
  getBurnHistory,
  retryBurn,
  verifyBurn,
  razorpayWebhook,
  getAdminPendingPayouts,
  adminRetryPayout,
} = require("../controllers/payoutController");
const { auth, adminAuth } = require("../middleware/auth");
const { body, param, query } = require("express-validator");
const { handleValidationErrors, validateObjectId } = require("../middleware/validation");

// ==================== USER ROUTES ====================

// Get user's token balance and wallet info
router.get("/balance", auth, getBalance);

// Get user's bank details
router.get("/bank-details", auth, getBankDetails);

// Add new bank detail
router.post(
  "/bank-details",
  auth,
  [
    body("accountHolderName")
      .trim()
      .notEmpty()
      .withMessage("Account holder name is required"),
    body("accountNumber")
      .trim()
      .notEmpty()
      .withMessage("Account number is required")
      .isNumeric()
      .withMessage("Account number must be numeric")
      .isLength({ min: 9, max: 18 })
      .withMessage("Account number must be between 9 and 18 digits"),
    body("ifscCode")
      .trim()
      .notEmpty()
      .withMessage("IFSC code is required")
      .matches(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/)
      .withMessage("Invalid IFSC code format"),
    body("bankName")
      .trim()
      .notEmpty()
      .withMessage("Bank name is required"),
    body("accountType")
      .optional()
      .isIn(["savings", "current"])
      .withMessage("Account type must be savings or current"),
  ],
  handleValidationErrors,
  addBankDetail
);

// Delete bank detail
router.delete(
  "/bank-details/:id",
  auth,
  validateObjectId("id"),
  deleteBankDetail
);

// Set default bank detail
router.patch(
  "/bank-details/:id/default",
  auth,
  validateObjectId("id"),
  setDefaultBankDetail
);

// Claim funds (burn tokens and request payout)
router.post(
  "/claim",
  auth,
  [
    body("amountUSD")
      .isFloat({ min: 10 })
      .withMessage("Minimum claim amount is 10 USD"),
    body("bankDetailId")
      .isMongoId()
      .withMessage("Valid bank detail ID is required"),
  ],
  handleValidationErrors,
  claimFunds
);

// Get claim/payout history
router.get("/claims", auth, getClaimHistory);

// Get single claim details
router.get("/claims/:id", auth, validateObjectId("id"), getClaimDetails);

// Get burn history
router.get("/burns", auth, getBurnHistory);

// Retry a failed burn
router.post(
  "/burns/:burnRecordId/retry",
  auth,
  validateObjectId("burnRecordId"),
  retryBurn
);

// Manually verify/check a burn status
router.post(
  "/burns/:burnRecordId/verify",
  auth,
  validateObjectId("burnRecordId"),
  verifyBurn
);

// ==================== WEBHOOK ROUTES ====================

// Razorpay webhook (no auth, signature verification in controller)
router.post("/webhook/razorpay", express.raw({ type: "application/json" }), razorpayWebhook);

// ==================== ADMIN ROUTES ====================

// Get all pending/failed payouts
router.get("/admin/pending", auth, adminAuth, getAdminPendingPayouts);

// Retry failed payout
router.post(
  "/admin/:id/retry",
  auth,
  adminAuth,
  validateObjectId("id"),
  adminRetryPayout
);

module.exports = router;
