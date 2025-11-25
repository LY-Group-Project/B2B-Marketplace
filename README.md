# Multivendor E-commerce Marketplace

A comprehensive full-stack multivendor e-commerce platform built with React, Node.js, Express, and MongoDB. This platform allows multiple vendors to sell their products while providing customers with a seamless shopping experience.

## 🚀 Features

### Customer Features
- **User Registration & Authentication** - Secure account creation and login
- **Product Browsing** - Browse products with advanced filtering and search
- **Shopping Cart** - Add/remove items, quantity management
- **Order Management** - Place orders, track order status
- **Product Reviews** - Rate and review products
- **Responsive Design** - Mobile-first, responsive UI

### Vendor Features
- **Vendor Registration** - Apply to become a vendor
- **Product Management** - Add, edit, delete products
- **Inventory Management** - Track stock levels
- **Order Management** - Process customer orders
- **Analytics Dashboard** - View sales and performance metrics
- **Commission System** - Automatic commission calculation

### Admin Features
- **User Management** - Manage customers, vendors, and admins
- **Vendor Approval** - Approve/reject vendor applications
- **Product Moderation** - Review and moderate products
- **Order Oversight** - Monitor all orders across the platform
- **Category Management** - Manage product categories
- **Analytics & Reports** - Platform-wide analytics

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File uploads
- **Cloudinary** - Image storage
- **Stripe** - Payment processing
- **Nodemailer** - Email notifications

### Frontend
- **React 18** - UI library
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **React Hook Form** - Form handling
- **React Hot Toast** - Notifications
- **Lucide React** - Icons
- **Framer Motion** - Animations

## 📁 Project Structure

```
B2B Marketplace/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Zustand stores
│   │   ├── services/       # API services
│   │   └── ...
│   ├── package.json
│   └── ...
├── server/                 # Node.js backend
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   ├── server.js          # Entry point
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd B2B-Marketplace
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Setup**
   
   Create a `.env` file in the server directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/multivendor-ecommerce
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   CLIENT_URL=http://localhost:3000
   
   # Cloudinary (for image uploads)
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   
   # Stripe (for payments)
   STRIPE_SECRET_KEY=your-stripe-secret-key
   STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
   
   # Email (for notifications)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

   Create a `.env` file in the client directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

5. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on your system
   mongod
   ```

6. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```

7. **Start the frontend development server**
   ```bash
   cd client
   npm run dev
   ```

8. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 🔧 Available Scripts

### Backend Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
```

### Frontend Scripts
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

## 📊 Database Models

### User Model
- Customer, Vendor, Admin roles
- Authentication and profile data
- Vendor-specific business information
- Commission and approval status

### Product Model
- Product details and pricing
- Inventory management
- Image galleries
- SEO optimization
- Vendor association

### Order Model
- Order processing and tracking
- Multi-vendor order splitting
- Payment and shipping information
- Status management

### Category Model
- Hierarchical category structure
- SEO-friendly slugs
- Active/inactive status

## 🔐 Authentication & Authorization

- **JWT-based authentication** for secure API access
- **Role-based access control** (Customer, Vendor, Admin)
- **Protected routes** on both frontend and backend
- **Password hashing** with bcryptjs
- **Session management** with secure tokens

## 💳 Payment Integration

- **Stripe integration** for secure payments
- **Multiple payment methods** support
- **Commission calculation** for vendors
- **Order splitting** for multi-vendor orders

## 📱 Responsive Design

- **Mobile-first approach** with Tailwind CSS
- **Responsive grid layouts** for all screen sizes
- **Touch-friendly interfaces** for mobile devices
- **Progressive Web App** features

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or your preferred MongoDB hosting
2. Configure environment variables
3. Deploy to platforms like Heroku, DigitalOcean, or AWS

### Frontend Deployment
1. Build the production bundle: `npm run build`
2. Deploy to platforms like Vercel, Netlify, or AWS S3

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add some feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Advanced search with Elasticsearch
- [ ] AI-powered product recommendations
- [ ] Live chat support
- [ ] Advanced inventory management
- [ ] Subscription-based vendor plans
- [ ] API rate limiting and monitoring

---

**Note**: This is a comprehensive multivendor e-commerce platform with all essential features. The codebase is production-ready and follows best practices for security, scalability, and maintainability.

