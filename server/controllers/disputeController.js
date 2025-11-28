const Dispute = require("../models/disputeModel");
const Order = require("../models/orderModel");
const escrowService = require("../services/escrowService");
const path = require("path");
const fs = require("fs");

// Helper to determine user's role in a dispute
const getUserRole = (dispute, userId) => {
  if (dispute.buyer.toString() === userId || dispute.buyer._id?.toString() === userId) {
    return "buyer";
  }
  if (dispute.seller.toString() === userId || dispute.seller._id?.toString() === userId) {
    return "seller";
  }
  return null;
};

// Create or get existing dispute for an order
const createDispute = async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    const userId = req.user.id;

    // Check if dispute already exists
    const existingDispute = await Dispute.findOne({ order: orderId });
    if (existingDispute) {
      return res.status(400).json({
        message: "A dispute already exists for this order",
        dispute: existingDispute,
      });
    }

    // Get the order
    const order = await Order.findById(orderId)
      .populate("customer", "name email")
      .populate("vendorOrders.vendor", "name email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify user is buyer or seller
    const customerId = order.customer._id.toString();
    const vendorId = order.vendorOrders[0]?.vendor?._id?.toString();

    let raisedByRole;
    if (customerId === userId) {
      raisedByRole = "buyer";
    } else if (vendorId === userId) {
      raisedByRole = "seller";
    } else {
      return res.status(403).json({ message: "Unauthorized to raise dispute" });
    }

    // Create dispute
    const dispute = new Dispute({
      order: orderId,
      buyer: customerId,
      seller: vendorId,
      raisedBy: userId,
      raisedByRole,
      reason,
      messages: [{
        sender: userId,
        senderRole: raisedByRole,
        content: reason,
      }],
    });

    await dispute.save();

    // Update order escrow status if escrow exists
    if (order.escrow && order.escrow.address) {
      // Call blockchain dispute function
      if (escrowService.isInitialized()) {
        try {
          const result = await escrowService.raiseDispute(order.escrow.address, userId);
          order.escrow.status = "Disputed";
          order.escrow.transactions.push({
            type: "disputeRaised",
            txHash: result.txHash,
            blockNumber: result.blockNumber,
            timestamp: new Date(),
            by: userId,
          });
          await order.save();
        } catch (err) {
          console.error("Failed to raise dispute on-chain:", err);
        }
      }
    }

    // Populate for response
    await dispute.populate([
      { path: "buyer", select: "name email" },
      { path: "seller", select: "name email" },
      { path: "raisedBy", select: "name email" },
    ]);

    res.status(201).json({
      message: "Dispute created successfully",
      dispute,
    });
  } catch (error) {
    console.error("Create dispute error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

// Get dispute by order ID (auto-creates dispute if escrow is disputed but no chat exists)
const getDisputeByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";

    let dispute = await Dispute.findOne({ order: orderId })
      .populate("buyer", "name email")
      .populate("seller", "name email")
      .populate("raisedBy", "name email")
      .populate("assignedAdmin", "name email")
      .populate("messages.sender", "name email")
      .populate("resolution.resolvedBy", "name email")
      .populate({
        path: "order",
        select: "orderNumber total status escrow",
      });

    // If no dispute exists, check if escrow is disputed and auto-create
    if (!dispute) {
      const order = await Order.findById(orderId)
        .populate("customer", "name email")
        .populate("vendorOrders.vendor", "name email");

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user has access to this order
      const customerId = order.customer._id.toString();
      const vendorId = order.vendorOrders[0]?.vendor?._id?.toString();
      
      if (customerId !== userId && vendorId !== userId && !isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // If escrow exists and is disputed, auto-create the dispute chat
      if (order.escrow && order.escrow.status === "Disputed") {
        // Determine who raised it based on who is viewing
        let raisedByRole;
        let raisedBy;
        if (customerId === userId) {
          raisedByRole = "buyer";
          raisedBy = customerId;
        } else if (vendorId === userId) {
          raisedByRole = "seller";
          raisedBy = vendorId;
        } else {
          // Admin viewing - default to buyer as the raiser
          raisedByRole = "buyer";
          raisedBy = customerId;
        }

        dispute = new Dispute({
          order: orderId,
          buyer: customerId,
          seller: vendorId,
          raisedBy,
          raisedByRole,
          reason: "Dispute raised via escrow system",
          status: "open",
          messages: [{
            sender: raisedBy,
            senderRole: raisedByRole,
            content: "Dispute raised via escrow system. Please describe the issue in detail.",
          }],
        });

        await dispute.save();

        // Populate for response
        await dispute.populate([
          { path: "buyer", select: "name email" },
          { path: "seller", select: "name email" },
          { path: "raisedBy", select: "name email" },
          { path: "messages.sender", select: "name email" },
          { path: "order", select: "orderNumber total status escrow" },
        ]);

        return res.json({
          dispute,
          userRole: isAdmin ? "admin" : raisedByRole,
          autoCreated: true,
        });
      }

      return res.status(404).json({ message: "No dispute found for this order" });
    }

    // Check access
    const userRole = getUserRole(dispute, userId);
    if (!userRole && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Mark messages as read
    const unreadMessages = dispute.messages.filter(
      (msg) => !msg.readBy.some((r) => r.user.toString() === userId)
    );
    
    if (unreadMessages.length > 0) {
      unreadMessages.forEach((msg) => {
        msg.readBy.push({ user: userId, readAt: new Date() });
      });
      await dispute.save();
    }

    res.json({
      dispute,
      userRole: isAdmin ? "admin" : userRole,
    });
  } catch (error) {
    console.error("Get dispute error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get dispute by ID
const getDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";

    const dispute = await Dispute.findById(id)
      .populate("buyer", "name email")
      .populate("seller", "name email")
      .populate("raisedBy", "name email")
      .populate("assignedAdmin", "name email")
      .populate("messages.sender", "name email")
      .populate("resolution.resolvedBy", "name email")
      .populate({
        path: "order",
        select: "orderNumber total status escrow items",
        populate: {
          path: "items.product",
          select: "name images price",
        },
      });

    if (!dispute) {
      return res.status(404).json({ message: "Dispute not found" });
    }

    // Check access
    const userRole = getUserRole(dispute, userId);
    if (!userRole && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Mark messages as read
    const unreadMessages = dispute.messages.filter(
      (msg) => !msg.readBy.some((r) => r.user.toString() === userId)
    );
    
    if (unreadMessages.length > 0) {
      unreadMessages.forEach((msg) => {
        msg.readBy.push({ user: userId, readAt: new Date() });
      });
      await dispute.save();
    }

    res.json({
      dispute,
      userRole: isAdmin ? "admin" : userRole,
    });
  } catch (error) {
    console.error("Get dispute error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Send message in dispute chat
const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";

    const dispute = await Dispute.findById(id);
    if (!dispute) {
      return res.status(404).json({ message: "Dispute not found" });
    }

    // Check access and determine role
    let senderRole = getUserRole(dispute, userId);
    if (!senderRole && isAdmin) {
      senderRole = "admin";
    }
    if (!senderRole) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Check if dispute is still open
    if (dispute.status === "resolved" || dispute.status === "closed") {
      return res.status(400).json({ message: "Cannot send messages to a resolved dispute" });
    }

    // Handle uploaded images
    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        images.push({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          mimeType: file.mimetype,
          size: file.size,
          uploadedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
      }
    }

    // Require either content or images
    if (!content && images.length === 0) {
      return res.status(400).json({ message: "Message must have content or images" });
    }

    const message = {
      sender: userId,
      senderRole,
      content: content || "",
      images,
      readBy: [{ user: userId, readAt: new Date() }],
    };

    dispute.messages.push(message);
    dispute.lastActivityAt = new Date();

    // If admin responds, update status to under_review
    if (isAdmin && dispute.status === "open") {
      dispute.status = "under_review";
      if (!dispute.assignedAdmin) {
        dispute.assignedAdmin = userId;
      }
    }

    await dispute.save();

    // Get the newly added message with populated sender
    const updatedDispute = await Dispute.findById(id)
      .populate("messages.sender", "name email");
    
    const newMessage = updatedDispute.messages[updatedDispute.messages.length - 1];

    res.status(201).json({
      message: "Message sent successfully",
      chatMessage: newMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Resolve dispute (admin only)
const resolveDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { winner, notes } = req.body;
    const adminId = req.user.id;

    if (!["buyer", "seller"].includes(winner)) {
      return res.status(400).json({ message: "Winner must be 'buyer' or 'seller'" });
    }

    const dispute = await Dispute.findById(id)
      .populate("order");

    if (!dispute) {
      return res.status(404).json({ message: "Dispute not found" });
    }

    if (dispute.status === "resolved" || dispute.status === "closed") {
      return res.status(400).json({ message: "Dispute is already resolved" });
    }

    const order = await Order.findById(dispute.order._id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Resolve on blockchain if escrow exists
    if (order.escrow && order.escrow.address && escrowService.isInitialized()) {
      try {
        const winnerAddress = winner === "buyer" 
          ? order.escrow.buyerAddress 
          : order.escrow.sellerAddress;
        
        const result = await escrowService.resolveDispute(order.escrow.address, winnerAddress);
        
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
      } catch (err) {
        console.error("Failed to resolve dispute on-chain:", err);
        return res.status(500).json({ message: "Failed to resolve dispute on blockchain: " + err.message });
      }
    }

    // Update dispute
    dispute.status = "resolved";
    dispute.resolution = {
      winner,
      resolvedBy: adminId,
      resolvedAt: new Date(),
      notes,
    };

    // Add resolution message
    dispute.messages.push({
      sender: adminId,
      senderRole: "admin",
      content: `Dispute resolved in favor of ${winner}. ${notes || ""}`.trim(),
      readBy: [{ user: adminId, readAt: new Date() }],
    });

    await dispute.save();

    // Populate for response
    await dispute.populate([
      { path: "buyer", select: "name email" },
      { path: "seller", select: "name email" },
      { path: "resolution.resolvedBy", select: "name email" },
    ]);

    res.json({
      message: `Dispute resolved in favor of ${winner}`,
      dispute,
    });
  } catch (error) {
    console.error("Resolve dispute error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

// Get all disputes (admin) or user's disputes
const getDisputes = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";
    const { page = 1, limit = 10, status, priority } = req.query;

    let query = {};

    if (isAdmin) {
      // Admin can see all disputes
      if (status) query.status = status;
      if (priority) query.priority = priority;
    } else {
      // Users can only see their disputes
      query.$or = [{ buyer: userId }, { seller: userId }];
      if (status) query.status = status;
    }

    const disputes = await Dispute.find(query)
      .populate("buyer", "name email")
      .populate("seller", "name email")
      .populate("assignedAdmin", "name email")
      .populate({
        path: "order",
        select: "orderNumber total status",
      })
      .sort({ lastActivityAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Dispute.countDocuments(query);

    // Get unread counts for each dispute
    const disputesWithUnread = disputes.map((dispute) => {
      const unreadCount = dispute.messages.filter(
        (msg) => !msg.readBy.some((r) => r.user.toString() === userId)
      ).length;
      return {
        ...dispute.toObject(),
        unreadCount,
      };
    });

    res.json({
      disputes: disputesWithUnread,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    console.error("Get disputes error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update dispute priority (admin only)
const updatePriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    if (!["low", "medium", "high", "urgent"].includes(priority)) {
      return res.status(400).json({ message: "Invalid priority level" });
    }

    const dispute = await Dispute.findByIdAndUpdate(
      id,
      { priority },
      { new: true }
    );

    if (!dispute) {
      return res.status(404).json({ message: "Dispute not found" });
    }

    res.json({
      message: "Priority updated",
      dispute,
    });
  } catch (error) {
    console.error("Update priority error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Assign admin to dispute
const assignAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;

    const dispute = await Dispute.findByIdAndUpdate(
      id,
      { 
        assignedAdmin: adminId,
        status: "under_review",
      },
      { new: true }
    ).populate("assignedAdmin", "name email");

    if (!dispute) {
      return res.status(404).json({ message: "Dispute not found" });
    }

    res.json({
      message: "Admin assigned",
      dispute,
    });
  } catch (error) {
    console.error("Assign admin error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Close dispute without resolution (e.g., withdrawn by user)
const closeDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";

    const dispute = await Dispute.findById(id);
    if (!dispute) {
      return res.status(404).json({ message: "Dispute not found" });
    }

    // Only the person who raised it or admin can close
    if (dispute.raisedBy.toString() !== userId && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized to close this dispute" });
    }

    if (dispute.status === "resolved" || dispute.status === "closed") {
      return res.status(400).json({ message: "Dispute is already closed" });
    }

    dispute.status = "closed";
    dispute.messages.push({
      sender: userId,
      senderRole: isAdmin ? "admin" : dispute.raisedByRole,
      content: `Dispute closed. ${reason || ""}`.trim(),
      readBy: [{ user: userId, readAt: new Date() }],
    });

    await dispute.save();

    res.json({
      message: "Dispute closed",
      dispute,
    });
  } catch (error) {
    console.error("Close dispute error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createDispute,
  getDispute,
  getDisputeByOrder,
  sendMessage,
  resolveDispute,
  getDisputes,
  updatePriority,
  assignAdmin,
  closeDispute,
};
