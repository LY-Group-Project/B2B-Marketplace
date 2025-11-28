# B2B Marketplace - Server

A robust Node.js/Express backend for a multivendor B2B e-commerce platform with blockchain-based escrow, multiple payment gateways, and comprehensive vendor management.

## 🚀 Features

### Core Features
- **RESTful API** - Well-structured REST API with comprehensive documentation
- **JWT Authentication** - Secure token-based authentication with role-based access control
- **WebAuthn/Passkey Support** - Passwordless authentication using FIDO2/WebAuthn
- **MongoDB Database** - Flexible NoSQL database with Mongoose ODM

### Payment Integration
- **PayPal** - Full PayPal Checkout integration for international payments
- **Razorpay** - Indian payment gateway with UPI, cards, and netbanking support
- **Blockchain Escrow** - KooshCoin token-based escrow system for secure transactions

### Vendor Management
- **Vendor Registration & Approval** - Admin-controlled vendor onboarding
- **Commission System** - Automatic commission calculation and tracking
- **Automated Payouts** - Razorpay payout integration with bank transfers
- **Analytics Dashboard** - Sales, orders, and revenue tracking

### Order Management
- **Multi-vendor Orders** - Support for orders spanning multiple vendors
- **Order Tracking** - Integration with shipping carriers for real-time tracking
- **Invoice Generation** - PDF invoice generation with PDFKit

### Dispute Resolution
- **Dispute System** - Built-in dispute management with chat functionality
- **Image Proofs** - Upload and share proof images in disputes
- **Admin Mediation** - Admin-controlled dispute resolution

### Security
- **Helmet.js** - HTTP security headers
- **Rate Limiting** - Configurable request rate limiting
- **Input Validation** - Express-validator for request validation
- **CORS Configuration** - Flexible cross-origin resource sharing

## 📁 Project Structure

```
server/
├── config/
│   └── swagger.js           # Swagger/OpenAPI configuration
├── controllers/
│   ├── addressController.js # Address autocomplete
│   ├── adminController.js   # Admin operations
│   ├── authController.js    # Authentication
│   ├── disputeController.js # Dispute management
│   ├── escrowController.js  # Blockchain escrow
│   ├── invoiceController.js # Invoice generation
│   ├── orderController.js   # Order management
│   ├── payoutController.js  # Vendor payouts
│   ├── paypalController.js  # PayPal integration
│   ├── productController.js # Product CRUD
│   ├── razorpayController.js# Razorpay integration
│   └── vendorController.js  # Vendor management
├── middleware/
│   ├── auth.js              # JWT authentication
│   ├── upload.js            # File upload handling
│   └── validation.js        # Request validation
├── models/
│   ├── bankDetailModel.js   # Bank account details
│   ├── burnRecordModel.js   # Token burn records
│   ├── cartModel.js         # Shopping cart
│   ├── categoryModel.js     # Product categories
│   ├── couponModel.js       # Discount coupons
│   ├── disputeModel.js      # Disputes
│   ├── orderModel.js        # Orders
│   ├── PasskeyAuth.js       # WebAuthn credentials
│   ├── payoutModel.js       # Vendor payouts
│   ├── productModel.js      # Products
│   ├── reviewModel.js       # Product reviews
│   ├── userModel.js         # Users
│   └── web3KeyModel.js      # Blockchain keys
├── routes/
│   ├── address.js           # /api/address
│   ├── admin.js             # /api/admin
│   ├── auth.js              # /api/auth
│   ├── categories.js        # /api/categories
│   ├── disputes.js          # /api/disputes
│   ├── escrows.js           # /api/escrows
│   ├── images.js            # /api/images
│   ├── invoices.js          # /api/invoices
│   ├── orders.js            # /api/orders
│   ├── payouts.js           # /api/payouts
│   ├── paypal.js            # /api/paypal
│   ├── products.js          # /api/products
│   ├── razorpay.js          # /api/razorpay
│   ├── reviews.js           # /api/reviews
│   ├── upload.js            # /api/upload
│   ├── vendors.js           # /api/vendors
│   └── webAuth.js           # /api/webauth
├── services/
│   ├── burnVerificationService.js # Token burn verification
│   ├── escrowService.js     # Escrow blockchain operations
│   ├── mailerService.js     # Email sending
│   ├── razorpayPayoutService.js # Payout processing
│   ├── tokenBurnService.js  # Token burning
│   └── trackingService.js   # Shipment tracking
├── swagger/
│   ├── admin.yaml           # Admin API documentation
│   ├── auth.yaml            # Auth API documentation
│   ├── disputes.yaml        # Disputes API documentation
│   ├── escrow-payouts.yaml  # Escrow & Payouts documentation
│   ├── orders.yaml          # Orders API documentation
│   ├── other.yaml           # Other endpoints documentation
│   ├── payments.yaml        # Payments API documentation
│   ├── products.yaml        # Products API documentation
│   ├── vendors.yaml         # Vendors API documentation
│   └── webauth.yaml         # WebAuthn API documentation
├── templates/               # Email templates (HTML)
├── uploads/                 # Local file uploads
├── utils/
│   └── crypto.js            # Cryptographic utilities
├── server.js                # Application entry point
└── package.json
```

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Authentication | JWT, bcryptjs, @simplewebauthn/server |
| Validation | express-validator |
| Security | helmet, express-rate-limit, cors |
| Payments | PayPal SDK, Razorpay SDK |
| Blockchain | Web3.js |
| File Upload | Multer, ImgBB API |
| Email | Nodemailer |
| PDF Generation | PDFKit |
| Documentation | Swagger/OpenAPI 3.0 |
| Logging | Morgan |

