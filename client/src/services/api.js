import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth-storage");
    if (token) {
      try {
        const authData = JSON.parse(token);
        if (authData.state?.token) {
          config.headers.Authorization = `Bearer ${authData.state.token}`;
        }
      } catch (error) {
        console.error("Error parsing auth token:", error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data on unauthorized
      localStorage.removeItem("auth-storage");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  getCurrentUser: () => api.get("/auth/me"),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (userData) => api.put("/auth/profile", userData),
  changePassword: (passwordData) =>
    api.put("/auth/change-password", passwordData),
  deactivateAccount: () => api.put("/auth/deactivate"),
  webauthLogin: (email) => api.post("/webauth/login", { username: email }),
  webauthVerify: (username, assertion) =>
    api.post("/webauth/verify-login", { username, assertion }),
  webauthRegister: (username) => api.post("/webauth/register", { username }),

  webauthVerifyRegistration: (username, credential) =>
    api.post("/webauth/verify-registration", {
      username,
      credential,
    }),
};

// Products API
export const productsAPI = {
  getProducts: (params) => api.get("/products", { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  getFeaturedProducts: (params) => api.get("/products/featured", { params }),
  getRelatedProducts: (id, params) =>
    api.get(`/products/${id}/related`, { params }),
  createProduct: (productData) => api.post("/products", productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  getVendorProducts: (params) =>
    api.get("/products/vendor/my-products", { params }),
  updateProductStatus: (id, status) =>
    api.patch(`/products/${id}/status`, status),
};

// Search API
export const searchAPI = {
  searchProducts: (params) => api.get("/products", { params }),
  searchSuggestions: (query) =>
    api.get(`/products?search=${encodeURIComponent(query)}&limit=5`),
};

// Categories API
export const categoriesAPI = {
  getCategories: () => api.get("/categories"),
  getCategory: (id) => api.get(`/categories/${id}`),
  createCategory: (categoryData) => api.post("/categories", categoryData),
  createVendorCategory: (categoryData) =>
    api.post("/categories/vendor", categoryData),
  updateCategory: (id, categoryData) =>
    api.put(`/categories/${id}`, categoryData),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};

// Orders API
export const ordersAPI = {
  createOrder: (orderData) => api.post("/orders", orderData),
  getUserOrders: (params) => api.get("/orders/my-orders", { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id) => api.patch(`/orders/${id}/cancel`),
  getVendorOrders: (params) => api.get("/orders/vendor/my-orders", { params }),
  updateOrderStatus: (id, statusData) =>
    api.patch(`/orders/${id}/status`, statusData),
  getAllOrders: (params) => api.get("/orders/admin/all", { params }),
};

// Reviews API
export const reviewsAPI = {
  getProductReviews: (productId, params) =>
    api.get(`/reviews/product/${productId}`, { params }),
  createReview: (reviewData) => api.post("/reviews", reviewData),
  updateReview: (id, reviewData) => api.put(`/reviews/${id}`, reviewData),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
  getUserReviews: (params) => api.get("/reviews/my-reviews", { params }),
};

// Coupons API
export const couponsAPI = {
  getCoupons: (params) => api.get("/coupons", { params }),
  getCoupon: (id) => api.get(`/coupons/${id}`),
  validateCoupon: (code) => api.post("/coupons/validate", { code }),
  createCoupon: (couponData) => api.post("/coupons", couponData),
  updateCoupon: (id, couponData) => api.put(`/coupons/${id}`, couponData),
  deleteCoupon: (id) => api.delete(`/coupons/${id}`),
};

// Upload API
export const uploadAPI = {
  uploadImage: (formData) =>
    api.post("/upload/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  uploadMultipleImages: (formData) =>
    api.post("/upload/images", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
};

// Cart API (placeholder for future cart sync with backend)
export const cartAPI = {
  syncCart: (cartData) => api.post("/cart/sync", cartData),
  getCart: () => api.get("/cart"),
  clearCart: () => api.delete("/cart"),
};

// Vendor API
export const vendorAPI = {
  getAllVendors: (params) => api.get("/vendors/admin/all", { params }),
  getVendorDetails: (id) => api.get(`/vendors/admin/${id}`),
  updateVendorStatus: (id, data) =>
    api.patch(`/vendors/admin/${id}/status`, data),
  updateVendorProfile: (data) => api.patch("/vendors/profile", data),
  getVendorStats: () => api.get("/vendors/stats"),
  getVendorOrders: (params) => api.get("/vendors/orders", { params }),
};

// Admin API
export const adminAPI = {
  getDashboardStats: () => api.get("/admin/dashboard"),

  // Users management
  getAllUsers: (params) => api.get("/admin/users", { params }),
  updateUserStatus: (id, data) => api.patch(`/admin/users/${id}/status`, data),

  // Products management
  getAllProducts: (params) => api.get("/admin/products", { params }),
  updateProductStatus: (id, data) =>
    api.patch(`/admin/products/${id}/status`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),

  // Orders management
  getAllOrders: (params) => api.get("/admin/orders", { params }),
  updateOrderStatus: (id, data) =>
    api.patch(`/admin/orders/${id}/status`, data),

  // Categories management
  getCategories: () => api.get("/categories"),
  createCategory: (data) => api.post("/categories", data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),

  // Vendors management
  getAllVendors: (params) => api.get("/admin/vendors", { params }),
  updateVendorStatus: (id, data) =>
    api.patch(`/admin/vendors/${id}/status`, data),
};

export default api;
