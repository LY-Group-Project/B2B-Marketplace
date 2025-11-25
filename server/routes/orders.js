const express = require("express");
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getOrder,
  updateOrderStatus,
  getVendorOrders,
  cancelOrder,
  getAllOrders,
} = require("../controllers/orderController");
const { auth, vendorAuth, adminAuth } = require("../middleware/auth");
const { validateOrder, validateObjectId } = require("../middleware/validation");

// Customer routes
router.post("/", auth, validateOrder, createOrder);
router.get("/my-orders", auth, getUserOrders);
router.get("/:id", auth, validateObjectId("id"), getOrder);
router.patch("/:id/cancel", auth, validateObjectId("id"), cancelOrder);

// Vendor routes
router.get("/vendor/my-orders", auth, vendorAuth, getVendorOrders);
router.patch(
  "/:id/status",
  auth,
  vendorAuth,
  validateObjectId("id"),
  updateOrderStatus,
);

// Admin routes
router.get("/admin/all", auth, adminAuth, getAllOrders);

module.exports = router;
