const { body, param, query, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Validation errors:", errors.array());
    console.log("Request body:", req.body);
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

// User validation
const validateUserRegistration = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("role")
    .optional()
    .isIn(["customer", "vendor"])
    .withMessage("Role must be either customer or vendor"),
  handleValidationErrors,
];

const validateUserLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

// Product validation
const validateProduct = [
  body("name")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Product name must be between 3 and 100 characters"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
  body("category")
    .isMongoId()
    .withMessage("Please provide a valid category ID"),
  body("quantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Quantity must be a non-negative integer"),
  handleValidationErrors,
];

// Order validation
const validateOrder = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("Order must contain at least one item"),
  body("items.*.product")
    .isMongoId()
    .withMessage("Please provide valid product IDs"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),
  body("shippingAddress.name")
    .trim()
    .notEmpty()
    .withMessage("Shipping name is required"),
  body("shippingAddress.street")
    .trim()
    .notEmpty()
    .withMessage("Shipping street is required"),
  body("shippingAddress.city")
    .trim()
    .notEmpty()
    .withMessage("Shipping city is required"),
  body("shippingAddress.zipCode")
    .trim()
    .notEmpty()
    .withMessage("Shipping zip code is required"),
  body("paymentMethod")
    .isIn([
      "credit_card",
      "debit_card",
      "paypal",
      "stripe",
      "bank_transfer",
      "cash_on_delivery",
    ])
    .withMessage("Invalid payment method"),
  handleValidationErrors,
];

// Review validation
const validateReview = [
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("title")
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage("Title must be between 5 and 100 characters"),
  body("comment")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Comment must be between 10 and 1000 characters"),
  handleValidationErrors,
];

// Category validation
const validateCategory = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Category name must be between 2 and 50 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),
  handleValidationErrors,
];

// Coupon validation
const validateCoupon = [
  body("code")
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Coupon code must be between 3 and 20 characters"),
  body("name")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Coupon name must be between 3 and 100 characters"),
  body("type")
    .isIn(["percentage", "fixed_amount", "free_shipping"])
    .withMessage("Invalid coupon type"),
  body("value")
    .isFloat({ min: 0 })
    .withMessage("Coupon value must be a positive number"),
  body("validFrom")
    .isISO8601()
    .withMessage("Valid from date must be a valid date"),
  body("validUntil")
    .isISO8601()
    .withMessage("Valid until date must be a valid date"),
  handleValidationErrors,
];

// MongoDB ObjectId validation
const validateObjectId = (paramName) => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName} ID`),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateProduct,
  validateOrder,
  validateReview,
  validateCategory,
  validateCoupon,
  validateObjectId,
};
