const express = require("express");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

// Cache configuration
const CACHE_DIR = path.join(__dirname, "../.image-cache");
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const CACHE_CLEANUP_INTERVAL = 60 * 60 * 1000; // Cleanup every hour

// Ensure cache directory exists (called on every operation for safety)
const ensureCacheDir = () => {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
};

// Initialize cache directory
ensureCacheDir();

// In-memory cache for quick lookups (stores metadata)
const memoryCache = new Map();

// Generate cache key from image path
const getCacheKey = (imagePath) => {
  return crypto.createHash("md5").update(imagePath).digest("hex");
};

// Get cache file path
const getCacheFilePath = (cacheKey, ext) => {
  return path.join(CACHE_DIR, `${cacheKey}${ext}`);
};

// Get metadata file path
const getMetadataPath = (cacheKey) => {
  return path.join(CACHE_DIR, `${cacheKey}.meta.json`);
};

// Check if cache is valid
const isCacheValid = (metadata) => {
  if (!metadata || !metadata.timestamp) return false;
  const age = Date.now() - metadata.timestamp;
  return age < CACHE_MAX_AGE;
};

// Save to cache
const saveToCache = async (cacheKey, buffer, contentType, originalUrl) => {
  try {
    ensureCacheDir(); // Ensure directory exists before writing
    
    const ext = getExtensionFromContentType(contentType);
    const filePath = getCacheFilePath(cacheKey, ext);
    const metadataPath = getMetadataPath(cacheKey);

    // Write image file
    fs.writeFileSync(filePath, buffer);

    // Write metadata
    const metadata = {
      timestamp: Date.now(),
      contentType,
      originalUrl,
      ext,
      size: buffer.length,
    };
    fs.writeFileSync(metadataPath, JSON.stringify(metadata));

    // Update memory cache
    memoryCache.set(cacheKey, { ...metadata, filePath });

    return true;
  } catch (error) {
    console.error("Cache save error:", error.message);
    return false;
  }
};

// Load from cache
const loadFromCache = (cacheKey) => {
  try {
    // Check memory cache first
    let metadata = memoryCache.get(cacheKey);

    if (!metadata) {
      // Try to load from disk
      const metadataPath = getMetadataPath(cacheKey);
      if (fs.existsSync(metadataPath)) {
        metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
        metadata.filePath = getCacheFilePath(cacheKey, metadata.ext);
      }
    }

    if (!metadata || !isCacheValid(metadata)) {
      // If cache is expired, clean it up
      if (metadata) {
        cleanupSingleEntry(cacheKey, metadata.ext);
      }
      return null;
    }

    const filePath = metadata.filePath || getCacheFilePath(cacheKey, metadata.ext);
    if (!fs.existsSync(filePath)) {
      // File missing, clean up metadata
      memoryCache.delete(cacheKey);
      return null;
    }

    return {
      buffer: fs.readFileSync(filePath),
      contentType: metadata.contentType,
      cached: true,
    };
  } catch (error) {
    console.error("Cache load error:", error.message);
    return null;
  }
};

// Clean up a single cache entry
const cleanupSingleEntry = (cacheKey, ext) => {
  try {
    const metadataPath = getMetadataPath(cacheKey);
    const imagePath = getCacheFilePath(cacheKey, ext);
    
    if (fs.existsSync(metadataPath)) fs.unlinkSync(metadataPath);
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    memoryCache.delete(cacheKey);
  } catch (e) {
    // Ignore cleanup errors
  }
};

// Get file extension from content type
const getExtensionFromContentType = (contentType) => {
  const map = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/bmp": ".bmp",
    "image/svg+xml": ".svg",
  };
  return map[contentType] || ".jpg";
};

