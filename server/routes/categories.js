const express = require("express");
const router = express.Router();
const Category = require("../models/categoryModel");
const { auth, adminAuth, vendorAuth } = require("../middleware/auth");
const {
  validateCategory,
  validateObjectId,
} = require("../middleware/validation");

// Get all categories
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({
      sortOrder: 1,
      name: 1,
    });
    res.json(categories);
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single category
router.get("/:id", validateObjectId("id"), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  } catch (error) {
    console.error("Get category error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create category (Admin only)
router.post("/", auth, adminAuth, validateCategory, async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create category (Vendor)
router.post("/vendor", auth, vendorAuth, validateCategory, async (req, res) => {
  try {
    // Check if category with same name already exists
    const existingCategory = await Category.findOne({
      name: new RegExp(`^${req.body.name}$`, "i"),
    });

    if (existingCategory) {
      return res
        .status(400)
        .json({ message: "Category with this name already exists" });
    }

    const category = new Category({
      ...req.body,
      createdBy: req.user._id,
      createdByType: "vendor",
      isActive: true, // Vendors can create active categories
    });

    await category.save();
    res.status(201).json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update category (Admin only)
router.put(
  "/:id",
  auth,
  adminAuth,
  validateObjectId("id"),
  async (req, res) => {
    try {
      const category = await Category.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true },
      );
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json({
        message: "Category updated successfully",
        category,
      });
    } catch (error) {
      console.error("Update category error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Delete category (Admin only)
router.delete(
  "/:id",
  auth,
  adminAuth,
  validateObjectId("id"),
  async (req, res) => {
    try {
      const category = await Category.findByIdAndDelete(req.params.id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Delete category error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

module.exports = router;
