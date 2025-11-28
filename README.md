# B2B Marketplace

<div align="center">

![B2B Marketplace](https://img.shields.io/badge/B2B-Marketplace-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-4.4+-green?style=for-the-badge&logo=mongodb)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue?style=for-the-badge&logo=solidity)

A comprehensive full-stack multivendor B2B e-commerce platform with blockchain-based escrow, secure payment processing, and advanced vendor management.

[Features](#-features) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [API Docs](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 🌟 Features

### 🛒 Customer Features
- **User Registration & Authentication** - Secure JWT-based auth with WebAuthn/Passkey support
- **Product Browsing** - Advanced search, filtering, and category navigation
- **Shopping Cart** - Persistent cart with quantity management
- **Order Management** - Place orders, track shipments, view order history
- **Product Reviews** - Rate and review purchased products
- **Multiple Payment Options** - PayPal, Razorpay (UPI, Cards, Netbanking)
- **Blockchain Escrow** - Secure transactions with KooshCoin tokens
- **Responsive Design** - Mobile-first, works on all devices

### 🏪 Vendor Features
- **Vendor Registration** - Apply to become a vendor with business verification
- **Product Management** - Full CRUD operations with image uploads
- **Inventory Management** - Track stock levels and low-stock alerts
- **Order Processing** - Manage incoming orders, update status, add tracking
- **Analytics Dashboard** - Sales, revenue, and performance metrics
- **Commission System** - Transparent commission tracking
- **Automated Payouts** - Direct bank transfers via Razorpay
- **Dispute Management** - Handle customer disputes with chat support

### 👑 Admin Features
- **Dashboard Analytics** - Platform-wide statistics and insights
- **User Management** - Manage customers, vendors, and admins
- **Vendor Approval** - Review and approve vendor applications
- **Product Moderation** - Review and moderate product listings
- **Order Oversight** - Monitor all platform orders
- **Category Management** - Create and manage product categories
- **Payout Management** - Monitor and manage vendor payouts
- **Dispute Resolution** - Mediate disputes and resolve issues

### 🔗 Blockchain Features
- **KooshCoin Token** - Platform's native ERC20 token
- **Smart Contract Escrow** - Secure fund holding during transactions
- **Automatic Release** - Funds released after delivery confirmation
- **Dispute Resolution** - Admin-mediated blockchain dispute resolution
- **Token Burning** - Convert tokens to fiat via bank payout

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| Vite | Build Tool |
| React Router v7 | Client-side Routing |
| TanStack Query | Server State Management |
| Zustand | Client State Management |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| React Hook Form | Form Handling |
| Lucide React | Icons |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express.js | Web Framework |
| MongoDB | Database |
| Mongoose | ODM |
| JWT | Authentication |
| WebAuthn | Passwordless Auth |
| Swagger/OpenAPI | API Documentation |

### Payments & Blockchain
| Technology | Purpose |
|------------|---------|
| PayPal SDK | International Payments |
| Razorpay | Indian Payment Gateway |
| Razorpay Payouts | Vendor Bank Transfers |
| Solidity | Smart Contracts |
| Web3.js | Blockchain Integration |
| Hardhat | Smart Contract Development |

### DevOps & Tools
| Technology | Purpose |
|------------|---------|
| ImgBB | Image Hosting |
| Nodemailer | Email Service |
| PDFKit | Invoice Generation |
| Morgan | HTTP Logging |
| Helmet | Security Headers |

## 📁 Project Structure

```
b2b-marketplace/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components
│   │   │   ├── admin/         # Admin dashboard pages
│   │   │   └── vendor/        # Vendor dashboard pages
│   │   ├── store/             # Zustand state stores
│   │   ├── services/          # API service functions
│   │   ├── helpers/           # Utility functions
│   │   └── assets/            # Static assets
│   ├── public/                # Public static files
│   └── package.json
│
├── server/                    # Node.js Backend
│   ├── config/                # Configuration files
│   ├── controllers/           # Route controllers
│   ├── middleware/            # Express middleware
│   ├── models/                # Mongoose models
│   ├── routes/                # API routes
│   ├── services/              # Business logic services
│   ├── swagger/               # OpenAPI documentation
│   ├── templates/             # Email templates
│   ├── utils/                 # Utility functions
│   └── package.json
│
├── solidity/                  # Smart Contracts
│   ├── contracts/             # Solidity contracts
│   │   ├── KooshCoin.sol      # ERC20 Token
│   │   ├── Escrow.sol         # Escrow logic
│   │   ├── EscrowFactory.sol  # Escrow deployment
│   │   └── KooshBurner.sol    # Token burning
│   ├── scripts/               # Deployment scripts
│   ├── test/                  # Contract tests
│   └── package.json
│
└── package.json               # Root package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js v18 or higher
- MongoDB v4.4 or higher
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/The-Parth/b2b-marketplace.git
   cd b2b-marketplace
   ```

2. **Install all dependencies**
   ```bash
   # Install root dependencies
   npm install

   # Install server dependencies
   cd server && npm install && cd ..

   # Install client dependencies
   cd client && npm install && cd ..

   # Install solidity dependencies (optional)
   cd solidity && npm install && cd ..
   ```

3. **Configure environment variables**

   Create `server/.env`:
   ```env
   NODE_ENV=development
   PORT=5000
   HOST=localhost
   HOST_URL=http://localhost:5173
   CLIENT_URL=http://localhost:5173
   MONGO_URI=mongodb://localhost:27017/b2b-marketplace
   JWT_SECRET=your-super-secret-jwt-key

   # PayPal
   PAYPAL_CLIENT_ID=your-paypal-client-id
   PAYPAL_CLIENT_SECRET=your-paypal-client-secret
   PAYPAL_MODE=sandbox

   # Razorpay
   RAZORPAY_KEY_ID=your-razorpay-key-id
   RAZORPAY_KEY_SECRET=your-razorpay-key-secret

   # ImgBB
   IMGBB_API_KEY=your-imgbb-api-key

   # Email (Gmail)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

   Create `client/.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Start MongoDB**
   ```bash
   mongod
   ```

5. **Run the application**
   ```bash
   # From root directory - run both client and server
   npm run both

   # Or run separately:
   npm run server  # Start backend on port 5000
   npm run client  # Start frontend on port 5173
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api-docs

## 📖 API Documentation

### Interactive Documentation
Access the Swagger UI at: **http://localhost:5000/api-docs**

### API Endpoints Summary

| Module | Base Path | Description |
|--------|-----------|-------------|
| Authentication | `/api/auth` | User registration, login, profile |
| WebAuthn | `/api/webauth` | Passkey authentication |
| Products | `/api/products` | Product CRUD operations |
| Orders | `/api/orders` | Order management |
| Categories | `/api/categories` | Category management |
| Vendors | `/api/vendors` | Vendor management |
| Admin | `/api/admin` | Admin operations |
| Reviews | `/api/reviews` | Product reviews |
| PayPal | `/api/paypal` | PayPal payments |
| Razorpay | `/api/razorpay` | Razorpay payments |
| Escrow | `/api/escrows` | Blockchain escrow |
| Payouts | `/api/payouts` | Vendor payouts |
| Disputes | `/api/disputes` | Dispute management |
| Invoices | `/api/invoices` | Invoice generation |
| Upload | `/api/upload` | Image uploads |
| Images | `/api/images` | Image proxy/cache |

For detailed API documentation, see [Server README](./server/README.md).

## 🔧 Available Scripts

### Root Directory
```bash
npm run client    # Start frontend development server
npm run server    # Start backend development server
npm run both      # Start both client and server
```

### Client Directory
```bash
npm run dev       # Start Vite development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

### Server Directory
```bash
npm start         # Start production server
npm run dev       # Start development server with nodemon
```

### Solidity Directory
```bash
npx hardhat compile    # Compile contracts
npx hardhat test       # Run tests
npx hardhat node       # Start local blockchain
npx hardhat run scripts/deploy.js  # Deploy contracts
```

## 🔐 Security Features

- **JWT Authentication** with secure token handling
- **WebAuthn/Passkey** for passwordless authentication
- **Password Hashing** with bcryptjs
- **Rate Limiting** to prevent abuse
- **Helmet.js** for HTTP security headers
- **CORS** properly configured
- **Input Validation** with express-validator
- **Blockchain Escrow** for secure transactions

## 💰 Payment Flow

### Standard Payment (PayPal/Razorpay)
1. Customer adds items to cart
2. Customer proceeds to checkout
3. Customer selects payment method
4. Payment is processed
5. Order is created
6. Vendor receives notification
7. Vendor ships product
8. Order marked as delivered

### Escrow Payment (KooshCoin)
1. Customer creates order with escrow
2. KooshCoin tokens locked in smart contract
3. Vendor ships product
4. Customer confirms delivery
5. Tokens released to vendor
6. Vendor can claim funds to bank account

## 🚢 Deployment

### Backend (Recommended Platforms)
- Heroku
- DigitalOcean App Platform
- AWS EC2/ECS
- Railway

### Frontend (Recommended Platforms)
- Vercel (recommended for Vite)
- Netlify
- AWS S3 + CloudFront

### Database
- MongoDB Atlas (recommended)
- Self-hosted MongoDB

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- Create an issue in the repository
- Check the [API Documentation](http://localhost:5000/api-docs)
- Read the [Server README](./server/README.md) for detailed backend info
- Read the [Client README](./client/README.md) for frontend details
- Read the [Solidity README](./solidity/README.md) for smart contract info

---

<div align="center">
Made with ❤️ by the B2B Marketplace Team
</div>