## 🚀 Getting Started

### Prerequisites

- Node.js v16 or higher
- MongoDB v4.4 or higher
- npm or yarn

### Installation

1. **Navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables** (see Configuration section below)

5. **Start the server**
   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

## ⚙️ Configuration

Create a `.env` file in the server directory with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
HOST=localhost
HOST_URL=http://localhost:5173

# Database
MONGO_URI=mongodb://localhost:27017/b2b-marketplace

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Client URL (for CORS and emails)
CLIENT_URL=http://localhost:5173

# PayPal Configuration
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=sandbox  # or 'live' for production

# Razorpay Configuration
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

# ImgBB (Image Hosting)
IMGBB_API_KEY=your-imgbb-api-key

# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="B2B Marketplace <noreply@b2bmarketplace.com>"

# Blockchain Configuration (Optional)
WEB3_PROVIDER_URL=https://sepolia.infura.io/v3/your-project-id
KOOSH_TOKEN_ADDRESS=0x...
ESCROW_FACTORY_ADDRESS=0x...
ADMIN_PRIVATE_KEY=your-admin-private-key
```

## 📖 API Documentation

### Swagger UI
Access the interactive API documentation at:
```
http://localhost:5000/api-docs
```

### API Endpoints Overview

#### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register new user | ❌ |
| POST | `/login` | User login | ❌ |
| GET | `/me` | Get current user | ✅ |
| PUT | `/profile` | Update profile | ✅ |
| PUT | `/change-password` | Change password | ✅ |
| PUT | `/deactivate` | Deactivate account | ✅ |
| GET | `/web3-key` | Get blockchain key | ✅ |

#### WebAuthn (`/api/webauth`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Start passkey registration | ✅ |
| POST | `/verify-registration` | Complete passkey registration | ❌ |
| POST | `/login` | Start passkey login | ❌ |
| POST | `/verify-login` | Complete passkey login | ❌ |

#### Products (`/api/products`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List all products | ❌ |
| GET | `/featured` | Get featured products | ❌ |
| GET | `/vendor/my-products` | Get vendor's products | 🏪 |
| GET | `/:id` | Get product details | ❌ |
| GET | `/:id/related` | Get related products | ❌ |
| POST | `/` | Create product | 🏪 |
| PUT | `/:id` | Update product | 🏪 |
| DELETE | `/:id` | Delete product | 🏪 |
| PATCH | `/:id/status` | Update product status | 🏪 |

#### Orders (`/api/orders`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create order | ✅ |
| GET | `/my-orders` | Get user's orders | ✅ |
| GET | `/vendor/my-orders` | Get vendor's orders | 🏪 |
| GET | `/admin/all` | Get all orders | 👑 |
| GET | `/:id` | Get order details | ✅ |
| PATCH | `/:id/status` | Update order status | 🏪 |
| PATCH | `/:id/cancel` | Cancel order | ✅ |
| GET | `/:id/tracking` | Get tracking info | ✅ |
| GET | `/carriers/supported` | List carriers | ❌ |

#### Vendors (`/api/vendors`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/admin/all` | Get all vendors | 👑 |
| GET | `/admin/:id` | Get vendor details | 👑 |
| PATCH | `/admin/:id/status` | Update vendor status | 👑 |
| PATCH | `/profile` | Update vendor profile | 🏪 |
| GET | `/stats` | Get vendor statistics | 🏪 |
| GET | `/orders` | Get vendor orders | 🏪 |

