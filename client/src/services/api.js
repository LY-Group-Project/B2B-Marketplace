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
    const status = error.response?.status;
    const code = error.response?.data?.code;
    // On auth errors, clear auth data but don't force redirect here.
    // Let the client (AuthLoader / route guards) handle navigation to login
    if (status === 401 || (status === 403 && code === "ACCOUNT_SUSPENDED")) {
      try {
        localStorage.removeItem("auth-storage");
      } catch (e) {
        /* ignore */
      }
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
  getWeb3Key: () => api.get("/auth/web3-key"),
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

// Address autocomplete (proxied through server)
export const addressAPI = {
  autocomplete: (query, country) => api.get(`/address/autocomplete`, { params: { q: query, country } }),
};

// PayPal API
export const paypalAPI = {
  getClientId: () => api.get("/paypal/client-id"),
  createOrder: (orderData) => api.post("/paypal/create-order", orderData),
  captureOrder: (orderID, orderData) => api.post(`/paypal/capture-order/${orderID}`, orderData),
};

// Razorpay API
export const razorpayAPI = {
  getKeyId: () => api.get("/razorpay/key-id"),
  createOrder: (orderData) => api.post("/razorpay/create-order", orderData),
  verifyPayment: (paymentData) => api.post("/razorpay/verify-payment", paymentData),
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

  // Payouts management
  getPayouts: (params) => api.get("/admin/payouts", { params }),
  markPayoutComplete: (data) => api.post(`/admin/payouts/${data.payoutId}/complete`, data),
  markPayoutFailed: (payoutId, reason) => api.patch(`/admin/payouts/${payoutId}/status`, { status: "failed", failureReason: reason }),
};

// Escrow API (Web3 Integration)
export const escrowAPI = {
  // Get user's blockchain wallet info
  getWallet: () => api.get("/escrows/wallet"),
  // Create escrow for an order
  createEscrow: (orderId) => api.post("/escrows", { orderId }),
  // Get escrow details for an order
  getEscrow: (orderId) => api.get(`/escrows/${orderId}`),
  // Confirm delivery (buyer action)
  confirmDelivery: (orderId) => api.post(`/escrows/${orderId}/confirm-delivery`),
  // Release funds (seller action)
  releaseFunds: (orderId) => api.post(`/escrows/${orderId}/release`),
  // Raise dispute (buyer or seller) - DEPRECATED: Use disputeAPI.createDispute instead
  raiseDispute: (orderId) => api.post(`/escrows/${orderId}/dispute`),
  // Resolve dispute (admin only) - DEPRECATED: Use disputeAPI.resolveDispute instead
  resolveDispute: (orderId, winner) => api.post(`/escrows/${orderId}/resolve`, { winner }),
};

// Dispute API (Chat-based dispute management)
export const disputeAPI = {
  // Get all disputes (users see their own, admins see all)
  getDisputes: (params) => api.get("/disputes", { params }),
  // Get dispute by ID
  getDispute: (id) => api.get(`/disputes/${id}`),
  // Get dispute by order ID
  getDisputeByOrder: (orderId) => api.get(`/disputes/order/${orderId}`),
  // Create a new dispute
  createDispute: (orderId, reason) => api.post("/disputes", { orderId, reason }),
  // Send a message in dispute chat
  sendMessage: (disputeId, content) => api.post(`/disputes/${disputeId}/messages`, { content }),
  // Send a message with images
  sendMessageWithImages: (disputeId, formData) => 
    api.post(`/disputes/${disputeId}/messages`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  // Resolve dispute (admin only)
  resolveDispute: (disputeId, winner, notes) => 
    api.post(`/disputes/${disputeId}/resolve`, { winner, notes }),
  // Update dispute priority (admin only)
  updatePriority: (disputeId, priority) => 
    api.patch(`/disputes/${disputeId}/priority`, { priority }),
  // Assign admin to dispute (admin only)
  assignAdmin: (disputeId, adminId) => 
    api.patch(`/disputes/${disputeId}/assign`, { adminId }),
  // Close dispute
  closeDispute: (disputeId, reason) => 
    api.post(`/disputes/${disputeId}/close`, { reason }),
  // Get proof image URL
  getProofImageUrl: (filename) => `${API_BASE_URL}/disputes/proofs/${filename}`,
};

// Payouts API (KooshCoin Burn & Withdrawal)
export const payoutsAPI = {
  // Get user's KooshCoin balance
  getBalance: () => api.get("/payouts/balance"),
  // Get user's bank details
  getBankDetails: () => api.get("/payouts/bank-details"),
  // Add new bank detail
  addBankDetail: (bankData) => api.post("/payouts/bank-details", bankData),
  // Delete bank detail
  deleteBankDetail: (id) => api.delete(`/payouts/bank-details/${id}`),
  // Set default bank detail
  setDefaultBankDetail: (id) => api.patch(`/payouts/bank-details/${id}/default`),
  // Claim funds (burn tokens and request payout)
  claimFunds: (claimData) => api.post("/payouts/claim", claimData),
  // Get claim/payout history
  getClaimHistory: (params) => api.get("/payouts/claims", { params }),
  // Get single claim details
  getClaimDetails: (id) => api.get(`/payouts/claims/${id}`),
  // Get burn history
  getBurnHistory: (params) => api.get("/payouts/burns", { params }),
  // Retry a failed burn
  retryBurn: (burnRecordId) => api.post(`/payouts/burns/${burnRecordId}/retry`),
  // Verify/check a burn status
  verifyBurn: (burnRecordId) => api.post(`/payouts/burns/${burnRecordId}/verify`),
};

export default api;
