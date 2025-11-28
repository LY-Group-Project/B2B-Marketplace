const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  createDispute,
  getDispute,
  getDisputeByOrder,
  sendMessage,
  resolveDispute,
  getDisputes,
  updatePriority,
  assignAdmin,
  closeDispute,
} = require("../controllers/disputeController");
const { auth, adminAuth } = require("../middleware/auth");
const { body, param } = require("express-validator");
const { handleValidationErrors, validateObjectId } = require("../middleware/validation");

// Setup multer for proof images
const proofsDir = path.join(__dirname, "../proofs");
if (!fs.existsSync(proofsDir)) {
  fs.mkdirSync(proofsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, proofsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `proof-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPEG, PNG, GIF, WebP) are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 5, // Max 5 files per message
  },
});

// Serve proof images (publicly accessible via obscure filename - no auth needed)
// Security: Filenames are random UUIDs, only shared in authenticated chat
router.get("/proofs/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Sanitize filename to prevent directory traversal
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(proofsDir, sanitizedFilename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Image not found" });
    }

    // Get file stats for cache headers
    const stats = fs.statSync(filePath);
    
    // Check if file is expired (older than 7 days)
    const fileAge = Date.now() - stats.mtimeMs;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (fileAge > sevenDaysMs) {
      // Delete expired file
      fs.unlinkSync(filePath);
      return res.status(410).json({ message: "Image has expired" });
    }

    // Set cache headers and CORS for images
    res.set({
      "Cache-Control": "private, max-age=86400", // 1 day
      "Content-Type": getContentType(sanitizedFilename),
      "Access-Control-Allow-Origin": "*",
      "Cross-Origin-Resource-Policy": "cross-origin",
    });

    res.sendFile(filePath);
  } catch (error) {
    console.error("Serve proof image error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Helper to get content type
function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  return types[ext] || "application/octet-stream";
}

// Cleanup expired proof images (run periodically)
const cleanupExpiredProofs = () => {
  try {
    const files = fs.readdirSync(proofsDir);
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    let deletedCount = 0;
    for (const file of files) {
      const filePath = path.join(proofsDir, file);
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.mtimeMs;

      if (fileAge > sevenDaysMs) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} expired proof images`);
    }
  } catch (error) {
    console.error("Error cleaning up proof images:", error);
  }
};

// Run cleanup every hour
setInterval(cleanupExpiredProofs, 60 * 60 * 1000);
// Run cleanup on startup
cleanupExpiredProofs();

// Get all disputes (admin gets all, users get their own)
router.get("/", auth, getDisputes);

// Get dispute by ID
router.get("/:id", auth, validateObjectId("id"), getDispute);

// Get dispute by order ID
router.get("/order/:orderId", auth, validateObjectId("orderId"), getDisputeByOrder);

// Create dispute
router.post(
  "/",
  auth,
  [
    body("orderId").isMongoId().withMessage("Valid order ID is required"),
    body("reason")
      .isString()
      .isLength({ min: 10, max: 1000 })
      .withMessage("Reason must be between 10 and 1000 characters"),
  ],
  handleValidationErrors,
  createDispute
);

// Send message (with optional image uploads)
router.post(
  "/:id/messages",
  auth,
  validateObjectId("id"),
  upload.array("images", 5),
  sendMessage
);

// Resolve dispute (admin only)
router.post(
  "/:id/resolve",
  auth,
  adminAuth,
  validateObjectId("id"),
  [
    body("winner").isIn(["buyer", "seller"]).withMessage("Winner must be 'buyer' or 'seller'"),
    body("notes").optional().isString().isLength({ max: 1000 }),
  ],
  handleValidationErrors,
  resolveDispute
);

// Update priority (admin only)
router.patch(
  "/:id/priority",
  auth,
  adminAuth,
  validateObjectId("id"),
  [
    body("priority")
      .isIn(["low", "medium", "high", "urgent"])
      .withMessage("Invalid priority level"),
  ],
  handleValidationErrors,
  updatePriority
);

// Assign admin to dispute (admin only)
router.patch(
  "/:id/assign",
  auth,
  adminAuth,
  validateObjectId("id"),
  [body("adminId").isMongoId().withMessage("Valid admin ID is required")],
  handleValidationErrors,
  assignAdmin
);

// Close dispute
router.post(
  "/:id/close",
  auth,
  validateObjectId("id"),
  [body("reason").optional().isString().isLength({ max: 500 })],
  handleValidationErrors,
  closeDispute
);

module.exports = router;
