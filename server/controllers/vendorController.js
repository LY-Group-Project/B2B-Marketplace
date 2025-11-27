const User = require("../models/userModel");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");

// Get all vendors (Admin)
const getAllVendors = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    const query = { role: "vendor" };

    if (status) {
      query["vendorProfile.isApproved"] = status === "approved";
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { "vendorProfile.businessName": { $regex: search, $options: "i" } },
      ];
    }

    const vendors = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      vendors,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Get all vendors error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get vendor details (Admin)
const getVendorDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await User.findById(id).select("-password");
    if (!vendor || vendor.role !== "vendor") {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Get vendor stats
    const productCount = await Product.countDocuments({ vendor: id });
    const activeProductCount = await Product.countDocuments({
      vendor: id,
      isActive: true,
    });
    const totalOrders = await Order.countDocuments({
      "vendorOrders.vendor": id,
    });
    const totalSales = await Order.aggregate([
      { $match: { "vendorOrders.vendor": id } },
      { $unwind: "$vendorOrders" },
      { $match: { "vendorOrders.vendor": id } },
      { $group: { _id: null, total: { $sum: "$vendorOrders.vendorAmount" } } },
    ]);

    const stats = {
      productCount,
      activeProductCount,
      totalOrders,
      totalSales: totalSales[0]?.total || 0,
    };

    res.json({ vendor, stats });
  } catch (error) {
    console.error("Get vendor details error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Approve/Reject vendor (Admin)
const updateVendorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved, reason } = req.body;

    const vendor = await User.findById(id);
    if (!vendor || vendor.role !== "vendor") {
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.vendorProfile.isApproved = isApproved;
    if (isApproved) {
      vendor.vendorProfile.approvalDate = new Date();
    }

    await vendor.save();

    // TODO: Send email notification to vendor

    res.json({
      message: `Vendor ${isApproved ? "approved" : "rejected"} successfully`,
      vendor: {
        id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        isApproved: vendor.vendorProfile.isApproved,
      },
    });
  } catch (error) {
    console.error("Update vendor status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update vendor profile (Vendor)
const updateVendorProfile = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const updateData = req.body;

    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== "vendor") {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Update vendor profile fields
    if (updateData.businessName) {
      vendor.vendorProfile.businessName = updateData.businessName;
    }
    if (updateData.businessType) {
      vendor.vendorProfile.businessType = updateData.businessType;
    }
    if (updateData.businessDescription) {
      vendor.vendorProfile.businessDescription = updateData.businessDescription;
    }
    if (updateData.businessAddress) {
      vendor.vendorProfile.businessAddress = updateData.businessAddress;
    }
    if (updateData.taxId) {
      vendor.vendorProfile.taxId = updateData.taxId;
    }
    if (updateData.businessLicense) {
      vendor.vendorProfile.businessLicense = updateData.businessLicense;
    }
    if (updateData.bankAccount) {
      vendor.vendorProfile.bankAccount = updateData.bankAccount;
    }

    // Determine if vendor profile is complete
    const profile = vendor.vendorProfile;
    const isComplete = !!(
      profile.businessName &&
      profile.businessAddress &&
      profile.businessAddress.street &&
      profile.taxId &&
      profile.bankAccount &&
      profile.bankAccount.accountNumber
    );
    vendor.vendorProfile.isComplete = isComplete;

    await vendor.save();

    res.json({
      message: "Vendor profile updated successfully",
      vendor: {
        id: vendor._id,
        vendorProfile: vendor.vendorProfile,
      },
    });
  } catch (error) {
    console.error("Update vendor profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get vendor dashboard stats
const getVendorStats = async (req, res) => {
  try {
    const vendorId = req.user.id;

    // Get basic stats
    const productCount = await Product.countDocuments({ vendor: vendorId });
    const activeProductCount = await Product.countDocuments({
      vendor: vendorId,
      isActive: true,
    });

    // Get all orders containing vendor products
    const allOrders = await Order.find({ "items.vendor": vendorId });
    const totalOrders = allOrders.length;

    // Calculate total revenue from all orders
    let totalRevenue = 0;
    allOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.vendor && item.vendor.toString() === vendorId) {
          totalRevenue += item.price * item.quantity;
        }
      });
    });

    // Get stats for last 30 days for growth calculation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Current month stats
    const currentMonthOrders = await Order.find({
      "items.vendor": vendorId,
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Previous month stats
    const previousMonthOrders = await Order.find({
      "items.vendor": vendorId,
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    });

    // Calculate current month revenue
    let currentMonthRevenue = 0;
    currentMonthOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.vendor && item.vendor.toString() === vendorId) {
          currentMonthRevenue += item.price * item.quantity;
        }
      });
    });

    // Calculate previous month revenue
    let previousMonthRevenue = 0;
    previousMonthOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.vendor && item.vendor.toString() === vendorId) {
          previousMonthRevenue += item.price * item.quantity;
        }
      });
    });

    // Calculate growth percentages
    const orderGrowthCount = currentMonthOrders.length;
    const previousOrderCount = previousMonthOrders.length;
    const orderGrowth =
      previousOrderCount > 0
        ? ((orderGrowthCount - previousOrderCount) / previousOrderCount) * 100
        : orderGrowthCount > 0
          ? 100
          : 0;

    const revenueGrowth =
      previousMonthRevenue > 0
        ? ((currentMonthRevenue - previousMonthRevenue) /
            previousMonthRevenue) *
          100
        : currentMonthRevenue > 0
          ? 100
          : 0;

    // Get products created in last 30 days vs previous 30 days
    const currentMonthProducts = await Product.countDocuments({
      vendor: vendorId,
      createdAt: { $gte: thirtyDaysAgo },
    });

    const previousMonthProducts = await Product.countDocuments({
      vendor: vendorId,
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    });

    const productGrowth =
      previousMonthProducts > 0
        ? ((currentMonthProducts - previousMonthProducts) /
            previousMonthProducts) *
          100
        : currentMonthProducts > 0
          ? 100
          : 0;

    // Get monthly sales data for chart (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlySales = await Order.aggregate([
      {
        $match: {
          "items.vendor": vendorId,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      { $unwind: "$items" },
      { $match: { "items.vendor": vendorId } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          total: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Get top selling products
    const topProducts = await Product.aggregate([
      { $match: { vendor: vendorId } },
      { $sort: { sold: -1 } },
      { $limit: 5 },
      { $project: { name: 1, price: 1, sold: 1, images: 1, stock: 1 } },
    ]);

    // Get low stock products (less than 10 items)
    const lowStockProducts = await Product.find({
      vendor: vendorId,
      stock: { $lt: 10, $gt: 0 },
    })
      .select("name stock")
      .limit(5);

    // Get recent activity (last 10 orders)
    const recentActivity = await Order.find({ "items.vendor": vendorId })
      .populate("customer", "name email")
      .populate("items.product", "name images")
      .sort({ createdAt: -1 })
      .limit(10)
      .select("orderNumber status createdAt customer items total");

    res.json({
      data: {
        productCount,
        activeProductCount,
        totalOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        orderGrowth: Math.round(orderGrowth * 100) / 100,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        productGrowth: Math.round(productGrowth * 100) / 100,
        monthlySales,
        topProducts,
        lowStockProducts,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Get vendor stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get vendor orders
const getVendorOrders = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { page = 1, limit = 10, status, sort = "-createdAt" } = req.query;

    const query = { "items.vendor": vendorId };

    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate("customer", "name email phone")
      .populate("items.product", "name images price")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter and calculate vendor-specific amounts for each order
    const processedOrders = orders.map((order) => {
      const vendorItems = order.items.filter(
        (item) => item.vendor && item.vendor.toString() === vendorId,
      );

      const vendorAmount = vendorItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        user: order.customer, // keep `user` key for compatibility, populated from `customer`
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        vendorItems,
        vendorAmount,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
      };
    });

    const total = await Order.countDocuments(query);

    res.json({
      data: {
        orders: processedOrders,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
      },
    });
  } catch (error) {
    console.error("Get vendor orders error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllVendors,
  getVendorDetails,
  updateVendorStatus,
  updateVendorProfile,
  getVendorStats,
  getVendorOrders,
};