#### Admin (`/api/admin`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/dashboard` | Get dashboard stats | 👑 |
| GET | `/users` | Get all users | 👑 |
| PATCH | `/users/:id/status` | Update user status | 👑 |
| GET | `/vendors` | Get all vendors | 👑 |
| PATCH | `/vendors/:id/status` | Update vendor approval | 👑 |
| GET | `/products` | Get all products | 👑 |
| PATCH | `/products/:id/status` | Update product status | 👑 |
| GET | `/orders` | Get all orders | 👑 |
| GET | `/categories` | Get all categories | 👑 |
| GET | `/payouts` | Get all payouts | 👑 |
| GET | `/payouts/pending` | Get pending payouts | 👑 |
| POST | `/payouts/:id/complete` | Mark payout complete | 👑 |
| PATCH | `/payouts/:id/status` | Update payout status | 👑 |
| POST | `/payouts/:id/retry` | Retry failed payout | 👑 |

#### Categories (`/api/categories`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get all categories | ❌ |
| GET | `/:id` | Get category | ❌ |
| POST | `/` | Create category | 👑 |
| POST | `/vendor` | Create category (vendor) | 🏪 |
| PUT | `/:id` | Update category | 👑 |
| DELETE | `/:id` | Delete category | 👑 |

#### Reviews (`/api/reviews`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/product/:productId` | Get product reviews | ❌ |
| GET | `/user/:productId` | Get user's review | ✅ |
| POST | `/` | Create review | ✅ |
| PUT | `/:reviewId` | Update review | ✅ |
| DELETE | `/:reviewId` | Delete review | ✅ |

#### PayPal (`/api/paypal`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/client-id` | Get PayPal client ID | ❌ |
| POST | `/create-order` | Create PayPal order | ✅ |
| POST | `/capture-order/:orderID` | Capture payment | ✅ |

#### Razorpay (`/api/razorpay`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/key-id` | Get Razorpay key ID | ❌ |
| POST | `/create-order` | Create Razorpay order | ✅ |
| POST | `/verify-payment` | Verify payment | ✅ |

#### Escrow (`/api/escrows`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/wallet` | Get wallet info | ✅ |
| POST | `/` | Create escrow | ✅ |
| GET | `/:orderId` | Get escrow details | ✅ |
| POST | `/:orderId/confirm-delivery` | Confirm delivery (buyer) | ✅ |
| POST | `/:orderId/release` | Release funds (seller) | ✅ |
| POST | `/:orderId/dispute` | Raise dispute | ✅ |
| POST | `/:orderId/resolve` | Resolve dispute | 👑 |

