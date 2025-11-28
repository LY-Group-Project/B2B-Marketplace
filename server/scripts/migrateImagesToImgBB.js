/**
 * Migration script to move local images to ImgBB and update database references
 * 
 * Usage: node scripts/migrateImagesToImgBB.js
 * 
 * This script will:
 * 1. Scan the uploads directory for existing images
 * 2. Upload each image to ImgBB
 * 3. Update all product image URLs in the database
 * 4. Create a backup mapping file of old -> new URLs
 */

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// ImgBB API configuration
const IMGBB_API_KEY = process.env.IMGBB_API_KEY || "29a98ea980dc32436967bbd9e1c58bee";
const IMGBB_UPLOAD_URL = "https://api.imgbb.com/1/upload";

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/multivendor-ecommerce";

// Paths
const UPLOADS_DIR = path.join(__dirname, "../uploads");
const BACKUP_FILE = path.join(__dirname, "../migration_backup.json");

// Generate unique filename
const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(8).toString("hex");
  const ext = path.extname(originalName) || ".jpg";
  return `migrated_${timestamp}_${randomStr}${ext}`;
};

// Upload single file to ImgBB
const uploadToImgBB = async (filePath, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const originalName = path.basename(filePath);
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
        timeout: 60000, // 60 second timeout
      });

      if (response.data && response.data.success) {
        return {
          success: true,
          url: response.data.data.url,
          displayUrl: response.data.data.display_url,
          deleteUrl: response.data.data.delete_url,
          filename: uniqueName,
          originalName: originalName,
        };
      } else {
        throw new Error("ImgBB upload failed");
      }
    } catch (error) {
      console.error(`  Attempt ${attempt}/${retries} failed:`, error.message);
      if (attempt === retries) {
        return {
          success: false,
          error: error.message,
          originalName: path.basename(filePath),
        };
      }
      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }
};

// Get all image files from uploads directory
const getLocalImages = () => {
  if (!fs.existsSync(UPLOADS_DIR)) {
    console.log("Uploads directory does not exist");
    return [];
  }

  const files = fs.readdirSync(UPLOADS_DIR);
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];
  
  return files.filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return imageExtensions.includes(ext);
  });
};

// Main migration function
const migrateImages = async () => {
  console.log("=".repeat(60));
  console.log("Starting Image Migration to ImgBB");
  console.log("=".repeat(60));

  // Connect to MongoDB
  console.log("\n1. Connecting to MongoDB...");
  try {
    await mongoose.connect(MONGO_URI);
    console.log("   Connected to MongoDB successfully");
  } catch (error) {
    console.error("   Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }

  // Get Product model
  const Product = require("../models/productModel");

  // Get local images
  console.log("\n2. Scanning uploads directory...");
  const localImages = getLocalImages();
  console.log(`   Found ${localImages.length} images in uploads directory`);

  if (localImages.length === 0) {
    console.log("   No images to migrate");
    await mongoose.disconnect();
    return;
  }

  // Upload images to ImgBB and build URL mapping
  console.log("\n3. Uploading images to ImgBB...");
  const urlMapping = {};
  const uploadResults = [];

  for (let i = 0; i < localImages.length; i++) {
    const filename = localImages[i];
    const filePath = path.join(UPLOADS_DIR, filename);
    
    console.log(`   [${i + 1}/${localImages.length}] Uploading: ${filename}`);
    
    const result = await uploadToImgBB(filePath);
    
    if (result.success) {
      // Build mapping for various URL patterns that might exist in DB
      const patterns = [
        `http://localhost:5000/uploads/${filename}`,
        `http://127.0.0.1:5000/uploads/${filename}`,
        `https://localhost:5000/uploads/${filename}`,
        `/uploads/${filename}`,
        `uploads/${filename}`,
        filename,
      ];
      
      patterns.forEach((pattern) => {
        urlMapping[pattern] = result.url;
      });
      
      uploadResults.push({
        original: filename,
        newUrl: result.url,
        deleteUrl: result.deleteUrl,
        success: true,
      });
      
      console.log(`       ✓ Uploaded to: ${result.url}`);
    } else {
      uploadResults.push({
        original: filename,
        error: result.error,
        success: false,
      });
      console.log(`       ✗ Failed: ${result.error}`);
    }

    // Rate limiting - wait 1 second between uploads
    if (i < localImages.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Save backup mapping
  console.log("\n4. Saving backup mapping...");
  const backup = {
    timestamp: new Date().toISOString(),
    totalImages: localImages.length,
    successful: uploadResults.filter((r) => r.success).length,
    failed: uploadResults.filter((r) => !r.success).length,
    urlMapping: urlMapping,
    results: uploadResults,
  };
  
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(backup, null, 2));
  console.log(`   Backup saved to: ${BACKUP_FILE}`);

  // Update database
  console.log("\n5. Updating product images in database...");
  let productsUpdated = 0;
  let imagesUpdated = 0;

  try {
    const products = await Product.find({
      "images.url": { $exists: true },
    });

    console.log(`   Found ${products.length} products with images`);

    for (const product of products) {
      let productModified = false;

      if (product.images && product.images.length > 0) {
        for (let i = 0; i < product.images.length; i++) {
          const image = product.images[i];
          if (image.url) {
            // Check if URL matches any of our patterns
            for (const [oldPattern, newUrl] of Object.entries(urlMapping)) {
              if (image.url === oldPattern || image.url.includes(oldPattern)) {
                console.log(`   Updating: ${image.url.substring(0, 50)}...`);
                console.log(`         To: ${newUrl}`);
                product.images[i].url = newUrl;
                productModified = true;
                imagesUpdated++;
                break;
              }
            }
          }
        }
      }

      if (productModified) {
        await product.save();
        productsUpdated++;
      }
    }

    console.log(`   Updated ${productsUpdated} products with ${imagesUpdated} images`);
  } catch (error) {
    console.error("   Error updating database:", error.message);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("Migration Summary");
  console.log("=".repeat(60));
  console.log(`Total images found:     ${localImages.length}`);
  console.log(`Successfully uploaded:  ${uploadResults.filter((r) => r.success).length}`);
  console.log(`Failed uploads:         ${uploadResults.filter((r) => !r.success).length}`);
  console.log(`Products updated:       ${productsUpdated}`);
  console.log(`Image URLs updated:     ${imagesUpdated}`);
  console.log(`Backup file:            ${BACKUP_FILE}`);
  console.log("=".repeat(60));

  // Disconnect from MongoDB
  await mongoose.disconnect();
  console.log("\nMigration complete!");
  
  // Note about cleanup
  if (uploadResults.filter((r) => r.success).length > 0) {
    console.log("\n⚠️  Note: Local images in 'uploads/' directory were NOT deleted.");
    console.log("   After verifying the migration, you can manually delete them.");
  }
};

// Run migration
migrateImages().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
