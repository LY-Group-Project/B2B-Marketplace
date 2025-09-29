const User = require('../models/userModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const Category = require('../models/categoryModel');

// Get dashboard stats (Admin)
const getDashboardStats = async (req, res) => {
  try {
    // Get user counts
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalVendors = await User.countDocuments({ role: 'vendor' });
    const approvedVendors = await User.countDocuments({ 
      role: 'vendor', 
      'vendorProfile.isApproved': true 
    });
    const pendingVendors = await User.countDocuments({ 
      role: 'vendor', 
      'vendorProfile.isApproved': false 
    });

    // Get product counts
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const totalCategories = await Category.countDocuments();

    // Get order counts
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const completedOrders = await Order.countDocuments({ status: 'delivered' });

    // Get revenue data
    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    // Get monthly revenue for chart
    const monthlyRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // Get recent orders
    const recentOrders = await Order.find()
      .populate('customer', 'name email')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get top vendors by sales
    const topVendors = await Order.aggregate([
      { $unwind: '$vendorOrders' },
      {
        $group: {
          _id: '$vendorOrders.vendor',
          totalSales: { $sum: '$vendorOrders.vendorAmount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalSales: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'vendor'
        }
      },
      { $unwind: '$vendor' },
      {
        $project: {
          vendorName: '$vendor.name',
          businessName: '$vendor.vendorProfile.businessName',
          totalSales: 1,
          orderCount: 1
        }
      }
    ]);

    res.json({
      stats: {
        users: {
          total: totalUsers,
          customers: totalCustomers,
          vendors: totalVendors,
          approvedVendors,
          pendingVendors
        },
        products: {
          total: totalProducts,
          active: activeProducts,
          categories: totalCategories
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          completed: completedOrders
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          monthly: monthlyRevenue
        }
      },
      recentOrders,
      topVendors
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all users (Admin)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search, isActive } = req.query;
    
    const query = {};
    
    if (role) {
      query.role = role;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'vendorProfile.businessName': { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user status (Admin)
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      message: 'User status updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all products (Admin)
const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, vendor } = req.query;
    
    const query = {};
    
    if (status !== undefined) {
      query.isActive = status === 'active';
    }
    
    if (vendor) {
      query.vendor = vendor;
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    const products = await Product.find(query)
      .populate('vendor', 'name email vendorProfile.businessName')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update product status (Admin)
const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.isActive = isActive;
    await product.save();

    res.json({
      message: 'Product status updated successfully',
      product: {
        id: product._id,
        name: product.name,
        isActive: product.isActive
      }
    });
  } catch (error) {
    console.error('Update product status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all orders (Admin)
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, paymentStatus, vendor } = req.query;
    
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }
    
    if (vendor) {
      query['vendorOrders.vendor'] = vendor;
    }

    const orders = await Order.find(query)
      .populate('customer', 'name email')
      .populate('items.product', 'name images')
      .populate('items.vendor', 'name vendorProfile.businessName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all categories (Admin)
const getAllCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const categories = await Category.find(query)
      .populate('parent', 'name')
      .sort({ sortOrder: 1, name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Category.countDocuments(query);

    res.json({
      categories,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get all categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  getAllProducts,
  updateProductStatus,
  getAllOrders,
  getAllCategories
};
