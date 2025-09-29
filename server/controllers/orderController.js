const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const User = require('../models/userModel');

// Create Order
const createOrder = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { items, shippingAddress, billingAddress, paymentMethod, couponCode } = req.body;

    // Validate products and calculate totals
    let subtotal = 0;
    const orderItems = [];
    const vendorOrders = new Map();

    for (const item of items) {
      const product = await Product.findById(item.product).populate('vendor');
      if (!product || !product.isActive) {
        return res.status(400).json({ message: `Product ${item.product} not found or inactive` });
      }

      if (product.trackQuantity && product.quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient quantity for product ${product.name}` 
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        vendor: product.vendor._id,
        quantity: item.quantity,
        price: product.price,
        variant: item.variant
      });

      // Group by vendor for vendor orders
      if (!vendorOrders.has(product.vendor._id.toString())) {
        vendorOrders.set(product.vendor._id.toString(), {
          vendor: product.vendor._id,
          items: [],
          subtotal: 0
        });
      }

      const vendorOrder = vendorOrders.get(product.vendor._id.toString());
      vendorOrder.items.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price
      });
      vendorOrder.subtotal += itemTotal;
    }

    // Calculate tax, shipping, and total
    const tax = subtotal * 0.1; // 10% tax
    const shipping = 0; // Free shipping for now
    const discount = 0; // Coupon discount calculation
    const total = subtotal + tax + shipping - discount;

    // Create order
    const order = new Order({
      customer: customerId,
      items: orderItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      subtotal,
      tax,
      shipping,
      discount,
      total,
      paymentMethod,
      vendorOrders: Array.from(vendorOrders.values())
    });

    await order.save();

    // Update product quantities
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: -item.quantity }
      });
    }

    // Clear user's cart
    await Cart.findOneAndDelete({ user: customerId });

    // Populate order details
    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name email')
      .populate('items.product', 'name images')
      .populate('items.vendor', 'name vendorProfile.businessName')
      .populate('vendorOrders.vendor', 'name vendorProfile.businessName');

    res.status(201).json({
      message: 'Order created successfully',
      order: populatedOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get User Orders
const getUserOrders = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { customer: customerId };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('items.product', 'name images price')
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
    console.error('Get user orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Single Order
const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({
      _id: id,
      $or: [
        { customer: userId },
        { 'vendorOrders.vendor': userId }
      ]
    })
      .populate('customer', 'name email phone')
      .populate('items.product', 'name images price')
      .populate('items.vendor', 'name email vendorProfile.businessName')
      .populate('vendorOrders.vendor', 'name email vendorProfile.businessName')
      .populate('vendorOrders.items.product', 'name images');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update Order Status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tracking } = req.body;
    const userId = req.user.id;

    const order = await Order.findOne({
      _id: id,
      'vendorOrders.vendor': userId
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found or unauthorized' });
    }

    // Update vendor order status
    const vendorOrder = order.vendorOrders.find(vo => vo.vendor.toString() === userId.toString());
    if (vendorOrder) {
      vendorOrder.status = status;
      if (tracking) {
        vendorOrder.tracking = tracking;
      }
    }

    // Update main order status if all vendor orders are completed
    const allVendorOrdersComplete = order.vendorOrders.every(vo => 
      ['shipped', 'delivered'].includes(vo.status)
    );

    if (allVendorOrdersComplete && order.status !== 'delivered') {
      order.status = 'shipped';
    }

    await order.save();

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Vendor Orders
const getVendorOrders = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { 'vendorOrders.vendor': vendorId };
    if (status) {
      query['vendorOrders.status'] = status;
    }

    const orders = await Order.find(query)
      .populate('customer', 'name email')
      .populate('items.product', 'name images')
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
    console.error('Get vendor orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel Order
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.id;

    const order = await Order.findOne({
      _id: id,
      customer: customerId
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ 
        message: 'Order cannot be cancelled at this stage' 
      });
    }

    order.status = 'cancelled';
    await order.save();

    // Restore product quantities
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: item.quantity }
      });
    }

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get All Orders (Admin)
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, paymentStatus } = req.query;

    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const orders = await Order.find(query)
      .populate('customer', 'name email')
      .populate('items.product', 'name')
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

module.exports = {
  createOrder,
  getUserOrders,
  getOrder,
  updateOrderStatus,
  getVendorOrders,
  cancelOrder,
  getAllOrders
};

