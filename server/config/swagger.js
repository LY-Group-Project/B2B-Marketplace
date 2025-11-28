const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "B2B Marketplace API",
      version: "1.0.0",
      description: `
# B2B Marketplace API Documentation

A comprehensive multivendor e-commerce platform with blockchain-based escrow and secure payment processing.

## Features
- **Authentication**: JWT-based auth with WebAuthn/Passkey support
- **Product Management**: Full CRUD operations for products
- **Order Processing**: Complete order lifecycle management
- **Payment Integration**: PayPal and Razorpay payment gateways
- **Blockchain Escrow**: KooshCoin token-based escrow system
- **Dispute Resolution**: Built-in dispute management system
- **Vendor Payouts**: Automated payout processing with Razorpay

## Authentication
Most endpoints require authentication via Bearer token (JWT).
Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

## Rate Limiting
- Production: 67 requests per minute
- Development: 1000 requests per minute
      `,
      contact: {
        name: "B2B Marketplace Support",
        email: "support@b2bmarketplace.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server",
      },
      {
        url: process.env.API_URL || "https://api.b2bmarketplace.com",
        description: "Production server",
      },
    ],
    tags: [
      { name: "Authentication", description: "User authentication and registration" },
      { name: "WebAuthn", description: "Passkey/WebAuthn authentication" },
      { name: "Products", description: "Product management" },
      { name: "Orders", description: "Order management" },
      { name: "Categories", description: "Product categories" },
      { name: "Reviews", description: "Product reviews" },
      { name: "Vendors", description: "Vendor management" },
      { name: "Admin", description: "Admin operations" },
      { name: "Payments - PayPal", description: "PayPal payment processing" },
      { name: "Payments - Razorpay", description: "Razorpay payment processing" },
      { name: "Escrow", description: "Blockchain escrow operations" },
      { name: "Payouts", description: "Vendor payout management" },
      { name: "Disputes", description: "Dispute management" },
      { name: "Invoices", description: "Invoice generation" },
      { name: "Upload", description: "Image upload" },
      { name: "Images", description: "Image proxy and caching" },
      { name: "Address", description: "Address autocomplete" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", description: "User ID" },
            name: { type: "string", description: "User's full name" },
            email: { type: "string", format: "email", description: "User's email" },
            role: { type: "string", enum: ["customer", "vendor", "admin"], description: "User role" },
            isEmailVerified: { type: "boolean", description: "Email verification status" },
            vendorProfile: {
              type: "object",
              nullable: true,
              properties: {
                businessName: { type: "string" },
                businessAddress: { type: "string" },
                isApproved: { type: "boolean" },
                commissionRate: { type: "number" },
              },
            },
          },
        },
        Product: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            price: { type: "number" },
            category: { type: "string" },
            vendor: { type: "string" },
            images: { type: "array", items: { type: "string" } },
            stock: { type: "integer" },
            isActive: { type: "boolean" },
            averageRating: { type: "number" },
            reviewCount: { type: "integer" },
          },
        },
        Order: {
          type: "object",
          properties: {
            _id: { type: "string" },
            orderNumber: { type: "string" },
            customer: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product: { type: "string" },
                  quantity: { type: "integer" },
                  price: { type: "number" },
                },
              },
            },
            totalAmount: { type: "number" },
            status: {
              type: "string",
              enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
            },
            shippingAddress: { type: "object" },
            paymentMethod: { type: "string" },
            paymentStatus: { type: "string", enum: ["pending", "completed", "failed", "refunded"] },
          },
        },
        Category: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            slug: { type: "string" },
            description: { type: "string" },
            isActive: { type: "boolean" },
            sortOrder: { type: "integer" },
          },
        },
        Review: {
          type: "object",
          properties: {
            _id: { type: "string" },
            product: { type: "string" },
            customer: { type: "string" },
            rating: { type: "integer", minimum: 1, maximum: 5 },
            comment: { type: "string" },
            isApproved: { type: "boolean" },
          },
        },
        Dispute: {
          type: "object",
          properties: {
            _id: { type: "string" },
            order: { type: "string" },
            buyer: { type: "string" },
            seller: { type: "string" },
            reason: { type: "string" },
            status: { type: "string", enum: ["open", "in_progress", "resolved", "closed"] },
            priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
            messages: { type: "array", items: { type: "object" } },
            resolution: { type: "object", nullable: true },
          },
        },
        Payout: {
          type: "object",
          properties: {
            _id: { type: "string" },
            vendor: { type: "string" },
            amount: { type: "number" },
            amountINR: { type: "number" },
            status: { type: "string", enum: ["pending", "processing", "completed", "failed"] },
            bankDetail: { type: "object" },
            razorpayPayoutId: { type: "string" },
          },
        },
        BankDetail: {
          type: "object",
          properties: {
            _id: { type: "string" },
            accountHolderName: { type: "string" },
            accountNumber: { type: "string" },
            ifscCode: { type: "string" },
            bankName: { type: "string" },
            accountType: { type: "string", enum: ["savings", "current"] },
            isDefault: { type: "boolean" },
          },
        },
        Error: {
          type: "object",
          properties: {
            message: { type: "string" },
            error: { type: "string" },
          },
        },
        Success: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Access token is missing or invalid",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        NotFoundError: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        ValidationError: {
          description: "Validation failed",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  errors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        field: { type: "string" },
                        message: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./routes/*.js", "./swagger/*.yaml"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
