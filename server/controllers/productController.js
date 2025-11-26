const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const User = require("../models/userModel");

// Get All Products with Filters
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      vendor,
      minPrice,
      maxPrice,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      isActive = true,
    } = req.query;

    const query = { isActive };

    // Apply filters
    if (category) query.category = category;
    if (vendor) query.vendor = vendor;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    if (search) {
      query.$text = { $search: search };
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const products = await Product.find(query)
      .populate("vendor", "name email vendorProfile.businessName")
      .populate("category", "name slug")
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Single Product
const getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate("vendor", "name email vendorProfile.businessName")
      .populate("category", "name slug")
      .populate("subcategory", "name slug");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Increment view count
    product.stats.views += 1;
    await product.save();

    res.json(product);
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create Product
const createProduct = async (req, res) => {
  try {
    console.log("Received product data:", req.body);
    const vendorId = req.user.id;
    const productData = { ...req.body, vendor: vendorId };
    console.log("Product data with vendor:", productData);

    const product = new Product(productData);
    await product.save();

    const populatedProduct = await Product.findById(product._id)
      .populate("vendor", "name email vendorProfile.businessName")
      .populate("category", "name slug");

    res.status(201).json({
      message: "Product created successfully",
      product: populatedProduct,
    });
  } catch (error) {
    console.error("Create product error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        message: "Validation error",
        errors,
        details: error.errors,
      });
    }

    res.status(500).json({ message: "Server error" });
  }
};

// Update Product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;

    const product = await Product.findOne({ _id: id, vendor: vendorId });
    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found or unauthorized" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("vendor", "name email vendorProfile.businessName")
      .populate("category", "name slug");

    res.json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete Product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;

    const product = await Product.findOne({ _id: id, vendor: vendorId });
    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found or unauthorized" });
    }

    await Product.findByIdAndDelete(id);

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Vendor Products
const getVendorProducts = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { vendor: vendorId };
    if (status !== undefined) {
      if (status !== "active" && status !== "inactive");
      else query.isActive = status === "active";
    }

    const products = await Product.find(query)
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Get vendor products error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update Product Status
const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const vendorId = req.user.id;

    const product = await Product.findOne({ _id: id, vendor: vendorId });
    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found or unauthorized" });
    }

    product.isActive = isActive;
    await product.save();

    res.json({
      message: "Product status updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update product status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Featured Products
const getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const products = await Product.find({ isActive: true })
      .populate("vendor", "name vendorProfile.businessName")
      .populate("category", "name slug")
      .sort({ "stats.sales": -1, "stats.rating.average": -1 })
      .limit(parseInt(limit));

    res.json(products);
  } catch (error) {
    console.error("Get featured products error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Related Products
const getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 4 } = req.query;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const relatedProducts = await Product.find({
      _id: { $ne: id },
      category: product.category,
      isActive: true,
    })
      .populate("vendor", "name vendorProfile.businessName")
      .populate("category", "name slug")
      .limit(parseInt(limit));

    res.json(relatedProducts);
  } catch (error) {
    console.error("Get related products error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getVendorProducts,
  updateProductStatus,
  getFeaturedProducts,
  getRelatedProducts,
};
