const paypal = require("@paypal/checkout-server-sdk");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Coupon = require("../models/couponModel");

// PayPal Environment Configuration
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  // Use sandbox for development, live for production
  if (process.env.NODE_ENV === "production") {
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  }
  return new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

// Create PayPal Order
const createPayPalOrder = async (req, res) => {
  try {
    const { items, shippingAddress, couponCode } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items provided" });
    }

    // Validate products and calculate totals
    let subtotal = 0;
    const orderItems = [];

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

      orderItems.push({
        name: product.name.substring(0, 127), // PayPal limits name to 127 chars
        unit_amount: {
          currency_code: "USD",
          value: product.price.toFixed(2),
        },
        quantity: item.quantity.toString(),
      });
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

    // Create PayPal order request
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: total.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: subtotal.toFixed(2),
              },
              shipping: {
                currency_code: "USD",
                value: shipping.toFixed(2),
              },
              tax_total: {
                currency_code: "USD",
                value: tax.toFixed(2),
              },
              discount: {
                currency_code: "USD",
                value: discount.toFixed(2),
              },
            },
          },
          items: orderItems,
        },
      ],
      application_context: {
        brand_name: "B2B Marketplace",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/checkout/success`,
        cancel_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/checkout/cancel`,
      },
    });

    const paypalOrder = await client().execute(request);

    res.status(201).json({
      id: paypalOrder.result.id,
      status: paypalOrder.result.status,
    });
  } catch (error) {
    console.error("Create PayPal order error:", error);
    res.status(500).json({
      message: "Failed to create PayPal order",
      error: error.message,
    });
  }
};

// Capture PayPal Order (after user approves payment)
const capturePayPalOrder = async (req, res) => {
  try {
    const { orderID } = req.params;
    const customerId = req.user.id;
    const {
      items,
      shippingAddress,
      billingAddress,
      couponCode,
      notes,
    } = req.body;

    // Capture the PayPal payment
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    const capture = await client().execute(request);

    if (capture.result.status !== "COMPLETED") {
      return res.status(400).json({
        message: "Payment not completed",
        status: capture.result.status,
      });
    }

    // Payment successful, now create the order in our database
    let subtotal = 0;
    const orderItems = [];
    const vendorOrders = new Map();

    for (const item of items) {
      const product = await Product.findById(item.product).populate("vendor");
      if (!product) continue;

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        vendor: product.vendor._id,
        quantity: item.quantity,
        price: product.price,
        variant: item.variant,
      });

      // Group by vendor
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

    // Handle coupon
    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
      });
    }

    // Create orders for each vendor
    const createdOrders = [];

    for (const [vendorId, vdata] of vendorOrders.entries()) {
      const vendorSubtotal = vdata.subtotal;
      const tax = vendorSubtotal * 0.1;
      let shipping = 0;

      let vendorDiscount = 0;
      if (coupon) {
        if (coupon.type === "percentage") {
          vendorDiscount = (vendorSubtotal * coupon.value) / 100;
          if (coupon.maximumDiscount) {
            vendorDiscount = Math.min(vendorDiscount, coupon.maximumDiscount);
          }
        } else if (coupon.type === "fixed_amount") {
          vendorDiscount =
            subtotal > 0 ? (vendorSubtotal / subtotal) * coupon.value : 0;
        }
        vendorDiscount = Math.min(vendorDiscount, vendorSubtotal);
        vendorDiscount = Math.round(vendorDiscount * 100) / 100;
      }

      const total =
        Math.round((vendorSubtotal + tax + shipping - vendorDiscount) * 100) /
        100;

      const orderNumber =
        "ORD-" +
        Date.now() +
        "-" +
        Math.random().toString(36).substr(2, 5).toUpperCase();

      const commissionRate = 0.1;
      const commission = Math.round(vendorSubtotal * commissionRate * 100) / 100;
      const vendorAmount =
        Math.round((vendorSubtotal - commission) * 100) / 100;

      const orderDoc = new Order({
        orderNumber,
        customer: customerId,
        items: vdata.items.map((it) => ({
          product: it.product,
          vendor: it.vendor,
          quantity: it.quantity,
          price: it.price,
          variant: it.variant,
        })),
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
        subtotal: vendorSubtotal,
        tax,
        shipping,
        discount: vendorDiscount,
        total,
        paymentMethod: "paypal",
        paymentStatus: "paid",
        paypalOrderId: orderID,
        paypalCaptureId: capture.result.purchase_units[0]?.payments?.captures[0]?.id,
        notes,
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
      for (const it of vdata.items) {
        await Product.findByIdAndUpdate(it.product, {
          $inc: { quantity: -it.quantity },
        });
      }

      createdOrders.push(orderDoc);
    }

    // Increment coupon usage
    if (coupon) {
      coupon.usedCount = (coupon.usedCount || 0) + 1;
      await coupon.save();
    }

    // Clear user's cart
    await Cart.findOneAndDelete({ user: customerId });

    // Populate orders for response
    const populatedOrders = await Order.find({
      _id: { $in: createdOrders.map((o) => o._id) },
    })
      .populate("customer", "name email")
      .populate("items.product", "name images")
      .populate("items.vendor", "name vendorProfile.businessName");

    res.status(201).json({
      message: "Payment successful! Orders created.",
      orders: populatedOrders,
      paypalOrderId: orderID,
      captureId: capture.result.purchase_units[0]?.payments?.captures[0]?.id,
    });
  } catch (error) {
    console.error("Capture PayPal order error:", error);
    res.status(500).json({
      message: "Failed to capture PayPal payment",
      error: error.message,
    });
  }
};

// Get PayPal Client ID (for frontend)
const getPayPalClientId = async (req, res) => {
  res.json({
    clientId: process.env.PAYPAL_CLIENT_ID,
  });
};

module.exports = {
  createPayPalOrder,
  capturePayPalOrder,
  getPayPalClientId,
};
