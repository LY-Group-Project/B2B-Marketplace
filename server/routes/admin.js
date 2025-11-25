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
} = require("../controllers/adminController");
const { auth, adminAuth } = require("../middleware/auth");
const { validateObjectId } = require("../middleware/validation");

// All routes require admin authentication
router.use(auth, adminAuth);

// Dashboard
router.get("/dashboard", getDashboardStats);

// Users management
router.get("/users", getAllUsers);
router.patch("/users/:id/status", validateObjectId("id"), updateUserStatus);

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

module.exports = router;
