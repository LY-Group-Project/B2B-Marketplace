const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Web3Key = require("../models/web3KeyModel");
const { encrypt } = require("../utils/crypto");
const { validationResult } = require("express-validator");
const { Web3 } = require("web3");

// Generate JWT Token (includes tokenVersion to allow invalidation)
const generateToken = (user) => {
  const payload = { userId: user._id.toString(), tokenVersion: user.tokenVersion || 0 };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Generate Web3 key for a user
const generateWeb3Key = async (userId) => {
  // Check if key already exists
  const existingKey = await Web3Key.findOne({ user: userId });
  if (existingKey) {
    return existingKey;
  }

  // Create new Ethereum account
  const web3 = new Web3();
  const account = web3.eth.accounts.create();

  // Encrypt the private key
  const encryptedPrivateKey = encrypt(account.privateKey);

  // Save to database
  const web3Key = new Web3Key({
    user: userId,
    address: account.address.toLowerCase(),
    encryptedPrivateKey,
  });

  await web3Key.save();
  return web3Key;
};

// Register User
const register = async (req, res) => {
  try {
    const { name, email, password, role = "customer" } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role,
    });

    await user.save();

    // Generate Web3 key for the user
    try {
      await generateWeb3Key(user._id);
    } catch (web3Error) {
      console.error("Failed to generate Web3 key:", web3Error);
      // Non-fatal: user can still be created, web3 key can be generated later
    }

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// Login User
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if account is suspended
    if (!user.isActive) {
      return res.status(403).json({ 
        message: "Your account has been suspended. Please contact support for assistance.",
        code: "ACCOUNT_SUSPENDED"
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        vendorProfile: user.vendorProfile,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// Get Current User
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update User Profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const userId = req.user.id;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Change Password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Deactivate Account
const deactivateAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    await User.findByIdAndUpdate(userId, { isActive: false });

    res.json({ message: "Account deactivated successfully" });
  } catch (error) {
    console.error("Deactivate account error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get or generate Web3 key for current user
const getWeb3Key = async (req, res) => {
  try {
    const userId = req.user.id;

    // Try to find existing key or generate new one
    let web3Key = await Web3Key.findOne({ user: userId });
    
    if (!web3Key) {
      web3Key = await generateWeb3Key(userId);
    }

    res.json({
      message: "Web3 key retrieved successfully",
      address: web3Key.address,
      createdAt: web3Key.createdAt,
    });
  } catch (error) {
    console.error("Get Web3 key error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  updateProfile,
  changePassword,
  deactivateAccount,
  getWeb3Key,
  generateWeb3Key,
};