#### Payouts (`/api/payouts`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/balance` | Get token balance | ✅ |
| GET | `/bank-details` | Get bank details | ✅ |
| POST | `/bank-details` | Add bank detail | ✅ |
| DELETE | `/bank-details/:id` | Delete bank detail | ✅ |
| PATCH | `/bank-details/:id/default` | Set default bank | ✅ |
| POST | `/claim` | Claim funds (burn tokens) | ✅ |
| GET | `/claims` | Get claim history | ✅ |
| GET | `/claims/:id` | Get claim details | ✅ |
| GET | `/burns` | Get burn history | ✅ |
| POST | `/burns/:id/retry` | Retry failed burn | ✅ |
| POST | `/burns/:id/verify` | Verify burn status | ✅ |
| POST | `/webhook/razorpay` | Razorpay webhook | ❌ |
| GET | `/admin/pending` | Get pending payouts | 👑 |
| POST | `/admin/:id/retry` | Retry payout | 👑 |

#### Disputes (`/api/disputes`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get disputes | ✅ |
| POST | `/` | Create dispute | ✅ |
| GET | `/proofs/:filename` | Get proof image | ❌ |
| GET | `/:id` | Get dispute | ✅ |
| GET | `/order/:orderId` | Get dispute by order | ✅ |
| POST | `/:id/messages` | Send message | ✅ |
| POST | `/:id/resolve` | Resolve dispute | 👑 |
| PATCH | `/:id/priority` | Update priority | 👑 |
| PATCH | `/:id/assign` | Assign admin | 👑 |
| POST | `/:id/close` | Close dispute | ✅ |

#### Invoices (`/api/invoices`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/:id/pdf` | Download PDF invoice | ✅ |
| GET | `/:id/html` | Get HTML invoice | ✅ |

#### Upload (`/api/upload`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/images` | Upload multiple images | ✅ |
| POST | `/image` | Upload single image | ✅ |

#### Images (`/api/images`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/:imageId/:filename` | Get proxied image | ❌ |
| GET | `/cache/stats` | Get cache stats | ❌ |
| DELETE | `/cache/clear` | Clear cache | ❌ |

#### Address (`/api/address`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/autocomplete` | Address autocomplete | ❌ |

#### Health (`/api/health`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Health check | ❌ |

**Legend:**
- ❌ No authentication required
- ✅ User authentication required
- 🏪 Vendor authentication required
- 👑 Admin authentication required

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Roles
- **Customer**: Regular users who can browse and purchase
- **Vendor**: Sellers who can list products and manage orders
- **Admin**: Platform administrators with full access

## 📧 Email Templates

The server includes HTML email templates for:
- `signup-welcome.html` - Welcome email after registration
- `email-verification.html` - Email verification link
- `login-notification.html` - New login notification
- `order-notification.html` - New order notification
- `order-status.html` - Order status updates
- `passkey-registration.html` - Passkey registration confirmation
- `payout-initiated.html` - Payout initiated notification
- `payout-completed.html` - Payout completed notification
- `fund-hold.html` - Escrow funds held
- `fund-release.html` - Escrow funds released
- `dispute-update.html` - Dispute status updates

## 🔧 Available Scripts

```bash
# Start production server
npm start

# Start development server with nodemon
npm run dev

# Run tests
npm test
```

## 🚀 Deployment

### Environment Variables
Ensure all required environment variables are set in production.

### Security Checklist
- [ ] Set strong `JWT_SECRET`
- [ ] Enable HTTPS
- [ ] Configure proper CORS origins
- [ ] Set `NODE_ENV=production`
- [ ] Use production payment credentials
- [ ] Enable rate limiting
- [ ] Set up proper logging

### Recommended Platforms
- **Heroku** - Easy deployment with MongoDB Atlas
- **DigitalOcean App Platform** - Scalable containerized deployment
- **AWS EC2/ECS** - Enterprise-grade hosting
- **Railway** - Modern PaaS with MongoDB support

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🆘 Support

- Create an issue in the repository
- Check the API documentation at `/api-docs`
- Review the [API Documentation](#api-documentation) section
