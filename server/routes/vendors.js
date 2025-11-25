const express = require("express");
const router = express.Router();
const {
  getAllVendors,
  getVendorDetails,
  updateVendorStatus,
  updateVendorProfile,
  getVendorStats,
  getVendorOrders,
} = require("../controllers/vendorController");
const { auth, adminAuth, vendorAuth } = require("../middleware/auth");
const { validateObjectId } = require("../middleware/validation");

// Admin routes
router.get("/admin/all", auth, adminAuth, getAllVendors);
router.get(
  "/admin/:id",
  auth,
  adminAuth,
  validateObjectId("id"),
  getVendorDetails,
);
router.patch(
  "/admin/:id/status",
  auth,
  adminAuth,
  validateObjectId("id"),
  updateVendorStatus,
);

// Vendor routes
router.patch("/profile", auth, vendorAuth, updateVendorProfile);
router.get("/stats", auth, vendorAuth, getVendorStats);
router.get("/orders", auth, vendorAuth, getVendorOrders);

module.exports = router;
