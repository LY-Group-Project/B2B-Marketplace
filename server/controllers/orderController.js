const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const User = require("../models/userModel");
const Coupon = require("../models/couponModel");

// Create Order
const createOrder = async (req, res) => {
  try {
    const customerId = req.user.id;
    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      couponCode,
    } = req.body;

    // Validate products and calculate totals
    let subtotal = 0;
    const orderItems = [];
    const vendorOrders = new Map();

    for (const item of items) {
      const product = await Product.findById(item.product).populate("vendor");
      if (!product || !product.isActive) {
        return res
          .status(400)
          .json({ message: `Product ${item.product} not found or inactive` });
      }

      if (product.trackQuantity && product.quantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient quantity for product ${product.name}`,
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        vendor: product.vendor._id,
        quantity: item.quantity,
        price: product.price,
        variant: item.variant,
      });

      // Group by vendor for vendor orders
      if (!vendorOrders.has(product.vendor._id.toString())) {
        vendorOrders.set(product.vendor._id.toString(), {
          vendor: product.vendor._id,
          items: [],
          subtotal: 0,
        });
      }

      const vendorOrder = vendorOrders.get(product.vendor._id.toString());
      vendorOrder.items.push({
        product: product._id,
        vendor: product.vendor._id,
        quantity: item.quantity,
        price: product.price,
        variant: item.variant,
      });
      vendorOrder.subtotal += itemTotal;
    }

    // Handle coupon if provided
    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (!coupon) {
        return res.status(400).json({ message: "Invalid or inactive coupon code" });
      }
      const now = new Date();
      if (now < coupon.validFrom || now > coupon.validUntil) {
        return res.status(400).json({ message: "Coupon is not valid at this time" });
      }
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return res.status(400).json({ message: "Coupon usage limit reached" });
      }
      if (subtotal < (coupon.minimumAmount || 0)) {
        return res.status(400).json({ message: `Coupon requires minimum order of ${coupon.minimumAmount}` });
      }
    }

    // Calculate tax, shipping, and total per vendor and create separate orders
    const createdOrders = [];

    for (const [vendorId, vdata] of vendorOrders.entries()) {
      const vendorSubtotal = vdata.subtotal;
      const tax = vendorSubtotal * 0.1; // 10% tax
      let shipping = 0;

      // compute discount for this vendor's order based on coupon
      let vendorDiscount = 0;
      if (coupon) {
        if (coupon.type === "percentage") {
          vendorDiscount = (vendorSubtotal * coupon.value) / 100;
          if (coupon.maximumDiscount) vendorDiscount = Math.min(vendorDiscount, coupon.maximumDiscount);
        } else if (coupon.type === "fixed_amount") {
          // distribute fixed amount proportionally across vendors
          vendorDiscount = subtotal > 0 ? (vendorSubtotal / subtotal) * coupon.value : 0;
          if (coupon.maximumDiscount) vendorDiscount = Math.min(vendorDiscount, coupon.maximumDiscount);
        } else if (coupon.type === "free_shipping") {
          shipping = 0;
          vendorDiscount = 0;
        }
        // ensure discount does not exceed subtotal
        vendorDiscount = Math.min(vendorDiscount, vendorSubtotal);
        // round to 2 decimals
        vendorDiscount = Math.round(vendorDiscount * 100) / 100;
      }

      const total = Math.round((vendorSubtotal + tax + shipping - vendorDiscount) * 100) / 100;

      // build items array for this vendor order
      const itemsForVendor = vdata.items.map((it) => ({
        product: it.product,
        vendor: it.vendor,
        quantity: it.quantity,
        price: it.price,
        variant: it.variant,
      }));

      const orderNumber =
        "ORD-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5).toUpperCase();

      // Calculate commission (e.g., 10% platform fee)
      const commissionRate = 0.1;
      const commission = Math.round(vendorSubtotal * commissionRate * 100) / 100;
      const vendorAmount = Math.round((vendorSubtotal - commission) * 100) / 100;

      const orderDoc = new Order({
        orderNumber,
        customer: customerId,
        items: itemsForVendor,
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
        subtotal: vendorSubtotal,
        tax,
        shipping,
        discount: vendorDiscount,
        total,
        paymentMethod,
        vendorOrders: [
          {
            vendor: vdata.vendor,
            items: vdata.items.map((it) => ({
              product: it.product,
              quantity: it.quantity,
              price: it.price,
            })),
            subtotal: vendorSubtotal,
            commission,
            vendorAmount,
            status: "pending",
          },
        ],
      });

      await orderDoc.save();

      // Update product quantities for this vendor's items
      for (const it of itemsForVendor) {
        await Product.findByIdAndUpdate(it.product, {
          $inc: { quantity: -it.quantity },
        });
      }

      createdOrders.push(orderDoc);
    }

    // If coupon used, increment usedCount once (counts as one coupon usage per checkout)
    if (coupon) {
      coupon.usedCount = (coupon.usedCount || 0) + 1;
      await coupon.save();
    }

    // Clear user's cart
    await Cart.findOneAndDelete({ user: customerId });

    // Populate the created orders for response
    const populatedOrders = await Order.find({ _id: { $in: createdOrders.map((o) => o._id) } })
      .populate("customer", "name email")
      .populate("items.product", "name images")
      .populate("items.vendor", "name vendorProfile.businessName");

    res.status(201).json({
      message: "Orders created successfully",
      orders: populatedOrders,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: "Server error" });
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
      .populate("items.product", "name images price")
      .populate("items.vendor", "name vendorProfile.businessName")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Get user orders error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Single Order
const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({
      _id: id,
      $or: [{ customer: userId }, { "vendorOrders.vendor": userId }],
    })
      .populate("customer", "name email phone")
      .populate("items.product", "name images price")
      .populate("items.vendor", "name email vendorProfile.businessName")
      .populate("vendorOrders.vendor", "name email vendorProfile.businessName")
      .populate("vendorOrders.items.product", "name images");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ message: "Server error" });
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
      "vendorOrders.vendor": userId,
    });

    if (!order) {
      return res
        .status(404)
        .json({ message: "Order not found or unauthorized" });
    }

    // Update vendor order status
    const vendorOrder = order.vendorOrders.find(
      (vo) => vo.vendor.toString() === userId.toString(),
    );
    if (vendorOrder) {
      vendorOrder.status = status;
      if (tracking) {
        vendorOrder.tracking = tracking;
      }
    }

    // Update main order status if all vendor orders are completed
    const allVendorOrdersComplete = order.vendorOrders.every((vo) =>
      ["shipped", "delivered"].includes(vo.status),
    );

    if (allVendorOrdersComplete && order.status !== "delivered") {
      order.status = "shipped";
    }

    await order.save();

    res.json({
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Vendor Orders
const getVendorOrders = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { "vendorOrders.vendor": vendorId };
    if (status) {
      query["vendorOrders.status"] = status;
    }

    const orders = await Order.find(query)
      .populate("customer", "name email")
      .populate("items.product", "name images")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Get vendor orders error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Cancel Order
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.id;

    const order = await Order.findOne({
      _id: id,
      customer: customerId,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({
        message: "Order cannot be cancelled at this stage",
      });
    }

    order.status = "cancelled";
    await order.save();

    // Restore product quantities
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: item.quantity },
      });
    }

    res.json({ message: "Order cancelled successfully" });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ message: "Server error" });
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
      .populate("customer", "name email")
      .populate("items.product", "name")
      .populate("items.vendor", "name vendorProfile.businessName")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrder,
  updateOrderStatus,
  getVendorOrders,
  cancelOrder,
  getAllOrders,
};
