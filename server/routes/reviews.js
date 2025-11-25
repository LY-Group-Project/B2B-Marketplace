const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Review = require("../models/reviewModel");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const { auth } = require("../middleware/auth");

// Get all reviews for a product
router.get("/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, rating } = req.query;

    // Build query
    const query = {
      product: productId,
      isApproved: true, // Only show approved reviews
    };

    if (rating) {
      query.rating = rating;
    }

    const reviews = await Review.find(query)
      .populate("customer", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(query);

    // Calculate rating statistics
    const ratingStats = await Review.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(productId),
          isApproved: true,
        },
      },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
    ]);

    const averageRating = await Review.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(productId),
          isApproved: true,
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    res.json({
      reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalReviews: total,
      },
      ratingStats,
      averageRating: averageRating[0] || { averageRating: 0, totalReviews: 0 },
    });
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    res.status(500).json({ message: "Error fetching reviews" });
  }
});

// Get user's review for a product
router.get("/user/:productId", auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const review = await Review.findOne({
      product: productId,
      customer: userId,
    });

    res.json({ review });
  } catch (error) {
    console.error("Error fetching user review:", error);
    res.status(500).json({ message: "Error fetching user review" });
  }
});

// Create a new review
router.post("/", auth, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id;

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      customer: userId,
    });

    if (existingReview) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this product" });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Create review
    const review = new Review({
      product: productId,
      customer: userId,
      rating,
      comment,
      isApproved: true, // Auto-approve for now, can add moderation later
    });

    await review.save();

    // Populate the review
    await review.populate("customer", "name email");

    res.status(201).json({
      message: "Review created successfully",
      review,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ message: "Error creating review" });
  }
});

// Update a review
router.put("/:reviewId", auth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    const review = await Review.findOne({
      _id: reviewId,
      customer: userId,
    });

    if (!review) {
      return res
        .status(404)
        .json({ message: "Review not found or unauthorized" });
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    review.updatedAt = new Date();

    await review.save();
    await review.populate("customer", "name email");

    res.json({
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ message: "Error updating review" });
  }
});

// Delete a review
router.delete("/:reviewId", auth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findOne({
      _id: reviewId,
      customer: userId,
    });

    if (!review) {
      return res
        .status(404)
        .json({ message: "Review not found or unauthorized" });
    }

    await review.deleteOne();

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Error deleting review" });
  }
});

module.exports = router;
