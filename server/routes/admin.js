const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  getAllProducts,
  updateProductStatus,
  getAllOrders,
  getAllCategories,
  getAllVendors,
  updateVendorApproval,
} = require("../controllers/adminController");
const {
  getAdminPayouts,
  getAdminPendingPayouts,
  adminRetryPayout,
  markPayoutComplete,
  updatePayoutStatus,
} = require("../controllers/payoutController");
const { auth, adminAuth } = require("../middleware/auth");
const { validateObjectId } = require("../middleware/validation");

// All routes require admin authentication
router.use(auth, adminAuth);

// Dashboard
router.get("/dashboard", getDashboardStats);

// Users management
router.get("/users", getAllUsers);
router.patch("/users/:id/status", validateObjectId("id"), updateUserStatus);

// Vendors management
router.get("/vendors", getAllVendors);
router.patch("/vendors/:id/status", validateObjectId("id"), updateVendorApproval);

// Products management
router.get("/products", getAllProducts);
router.patch(
  "/products/:id/status",
  validateObjectId("id"),
  updateProductStatus,
);

// Orders management
router.get("/orders", getAllOrders);

// Categories management
router.get("/categories", getAllCategories);

// Payouts management
router.get("/payouts", getAdminPayouts);
router.get("/payouts/pending", getAdminPendingPayouts);
router.post("/payouts/:id/complete", validateObjectId("id"), markPayoutComplete);
router.patch("/payouts/:id/status", validateObjectId("id"), updatePayoutStatus);
router.post("/payouts/:id/retry", validateObjectId("id"), adminRetryPayout);

module.exports = router;
