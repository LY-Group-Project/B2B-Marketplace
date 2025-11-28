const Order = require("../models/orderModel");
const Web3Key = require("../models/web3KeyModel");
const escrowService = require("../services/escrowService");
const { sendMail } = require("../services/mailerService");

// Create escrow for an order
const createEscrowForOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    if (!escrowService.isInitialized()) {
      return res.status(503).json({ message: "Escrow service is not available" });
    }

    const order = await Order.findById(orderId)
      .populate("customer", "name email")
      .populate("vendorOrders.vendor", "name email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify the user is the customer for this order
    if (order.customer._id.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Check if escrow already exists
    if (order.escrow && order.escrow.address) {
      return res.status(400).json({
        message: "Escrow already exists for this order",
        escrow: order.escrow,
      });
    }

    // Get or create buyer's blockchain address
    const { address: buyerAddress } = await escrowService.getOrCreateUserAddress(userId);

    // Get vendor (seller) - use first vendor for simplicity
    const vendorOrder = order.vendorOrders[0];
    if (!vendorOrder || !vendorOrder.vendor) {
      return res.status(400).json({ message: "No vendor found for this order" });
    }

    const vendorId = vendorOrder.vendor._id.toString();
    const { address: sellerAddress } = await escrowService.getOrCreateUserAddress(vendorId);

    // Convert order total to wei (assuming 18 decimals)
    const amountInWei = escrowService.toWei(order.total);

    // Create escrow on-chain
    const result = await escrowService.createEscrow(buyerAddress, sellerAddress, amountInWei);

    // Update order with escrow info
    order.escrow = {
      address: result.escrowAddress,
      status: "Locked",
      buyerAddress,
      sellerAddress,
      amount: order.total.toString(),
      transactions: [
        {
          type: "created",
          txHash: result.txHash,
          blockNumber: result.blockNumber,
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
    };

    await order.save();

    // Send fund hold notification email to vendor (non-blocking)
    const vendor = order.vendorOrders[0]?.vendor;
    if (vendor && vendor.email) {
      sendMail({
        to: vendor.email,
        subject: `Funds Secured in Escrow - Order #${order.orderNumber}`,
        templateName: 'fund-hold',
        templateData: {
          vendorName: vendor.name || vendor.vendorProfile?.businessName || 'Vendor',
          amount: `$${order.total.toFixed(2)}`,
          orderId: order.orderNumber,
          holdDate: new Date().toLocaleDateString(),
          holdReason: 'Order Confirmation',
          holdReasonDetails: 'Funds have been placed in escrow to protect both parties in this transaction. They will be released once you confirm order delivery.',
          expectedReleaseDate: 'Upon order completion and confirmation',
          escrowAddress: order.escrow.address,
          nextSteps: '1. Process and ship the order\\n2. Update the order status to "delivered"\\n3. Funds will be released automatically after delivery confirmation',
          orderDetailsLink: `${process.env.CLIENT_URL}/vendor/orders/${order._id}`,
          contactSupportLink: `${process.env.CLIENT_URL}/support`,
          supportEmail: 'support@parthb.xyz'
        }
      }).catch(err => console.error('Failed to send fund hold email:', err));
    }

    res.status(201).json({
      message: "Escrow created successfully",
      escrow: order.escrow,
    });
  } catch (error) {
    console.error("Create escrow error:", error);
    res.status(500).json({ message: error.message || "Failed to create escrow" });
  }
};

// Get escrow details for an order
const getEscrow = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findById(orderId)
      .populate("customer", "name email")
      .populate("vendorOrders.vendor", "name email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check access: customer, vendor, or admin
    const isCustomer = order.customer._id.toString() === userId;
    const isVendor = order.vendorOrders.some(
      (vo) => vo.vendor && vo.vendor._id.toString() === userId
    );
    const isAdmin = req.user.role === "admin";

    if (!isCustomer && !isVendor && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (!order.escrow || !order.escrow.address) {
      return res.status(404).json({ message: "No escrow found for this order" });
    }

    // Get on-chain escrow details
    let onChainDetails = null;
    if (escrowService.isInitialized()) {
      try {
        onChainDetails = await escrowService.getEscrowDetails(order.escrow.address);
      } catch (err) {
        console.error("Error fetching on-chain escrow details:", err);
      }
    }

    res.json({
      escrow: order.escrow,
      onChain: onChainDetails,
      explorerUrl: process.env.BLOCK_EXPLORER_URL
        ? `${process.env.BLOCK_EXPLORER_URL}/address/${order.escrow.address}`
        : null,
    });
  } catch (error) {
    console.error("Get escrow error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Confirm delivery (buyer action)
const confirmDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    if (!escrowService.isInitialized()) {
      return res.status(503).json({ message: "Escrow service is not available" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only buyer can confirm delivery
    if (order.customer.toString() !== userId) {
      return res.status(403).json({ message: "Only buyer can confirm delivery" });
    }

    if (!order.escrow || !order.escrow.address) {
      return res.status(400).json({ message: "No escrow found for this order" });
    }

    const result = await escrowService.confirmDelivery(order.escrow.address, userId);

    // Update order escrow status
    order.escrow.status = "ReleasePending";
    order.escrow.transactions.push({
      type: "deliveryConfirmed",
      txHash: result.txHash,
      blockNumber: result.blockNumber,
      timestamp: new Date(),
    });

    // Update order status
    order.status = "delivered";
    await order.save();

    res.json({
      message: "Delivery confirmed successfully",
      txHash: result.txHash,
      escrow: order.escrow,
    });
  } catch (error) {
    console.error("Confirm delivery error:", error);
    res.status(500).json({ message: error.message || "Failed to confirm delivery" });
  }
};

// Release funds (seller action)
const releaseFunds = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    if (!escrowService.isInitialized()) {
      return res.status(503).json({ message: "Escrow service is not available" });
    }

    const order = await Order.findById(orderId).populate("vendorOrders.vendor");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only seller (vendor) can release funds
    const isVendor = order.vendorOrders.some(
      (vo) => vo.vendor && vo.vendor._id.toString() === userId
    );

    if (!isVendor) {
      return res.status(403).json({ message: "Only seller can release funds" });
    }

    if (!order.escrow || !order.escrow.address) {
      return res.status(400).json({ message: "No escrow found for this order" });
    }

    const result = await escrowService.releaseFunds(order.escrow.address, userId);

    // Update order escrow status
    order.escrow.status = "Complete";
    order.escrow.transactions.push({
      type: "fundsReleased",
      txHash: result.txHash,
      blockNumber: result.blockNumber,
      timestamp: new Date(),
    });

    // Update payment status
    order.paymentStatus = "paid";
    await order.save();

    // Send fund release notification email to vendor (non-blocking)
    const vendor = order.vendorOrders[0]?.vendor;
    if (vendor && vendor.email) {
      const vendorAmount = order.vendorOrders[0]?.vendorAmount || order.total;
      
      sendMail({
        to: vendor.email,
        subject: `Funds Released - $${vendorAmount.toFixed(2)}`,
        templateName: 'fund-release',
        templateData: {
          vendorName: vendor.name || vendor.vendorProfile?.businessName || 'Vendor',
          amount: `$${vendorAmount.toFixed(2)}`,
          transactionId: result.txHash,
          orderId: order.orderNumber,
          releaseDate: new Date().toLocaleDateString(),
          paymentMethod: 'Blockchain Escrow',
          escrowAddress: order.escrow.address,
          availableBalance: `$${vendorAmount.toFixed(2)}`,
          viewTransactionLink: `${process.env.BLOCK_EXPLORER_URL}/tx/${result.txHash}`,
          requestPayoutLink: `${process.env.CLIENT_URL}/vendor/payouts`,
          supportEmail: 'support@parthb.xyz'
        }
      }).catch(err => console.error('Failed to send fund release email:', err));
    }

    res.json({
      message: "Funds released successfully",
      txHash: result.txHash,
      escrow: order.escrow,
    });
  } catch (error) {
    console.error("Release funds error:", error);
    res.status(500).json({ message: error.message || "Failed to release funds" });
  }
};

// Raise dispute (buyer or seller)
const raiseDispute = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    if (!escrowService.isInitialized()) {
      return res.status(503).json({ message: "Escrow service is not available" });
    }

    const order = await Order.findById(orderId).populate("vendorOrders.vendor");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only buyer or seller can raise dispute
    const isCustomer = order.customer.toString() === userId;
    const isVendor = order.vendorOrders.some(
      (vo) => vo.vendor && vo.vendor._id.toString() === userId
    );

    if (!isCustomer && !isVendor) {
      return res.status(403).json({ message: "Only buyer or seller can raise dispute" });
    }

    if (!order.escrow || !order.escrow.address) {
      return res.status(400).json({ message: "No escrow found for this order" });
    }

    const result = await escrowService.raiseDispute(order.escrow.address, userId);

    // Update order escrow status
    order.escrow.status = "Disputed";
    order.escrow.transactions.push({
      type: "disputeRaised",
      txHash: result.txHash,
      blockNumber: result.blockNumber,
      timestamp: new Date(),
      by: userId,
    });

    await order.save();

    res.json({
      message: "Dispute raised successfully",
      txHash: result.txHash,
      escrow: order.escrow,
    });
  } catch (error) {
    console.error("Raise dispute error:", error);
    res.status(500).json({ message: error.message || "Failed to raise dispute" });
  }
};

// Resolve dispute (admin/arbitrator only)
const resolveDispute = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { winner } = req.body; // "buyer" or "seller"

    if (!escrowService.isInitialized()) {
      return res.status(503).json({ message: "Escrow service is not available" });
    }

    // Admin-only endpoint - checked by middleware
    const order = await Order.findById(orderId)
      .populate("customer", "name email")
      .populate("vendorOrders.vendor", "name email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!order.escrow || !order.escrow.address) {
      return res.status(400).json({ message: "No escrow found for this order" });
    }

    // Determine winner address
    let winnerAddress;
    if (winner === "buyer") {
      winnerAddress = order.escrow.buyerAddress;
    } else if (winner === "seller") {
      winnerAddress = order.escrow.sellerAddress;
    } else {
      return res.status(400).json({ message: "Winner must be 'buyer' or 'seller'" });
    }

    const result = await escrowService.resolveDispute(order.escrow.address, winnerAddress);

    // Update order escrow status
    order.escrow.status = winner === "seller" ? "Complete" : "Refunded";
    order.escrow.transactions.push({
      type: "disputeResolved",
      txHash: result.txHash,
      blockNumber: result.blockNumber,
      timestamp: new Date(),
      winner,
    });

    // Update order and payment status
    if (winner === "seller") {
      order.paymentStatus = "paid";
    } else {
      order.paymentStatus = "refunded";
      order.status = "refunded";
    }

    await order.save();

    res.json({
      message: `Dispute resolved in favor of ${winner}`,
      txHash: result.txHash,
      escrow: order.escrow,
    });
  } catch (error) {
    console.error("Resolve dispute error:", error);
    res.status(500).json({ message: error.message || "Failed to resolve dispute" });
  }
};

// Get user's blockchain wallet info
const getWalletInfo = async (req, res) => {
  try {
    const userId = req.user.id;

    const web3Key = await Web3Key.findOne({ user: userId });

    if (!web3Key) {
      // Generate a new wallet if none exists
      if (escrowService.isInitialized()) {
        const { address } = await escrowService.generateAndStoreKey(userId);
        return res.json({
          address,
          hasWallet: true,
          message: "New wallet created",
        });
      }
      return res.json({
        address: null,
        hasWallet: false,
        message: "Escrow service not available",
      });
    }

    res.json({
      address: web3Key.address,
      hasWallet: true,
      createdAt: web3Key.createdAt,
    });
  } catch (error) {
    console.error("Get wallet info error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createEscrowForOrder,
  getEscrow,
  confirmDelivery,
  releaseFunds,
  raiseDispute,
  resolveDispute,
  getWalletInfo,
};
