const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { auth } = require("../middleware/auth");
const app = express();
const {
  uploadMultiple,
  uploadSingle,
  handleUploadError,
} = require("../middleware/upload");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Upload multiple images
router.post("/images", auth, uploadMultiple("images", 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    // Generate URLs for uploaded files
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const urls = req.files.map((file) => `${baseUrl}/uploads/${file.filename}`);

    res.status(200).json({
      message: "Images uploaded successfully",
      urls: urls,
      files: req.files.map((file) => ({
        originalName: file.originalname,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
      })),
    });
  } catch (error) {
    console.error("Upload images error:", error);
    res.status(500).json({ message: "Server error during upload" });
  }
});

// Upload single image
router.post("/image", auth, uploadSingle("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Generate URL for uploaded file
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const url = `${baseUrl}/uploads/${req.file.filename}`;

    res.status(200).json({
      message: "Image uploaded successfully",
      url: url,
      file: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error("Upload image error:", error);
    res.status(500).json({ message: "Server error during upload" });
  }
});

// Delete uploaded file
router.delete("/:filename", auth, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    // Delete the file
    fs.unlinkSync(filePath);

    res.status(200).json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete file error:", error);
    res.status(500).json({ message: "Server error during file deletion" });
  }
});

// Error handling middleware
router.use(handleUploadError);

module.exports = router;
