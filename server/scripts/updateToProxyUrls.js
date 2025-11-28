/**
 * Script to update existing ImgBB URLs in the database to use proxy URLs
 * 
 * Usage: node scripts/updateToProxyUrls.js
 * 
 * This script will:
 * 1. Find all products with ImgBB URLs (i.ibb.co)
 * 2. Convert them to proxy URLs (/api/images/...)
 */

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/multivendor-ecommerce";

// Base URL for the API (change this for production)
const API_BASE_URL = process.env.API_URL || "http://localhost:5000";

// Extract image path from ImgBB URL
const extractImgBBPath = (imgbbUrl) => {
  const match = imgbbUrl.match(/i\.ibb\.co\/([^\/]+\/[^\/]+)$/);
  return match ? match[1] : null;
};

// Convert ImgBB URL to proxy URL
const convertToProxyUrl = (imgbbUrl) => {
  const imagePath = extractImgBBPath(imgbbUrl);
  if (!imagePath) return imgbbUrl; // Return original if can't parse
  return `${API_BASE_URL}/api/images/${imagePath}`;
};

// Check if URL is an ImgBB URL
const isImgBBUrl = (url) => {
  return url && url.includes("i.ibb.co");
};

// Main update function
const updateToProxyUrls = async () => {
  console.log("=".repeat(60));
  console.log("Updating ImgBB URLs to Proxy URLs");
  console.log("=".repeat(60));
  console.log(`API Base URL: ${API_BASE_URL}`);

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

  // Find all products with images
  console.log("\n2. Finding products with ImgBB URLs...");
  
  try {
    const products = await Product.find({
      "images.url": { $regex: "i.ibb.co" }
    });

    console.log(`   Found ${products.length} products with ImgBB URLs`);

    if (products.length === 0) {
      console.log("   No products need updating");
      await mongoose.disconnect();
      return;
    }

    // Update each product
    console.log("\n3. Updating product image URLs...");
    let productsUpdated = 0;
    let imagesUpdated = 0;

    for (const product of products) {
      let productModified = false;

      if (product.images && product.images.length > 0) {
        for (let i = 0; i < product.images.length; i++) {
          const image = product.images[i];
          if (isImgBBUrl(image.url)) {
            const oldUrl = image.url;
            const newUrl = convertToProxyUrl(oldUrl);
            
            if (oldUrl !== newUrl) {
              console.log(`   Converting: ${oldUrl.substring(0, 50)}...`);
              console.log(`          To: ${newUrl}`);
              product.images[i].url = newUrl;
              productModified = true;
              imagesUpdated++;
            }
          }
        }
      }

      if (productModified) {
        await product.save();
        productsUpdated++;
      }
    }

    console.log(`\n   Updated ${productsUpdated} products with ${imagesUpdated} images`);
  } catch (error) {
    console.error("   Error updating database:", error.message);
  }

  // Disconnect from MongoDB
  await mongoose.disconnect();
  
  console.log("\n" + "=".repeat(60));
  console.log("Update complete!");
  console.log("=".repeat(60));
};

// Run update
updateToProxyUrls().catch((error) => {
  console.error("Update failed:", error);
  process.exit(1);
});
