const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Coupon = require("../models/couponModel");

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Get Razorpay Key ID (public route for frontend)
const getRazorpayKeyId = (req, res) => {
  res.json({ keyId: process.env.RAZORPAY_KEY_ID });
};

// USD to INR conversion rate (you may want to fetch this dynamically)
const USD_TO_INR_RATE = 84;

// Create Razorpay Order
const createRazorpayOrder = async (req, res) => {
  try {
    const { items, shippingAddress, couponCode, currency = "INR" } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items provided" });
    }

    // Validate currency
    const validCurrencies = ["INR", "USD"];
    const selectedCurrency = validCurrencies.includes(currency) ? currency : "INR";

    // Validate products and calculate totals
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);
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
    }

    // Handle coupon if provided
    let discount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
      });
      if (coupon) {
        const now = new Date();
        if (now >= coupon.validFrom && now <= coupon.validUntil) {
          if (coupon.type === "percentage") {
            discount = (subtotal * coupon.value) / 100;
            if (coupon.maximumDiscount) {
              discount = Math.min(discount, coupon.maximumDiscount);
            }
          } else if (coupon.type === "fixed_amount") {
            discount = coupon.value;
          }
          discount = Math.min(discount, subtotal);
        }
      }
    }

    // Calculate tax and shipping
    const shipping = subtotal > 100 ? 0 : 15;
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + shipping + tax - discount;

    // Convert to smallest currency unit (paise for INR, cents for USD)
    // Razorpay expects amount in smallest unit (1 INR = 100 paise, 1 USD = 100 cents)
    let amountInSmallestUnit;
    if (selectedCurrency === "INR") {
      // Convert USD to INR first, then to paise
      const totalInINR = total * USD_TO_INR_RATE;
      amountInSmallestUnit = Math.round(totalInINR * 100);
    } else {
      // USD - convert to cents
      amountInSmallestUnit = Math.round(total * 100);
    }

    // Create Razorpay order
    const options = {
      amount: amountInSmallestUnit,
      currency: selectedCurrency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        customerId: req.user.id,
        itemCount: items.length,
        originalAmountUSD: total.toFixed(2),
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.json({
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      receipt: razorpayOrder.receipt,
    });
  } catch (error) {
    console.error("Create Razorpay order error:", error);
    res.status(500).json({ message: "Failed to create Razorpay order" });
  }
};

// Verify Razorpay Payment and Create Order
const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Payment verified, now create the order
    const customerId = req.user.id;
    const { items, shippingAddress, billingAddress, couponCode } = orderData;

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
      coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
      });
      if (coupon) {
        const now = new Date();
        if (now < coupon.validFrom || now > coupon.validUntil) {
          coupon = null;
        } else if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          coupon = null;
        } else if (subtotal < (coupon.minimumAmount || 0)) {
          coupon = null;
        }
      }
    }

    // Calculate tax, shipping, and total per vendor and create separate orders
    const createdOrders = [];

    for (const [vendorId, vdata] of vendorOrders.entries()) {
      const vendorSubtotal = vdata.subtotal;
      const tax = vendorSubtotal * 0.1; // 10% tax
      let shipping = 0;

      // Compute discount for this vendor's order based on coupon
      let vendorDiscount = 0;
      if (coupon) {
        if (coupon.type === "percentage") {
          vendorDiscount = (vendorSubtotal * coupon.value) / 100;
          if (coupon.maximumDiscount)
            vendorDiscount = Math.min(vendorDiscount, coupon.maximumDiscount);
        } else if (coupon.type === "fixed_amount") {
          vendorDiscount =
            subtotal > 0 ? (vendorSubtotal / subtotal) * coupon.value : 0;
          if (coupon.maximumDiscount)
            vendorDiscount = Math.min(vendorDiscount, coupon.maximumDiscount);
        } else if (coupon.type === "free_shipping") {
          shipping = 0;
          vendorDiscount = 0;
        }
        vendorDiscount = Math.min(vendorDiscount, vendorSubtotal);
        vendorDiscount = Math.round(vendorDiscount * 100) / 100;
      }

      const total =
        Math.round((vendorSubtotal + tax + shipping - vendorDiscount) * 100) /
        100;

      const itemsForVendor = vdata.items.map((it) => ({
        product: it.product,
        vendor: it.vendor,
        quantity: it.quantity,
        price: it.price,
        variant: it.variant,
      }));

      const orderNumber =
        "ORD-" +
        Date.now() +
        "-" +
        Math.random().toString(36).substr(2, 5).toUpperCase();

      // Calculate commission (10% platform fee)
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
        paymentMethod: "razorpay",
        paymentStatus: "paid",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
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

      // Update product quantities
      for (const it of itemsForVendor) {
        await Product.findByIdAndUpdate(it.product, {
          $inc: { quantity: -it.quantity },
        });
      }

      createdOrders.push(orderDoc);
    }

    // If coupon used, increment usedCount
    if (coupon) {
      coupon.usedCount = (coupon.usedCount || 0) + 1;
      await coupon.save();
    }

    // Clear user's cart
    await Cart.findOneAndDelete({ user: customerId });

    // Populate the created orders for response
    const populatedOrders = await Order.find({
      _id: { $in: createdOrders.map((o) => o._id) },
    })
      .populate("customer", "name email")
      .populate("items.product", "name images")
      .populate("items.vendor", "name vendorProfile.businessName");

    res.json({
      message: "Payment verified and orders created successfully",
      orders: populatedOrders,
    });
  } catch (error) {
    console.error("Verify Razorpay payment error:", error);
    res.status(500).json({ message: "Failed to verify payment" });
  }
};

module.exports = {
  getRazorpayKeyId,
  createRazorpayOrder,
  verifyRazorpayPayment,
};
