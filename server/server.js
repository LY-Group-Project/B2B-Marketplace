const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

dotenv.config();
const app = express();

// Security middleware with relaxed CSP for development
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        scriptSrc: ["'self'", "https://www.paypal.com", "https://www.paypalobjects.com", "https://checkout.razorpay.com"],
        imgSrc: [
          "'self'",
          "data:",
          "http://localhost:5000",
          "http://localhost:5173",
          "http://127.0.0.1:5000",
          "http://127.0.0.1:5173",
          "https://www.paypalobjects.com",
          "https://i.ibb.co",
          "https://*.ibb.co",
        ],
        connectSrc: [
          "'self'",
          "http://localhost:5000",
          "http://localhost:5173",
          "https://www.paypal.com",
          "https://www.sandbox.paypal.com",
          "https://api.razorpay.com",
          "https://checkout.razorpay.com",
          "https://api.imgbb.com",
        ],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'", "https://www.paypal.com", "https://www.sandbox.paypal.com", "https://api.razorpay.com", "https://checkout.razorpay.com"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// Rate limiting - higher limit for development
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 2 minutes
  max: process.env.NODE_ENV === "production" ? 67 : 1000, // Higher limit for development
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// IMPORTANT: CORS must come BEFORE rate limiter so CORS headers are sent even on rate limit errors
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      process.env.CLIENT_URL || "http://localhost:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
  }),
);

app.use(limiter);

// Explicitly handle preflight OPTIONS requests and ensure CORS headers
app.options("*", cors());

// Fallback middleware to ensure CORS headers are present on all responses
app.use((req, res, next) => {
  const origin = req.headers.origin || "*";
  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files with CORS headers - serve uploads directory
app.use(
  "/uploads",
  (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept",
    );
    res.header("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "uploads")),
);

// Logging
app.use(morgan("combined"));

// Swagger API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "B2B Marketplace API Documentation",
  customfavIcon: "/favicon.ico",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
  },
}));

// Swagger JSON endpoint
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/vendors", require("./routes/vendors"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/images", require("./routes/images")); // Image proxy with caching
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/webauth", require("./routes/webAuth"));
app.use("/api/address", require("./routes/address"));
app.use("/api/paypal", require("./routes/paypal"));
app.use("/api/razorpay", require("./routes/razorpay"));
app.use("/api/escrows", require("./routes/escrows"));
app.use("/api/payouts", require("./routes/payouts"));
app.use("/api/disputes", require("./routes/disputes"));
app.use("/api/invoices", require("./routes/invoices"));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use("/api/", (req, res) => {
  res.status(200).json({
    message: "API is running. Please check your endpoint URL.",
    version: "1.0.0",
    appName: "B2B Marketplace",
  });
});
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Database Connection
mongoose
  .connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/multivendor-ecommerce",
    {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    },
  )
  .then(async () => {
    console.log("MongoDB Connected");
    // Initialize Escrow Service
    try {
      const escrowService = require("./services/escrowService");
      await escrowService.initialize();
    } catch (err) {
      console.warn("Escrow service initialization skipped:", err.message);
    }
    
    // Start burn verification background service
    try {
      const burnVerificationService = require("./services/burnVerificationService");
      burnVerificationService.start();
    } catch (err) {
      console.warn("Burn verification service initialization skipped:", err.message);
    }
  })
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
