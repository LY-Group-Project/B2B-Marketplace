const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const {
  uploadMultiple,
  uploadSingle,
  handleUploadError,
  uploadToImgBB,
  uploadMultipleToImgBB,
} = require("../middleware/upload");

// Upload multiple images to ImgBB
router.post("/images", auth, uploadMultiple("images", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    // Upload all files to ImgBB (pass req for proxy URL generation)
    const uploadResults = await uploadMultipleToImgBB(req.files, req);

    // Extract URLs from results
    const urls = uploadResults.map((result) => result.url);

    res.status(200).json({
      message: "Images uploaded successfully",
      urls: urls,
      files: uploadResults.map((result) => ({
        originalName: result.originalName,
        filename: result.filename,
        size: result.size,
        url: result.url,
        imgbbUrl: result.imgbbUrl,
        displayUrl: result.displayUrl,
        thumb: result.thumb,
        deleteUrl: result.deleteUrl,
        imagePath: result.imagePath,
      })),
    });
  } catch (error) {
    console.error("Upload images error:", error);
    res.status(500).json({ message: error.message || "Server error during upload" });
  }
});

// Upload single image to ImgBB
router.post("/image", auth, uploadSingle("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload file to ImgBB (pass req for proxy URL generation)
    const uploadResult = await uploadToImgBB(req.file.buffer, req.file.originalname, req);

    res.status(200).json({
      message: "Image uploaded successfully",
      url: uploadResult.url,
      file: {
        originalName: uploadResult.originalName,
        filename: uploadResult.filename,
        size: uploadResult.size,
        url: uploadResult.url,
        imgbbUrl: uploadResult.imgbbUrl,
        displayUrl: uploadResult.displayUrl,
        thumb: uploadResult.thumb,
        deleteUrl: uploadResult.deleteUrl,
        imagePath: uploadResult.imagePath,
      },
    });
  } catch (error) {
    console.error("Upload image error:", error);
    res.status(500).json({ message: error.message || "Server error during upload" });
  }
});

// Note: Delete endpoint removed as ImgBB provides its own delete URLs
// To delete an image, use the deleteUrl returned from the upload response

// Error handling middleware
router.use(handleUploadError);

module.exports = router;