// Cleanup old cache files (runs on startup and periodically)
const cleanupCache = () => {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      ensureCacheDir();
      return;
    }

    const files = fs.readdirSync(CACHE_DIR);
    const now = Date.now();
    let cleaned = 0;

    for (const file of files) {
      if (file.endsWith(".meta.json")) {
        const metadataPath = path.join(CACHE_DIR, file);
        try {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
          if (now - metadata.timestamp > CACHE_MAX_AGE) {
            // Delete metadata file
            fs.unlinkSync(metadataPath);
            // Delete image file
            const imageFile = path.join(CACHE_DIR, file.replace(".meta.json", metadata.ext));
            if (fs.existsSync(imageFile)) {
              fs.unlinkSync(imageFile);
            }
            // Remove from memory cache
            const cacheKey = file.replace(".meta.json", "");
            memoryCache.delete(cacheKey);
            cleaned++;
          }
        } catch (e) {
          // If metadata is corrupted, delete it
          try {
            fs.unlinkSync(metadataPath);
          } catch (unlinkErr) {
            // Ignore
          }
        }
      }
    }

    // Also clean orphaned image files (no metadata)
    const remainingFiles = fs.readdirSync(CACHE_DIR);
    const metaFiles = new Set(
      remainingFiles
        .filter(f => f.endsWith(".meta.json"))
        .map(f => f.replace(".meta.json", ""))
    );
    
    for (const file of remainingFiles) {
      if (!file.endsWith(".meta.json")) {
        const baseName = file.replace(/\.[^.]+$/, "");
        if (!metaFiles.has(baseName)) {
          // Orphaned file, delete it
          try {
            fs.unlinkSync(path.join(CACHE_DIR, file));
            cleaned++;
          } catch (e) {
            // Ignore
          }
        }
      }
    }

    if (cleaned > 0) {
      console.log(`Image cache cleanup: removed ${cleaned} expired/orphaned items`);
    }
  } catch (error) {
    console.error("Cache cleanup error:", error.message);
  }
};

// Start periodic cache cleanup
setInterval(cleanupCache, CACHE_CLEANUP_INTERVAL);

// Run cleanup on startup (cleans expired files from previous runs)
cleanupCache();
console.log("Image cache initialized, expired entries cleaned up");

/**
 * Image proxy endpoint
 * URL format: /api/images/:imageId/:filename
 * Example: /api/images/kg7kbHPZ/migrated-1764327577604-a17ba82ed7041a83-png.png
 * 
 * This proxies to: https://i.ibb.co/kg7kbHPZ/migrated-1764327577604-a17ba82ed7041a83-png.png
 */
router.get("/:imageId/:filename", async (req, res) => {
  try {
    const { imageId, filename } = req.params;
    const imagePath = `${imageId}/${filename}`;
    const cacheKey = getCacheKey(imagePath);

    // Try to load from cache
    const cached = loadFromCache(cacheKey);
    if (cached) {
      res.set({
        "Content-Type": cached.contentType,
        "Cache-Control": "public, max-age=604800", // 7 days browser cache
        "X-Cache": "HIT",
      });
      return res.send(cached.buffer);
    }

    // Fetch from ImgBB
    const imgbbUrl = `https://i.ibb.co/${imagePath}`;
    
    const response = await axios.get(imgbbUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
      headers: {
        "User-Agent": "B2B-Marketplace-Proxy/1.0",
      },
    });

    const buffer = Buffer.from(response.data);
    const contentType = response.headers["content-type"] || "image/jpeg";

    // Save to cache (async, don't wait)
    saveToCache(cacheKey, buffer, contentType, imgbbUrl);

    // Send response
    res.set({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=604800", // 7 days browser cache
      "X-Cache": "MISS",
    });
    res.send(buffer);
  } catch (error) {
    console.error("Image proxy error:", error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ message: "Image not found" });
    }
    
    res.status(500).json({ message: "Failed to fetch image" });
  }
});

// Health check / cache stats endpoint
router.get("/cache/stats", (req, res) => {
  try {
    let totalSize = 0;
    let fileCount = 0;

    if (fs.existsSync(CACHE_DIR)) {
      const files = fs.readdirSync(CACHE_DIR);
      for (const file of files) {
        if (!file.endsWith(".meta.json")) {
          const stats = fs.statSync(path.join(CACHE_DIR, file));
          totalSize += stats.size;
          fileCount++;
        }
      }
    }

    res.json({
      cacheDir: CACHE_DIR,
      cachedImages: fileCount,
      totalSizeBytes: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      memoryCacheEntries: memoryCache.size,
      maxAgeHours: CACHE_MAX_AGE / (60 * 60 * 1000),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Clear cache endpoint (admin only in production)
router.delete("/cache/clear", (req, res) => {
  try {
    if (fs.existsSync(CACHE_DIR)) {
      const files = fs.readdirSync(CACHE_DIR);
      for (const file of files) {
        fs.unlinkSync(path.join(CACHE_DIR, file));
      }
    }
    memoryCache.clear();
    res.json({ message: "Cache cleared successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
