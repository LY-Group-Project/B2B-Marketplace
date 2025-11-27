const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Token is not valid" });
    }

    // Invalidate token if tokenVersion mismatch (allows immediate logout after admin action)
    if (typeof decoded.tokenVersion !== 'undefined' && decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ message: "Token has been invalidated" });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: "Account is deactivated" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Access denied. Insufficient permissions." });
    }

    next();
  };
};

const vendorAuth = async (req, res, next) => {
  try {
    if (req.user.role !== "vendor" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Vendor access required" });
    }

    if (req.user.role === "vendor") {
      // Check if vendor account is active
      if (!req.user.isActive) {
        return res
          .status(403)
          .json({ message: "Vendor account is suspended" });
      }

      // Check if vendor is approved
      if (!req.user.vendorProfile?.isApproved) {
        return res
          .status(403)
          .json({ message: "Vendor account not approved yet" });
      }
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  auth,
  authorize,
  vendorAuth,
  adminAuth,
};
