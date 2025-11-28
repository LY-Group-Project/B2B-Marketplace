const multer = require("multer");
const axios = require("axios");
const crypto = require("crypto");

// ImgBB API configuration
const IMGBB_API_KEY = process.env.IMGBB_API_KEY || "29a98ea980dc32436967bbd9e1c58bee";
const IMGBB_UPLOAD_URL = "https://api.imgbb.com/1/upload";

// Configure multer to use memory storage (for uploading to ImgBB)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  // Check file type - ImgBB only supports images
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed for ImgBB upload!"), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 32 * 1024 * 1024, // 32MB limit (ImgBB allows up to 32MB)
  },
  fileFilter: fileFilter,
});

// Generate unique filename
const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(8).toString("hex");
  const ext = originalName.split(".").pop();
  return `img_${timestamp}_${randomStr}.${ext}`;
};

// Extract image path from ImgBB URL for proxy
// e.g., https://i.ibb.co/kg7kbHPZ/filename.png -> kg7kbHPZ/filename.png
const extractImgBBPath = (imgbbUrl) => {
  const match = imgbbUrl.match(/i\.ibb\.co\/([^\/]+\/[^\/]+)$/);
  return match ? match[1] : null;
};

// Build proxy URL from ImgBB URL
const buildProxyUrl = (imgbbUrl, req) => {
  const imagePath = extractImgBBPath(imgbbUrl);
  if (!imagePath) return imgbbUrl; // Fallback to original if parsing fails
  
  // Use HOST_URL from env in production, or construct from request
  const baseUrl = process.env.NODE_ENV === "production" 
    ? (process.env.API_URL || process.env.HOST_URL || `${req.protocol}://${req.get("host")}`)
    : `${req.protocol}://${req.get("host")}`;
  
  return `${baseUrl}/api/images/${imagePath}`;
};

// Upload single file to ImgBB
const uploadToImgBB = async (fileBuffer, originalName, req = null) => {
  try {
    const uniqueName = generateUniqueFilename(originalName);
    const base64Image = fileBuffer.toString("base64");

    const formData = new URLSearchParams();
    formData.append("key", IMGBB_API_KEY);
    formData.append("image", base64Image);
    formData.append("name", uniqueName);

    const response = await axios.post(IMGBB_UPLOAD_URL, formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 60000, // 60 second timeout for large files
    });

    if (response.data && response.data.success) {
      const imgbbUrl = response.data.data.url;
      const proxyUrl = req ? buildProxyUrl(imgbbUrl, req) : imgbbUrl;
      
      return {
        success: true,
        url: proxyUrl, // Proxy URL for storage in DB
        imgbbUrl: imgbbUrl, // Original ImgBB URL (for reference)
        displayUrl: response.data.data.display_url,
        deleteUrl: response.data.data.delete_url,
        thumb: response.data.data.thumb?.url,
        medium: response.data.data.medium?.url,
        filename: uniqueName,
        originalName: originalName,
        size: response.data.data.size,
        imagePath: extractImgBBPath(imgbbUrl), // Path for proxy
      };
    } else {
      throw new Error("ImgBB upload failed");
    }
  } catch (error) {
    console.error("ImgBB upload error:", error.response?.data || error.message);
    throw new Error(`Failed to upload image to ImgBB: ${error.message}`);
  }
};

// Upload multiple files to ImgBB
const uploadMultipleToImgBB = async (files, req = null) => {
  const uploadPromises = files.map((file) =>
    uploadToImgBB(file.buffer, file.originalname, req)
  );
  return Promise.all(uploadPromises);
};

// Upload middleware for single file
const uploadSingle = (fieldName) => upload.single(fieldName);

// Upload middleware for multiple files
const uploadMultiple = (fieldName, maxCount = 5) =>
  upload.array(fieldName, maxCount);

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "File too large. Maximum size is 32MB." });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res
        .status(400)
        .json({ message: "Too many files. Maximum is 5 files." });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res
        .status(400)
        .json({ message: "Unexpected field name for file upload." });
    }
  }

  if (error.message === "Only image files are allowed for ImgBB upload!") {
    return res.status(400).json({ message: error.message });
  }

  next(error);
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  handleUploadError,
  uploadToImgBB,
  uploadMultipleToImgBB,
  generateUniqueFilename,
  extractImgBBPath,
  buildProxyUrl,
  IMGBB_API_KEY,
};
