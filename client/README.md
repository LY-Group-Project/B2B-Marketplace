# B2B Marketplace - Client

A modern React frontend for the B2B Marketplace platform, built with Vite, Tailwind CSS, and modern React patterns.

## 🚀 Features

- **Modern React 18** with hooks and functional components
- **Vite** for lightning-fast development and builds
- **Tailwind CSS** for utility-first styling
- **React Router v7** for client-side routing
- **TanStack Query** for server state management
- **Zustand** for client state management
- **WebAuthn/Passkey** support for passwordless login
- **Responsive Design** - Mobile-first approach

## 📁 Project Structure

```
client/
├── public/                 # Static assets
├── src/
│   ├── assets/             # Images, fonts, etc.
│   ├── components/         # Reusable UI components
│   │   ├── common/         # Generic components (Button, Input, Modal)
│   │   ├── layout/         # Layout components (Header, Footer, Sidebar)
│   │   ├── product/        # Product-related components
│   │   ├── cart/           # Cart components
│   │   └── ...
│   ├── pages/              # Page components
│   │   ├── Home.jsx        # Landing page
│   │   ├── Products.jsx    # Product listing
│   │   ├── ProductDetail.jsx
│   │   ├── Cart.jsx
│   │   ├── Checkout.jsx
│   │   ├── Orders.jsx
│   │   ├── OrderDetail.jsx
│   │   ├── Profile.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── RegisterPasskey.jsx
│   │   ├── ClaimFunds.jsx
│   │   ├── MyDisputes.jsx
│   │   ├── DisputeChat.jsx
│   │   ├── admin/          # Admin dashboard pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Users.jsx
│   │   │   ├── Vendors.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── Categories.jsx
│   │   │   ├── Payouts.jsx
│   │   │   └── Disputes.jsx
│   │   └── vendor/         # Vendor dashboard pages
│   │       ├── Dashboard.jsx
│   │       ├── Products.jsx
│   │       ├── AddProduct.jsx
│   │       ├── EditProduct.jsx
│   │       ├── Orders.jsx
│   │       └── Settings.jsx
│   ├── services/           # API service functions
│   │   ├── api.js          # Axios instance
│   │   ├── authService.js
│   │   ├── productService.js
│   │   ├── orderService.js
│   │   └── ...
│   ├── store/              # Zustand state stores
│   │   ├── authStore.js    # Authentication state
│   │   ├── cartStore.js    # Shopping cart state
│   │   └── ...
│   ├── helpers/            # Utility functions
│   ├── App.jsx             # Root component
│   ├── App.css             # Global styles
│   ├── main.jsx            # Entry point
│   └── index.css           # Tailwind imports
├── index.html              # HTML template
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind configuration
├── postcss.config.js       # PostCSS configuration
├── eslint.config.js        # ESLint configuration
└── package.json
```

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3 | UI Framework |
| Vite | 6.0 | Build Tool |
| React Router | 7.1 | Routing |
| TanStack Query | 5.90 | Server State |
| Zustand | 4.5 | Client State |
| Tailwind CSS | 3.4 | Styling |
| Framer Motion | 11.11 | Animations |
| React Hook Form | 7.53 | Form Handling |
| React Hot Toast | 2.4 | Notifications |
| Lucide React | 0.460 | Icons |
| Axios | 1.7 | HTTP Client |
| Swiper | 11.1 | Carousels |

## 🚀 Getting Started

### Prerequisites

- Node.js v18 or higher
- npm or yarn

### Installation

1. **Navigate to client directory**
   ```bash
   cd client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment**
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:5173
   ```

## 📦 Available Scripts

```bash
# Start development server with HMR
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint -- --fix
```

## 🎨 Styling

The project uses **Tailwind CSS** for styling. Configuration is in `tailwind.config.js`.

### Custom Theme
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {...},
        secondary: {...},
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
}
```

### Common Patterns
```jsx
// Responsive design
<div className="px-4 md:px-8 lg:px-12">

// Flex layouts
<div className="flex items-center justify-between gap-4">

// Grid layouts
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

// Animations with Framer Motion
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
```

## 🔐 Authentication

The app supports multiple authentication methods:

### JWT Token Authentication
```javascript
// Login with email/password
const { login } = useAuthStore();
await login(email, password);
```

### WebAuthn/Passkey
```javascript
// Register a passkey
await registerPasskey(username);

// Login with passkey
await loginWithPasskey(username);
```

## 📡 API Integration

### API Service Pattern
```javascript
// services/productService.js
import api from './api';

export const getProducts = async (params) => {
  const response = await api.get('/products', { params });
  return response.data;
};

export const createProduct = async (data) => {
  const response = await api.post('/products', data);
  return response.data;
};
```

### Using with TanStack Query
```javascript
import { useQuery, useMutation } from '@tanstack/react-query';
import { getProducts, createProduct } from '../services/productService';

// Query
const { data, isLoading, error } = useQuery({
  queryKey: ['products', filters],
  queryFn: () => getProducts(filters),
});

// Mutation
const mutation = useMutation({
  mutationFn: createProduct,
  onSuccess: () => {
    queryClient.invalidateQueries(['products']);
    toast.success('Product created!');
  },
});
```

## 🔄 State Management

### Zustand Store Example
```javascript
// store/authStore.js
import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  
  login: (userData, token) => set({
    user: userData,
    token,
    isAuthenticated: true,
  }),
  
  logout: () => set({
    user: null,
    token: null,
    isAuthenticated: false,
  }),
}));

export default useAuthStore;
```

## 🛣️ Routing

### Route Structure
```jsx
// App.jsx
<Routes>
  {/* Public Routes */}
  <Route path="/" element={<Home />} />
  <Route path="/products" element={<Products />} />
  <Route path="/products/:id" element={<ProductDetail />} />
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  
  {/* Protected Routes */}
  <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
  <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
  <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
  
  {/* Vendor Routes */}
  <Route path="/vendor/*" element={<VendorRoute><VendorLayout /></VendorRoute>} />
  
  {/* Admin Routes */}
  <Route path="/admin/*" element={<AdminRoute><AdminLayout /></AdminRoute>} />
</Routes>
```

## 📱 Responsive Design

The app follows a mobile-first approach:

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `sm` | 640px | Small tablets |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

## 🧩 Key Components

### Layout Components
- `Header` - Navigation, search, cart
- `Footer` - Links, copyright
- `Sidebar` - Admin/Vendor navigation
- `Layout` - Page wrapper

### Common Components
- `Button` - Styled button variants
- `Input` - Form inputs
- `Modal` - Dialog overlays
- `Card` - Content cards
- `Loading` - Loading spinners
- `Pagination` - Page navigation

### Feature Components
- `ProductCard` - Product display
- `CartItem` - Cart items
- `OrderCard` - Order summary
- `ReviewForm` - Product reviews

## 🔧 Configuration

### Vite Config
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
```

### ESLint Config
```javascript
// eslint.config.js
export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000/api` |
| `VITE_PAYPAL_CLIENT_ID` | PayPal Client ID (optional) | `your-paypal-id` |
| `VITE_RAZORPAY_KEY_ID` | Razorpay Key ID (optional) | `your-razorpay-key` |

## 🤝 Contributing

1. Follow the existing code style
2. Use meaningful component and variable names
3. Add PropTypes or TypeScript types
4. Write clean, readable JSX
5. Use Tailwind CSS utilities
6. Test on mobile and desktop

## 📄 License

MIT License - see LICENSE file for details.
