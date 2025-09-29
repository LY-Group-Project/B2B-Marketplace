import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Categories from './pages/Categories';

// Vendor Pages
import VendorDashboard from './pages/vendor/Dashboard';
import VendorProducts from './pages/vendor/Products';
import VendorOrders from './pages/vendor/Orders';
import VendorOrderDetail from './pages/vendor/OrderDetail';
import VendorProfile from './pages/vendor/Profile';
import AddProduct from './pages/vendor/AddProduct';
import EditProduct from './pages/vendor/EditProduct';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminCategories from './pages/admin/Categories';
import AdminVendorManagement from './pages/admin/VendorManagement';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes with Layout */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="products" element={<Products />} />
                <Route path="products/:id" element={<ProductDetail />} />
                <Route path="categories" element={<Categories />} />
                <Route path="cart" element={<Cart />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                <Route path="orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
                
                {/* Vendor Routes */}
                <Route path="vendor" element={<ProtectedRoute requiredRole="vendor"><VendorDashboard /></ProtectedRoute>} />
                <Route path="vendor/products" element={<ProtectedRoute requiredRole="vendor"><VendorProducts /></ProtectedRoute>} />
                <Route path="vendor/products/new" element={<ProtectedRoute requiredRole="vendor"><AddProduct /></ProtectedRoute>} />
                <Route path="vendor/products/:id/edit" element={<ProtectedRoute requiredRole="vendor"><EditProduct /></ProtectedRoute>} />
                <Route path="vendor/orders" element={<ProtectedRoute requiredRole="vendor"><VendorOrders /></ProtectedRoute>} />
                <Route path="vendor/orders/:id" element={<ProtectedRoute requiredRole="vendor"><VendorOrderDetail /></ProtectedRoute>} />
                <Route path="vendor/profile" element={<ProtectedRoute requiredRole="vendor"><VendorProfile /></ProtectedRoute>} />
                
                {/* Admin Routes */}
                <Route path="admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
                <Route path="admin/users" element={<ProtectedRoute requiredRole="admin"><AdminUsers /></ProtectedRoute>} />
                <Route path="admin/vendors" element={<ProtectedRoute requiredRole="admin"><AdminVendorManagement /></ProtectedRoute>} />
                <Route path="admin/products" element={<ProtectedRoute requiredRole="admin"><AdminProducts /></ProtectedRoute>} />
                <Route path="admin/orders" element={<ProtectedRoute requiredRole="admin"><AdminOrders /></ProtectedRoute>} />
                <Route path="admin/categories" element={<ProtectedRoute requiredRole="admin"><AdminCategories /></ProtectedRoute>} />
              </Route>
            </Routes>
            
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#22c55e',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
