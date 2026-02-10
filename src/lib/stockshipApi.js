import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";

const stockshipApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor - Add auth token (supports multi-role)
stockshipApi.interceptors.request.use(
  (config) => {
    // Try to get token from URL or config to determine which role token to use
    const path = config.url || '';
    
    // Get active role from localStorage (set by MultiAuthContext)
    const activeRole = localStorage.getItem('active_role');
    
    // Determine which token to use based on endpoint and active role
    let token = null;
    
    // Priority 1: Check if active role is set (most reliable for multi-role users)
    if (activeRole) {
      if (activeRole === 'admin') {
        token = localStorage.getItem('admin_token');
      } else if (activeRole === 'employee') {
        token = localStorage.getItem('employee_token');
      } else if (activeRole === 'trader') {
        token = localStorage.getItem('trader_token');
      } else if (activeRole === 'client') {
        token = localStorage.getItem('client_token');
      }
    }
    
    // Priority 2: Fallback to endpoint-based detection if no active role or token not found
    if (!token) {
      if (path.includes('/admin/') || path.includes('/admin')) {
        token = localStorage.getItem('admin_token');
      } else if (path.includes('/employees/') || path.includes('/employee') || path.includes('/mediation/employees')) {
        token = localStorage.getItem('employee_token');
      } else if (path.includes('/traders/') || path.includes('/trader') || path.includes('/mediation/traders')) {
        // For traders endpoint, check if we have admin_token (when called from admin context)
        // This allows admin to view trader details
        token = localStorage.getItem('admin_token') || localStorage.getItem('trader_token');
      } else if (path.includes('/client') || path.includes('/mediation/deals') || path.includes('/mediation/offers')) {
        token = localStorage.getItem('client_token');
      }
    }
    
    // Fallback to any available token (prioritize admin for admin endpoints)
    if (!token) {
      if (path.includes('/admin/') || path.includes('/admin')) {
        token = localStorage.getItem('admin_token');
      }
      if (!token) {
        token = localStorage.getItem('admin_token') || 
                localStorage.getItem('employee_token') || 
                localStorage.getItem('trader_token') || 
                localStorage.getItem('client_token') ||
                localStorage.getItem('auth_token'); // Legacy support
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
stockshipApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    // Handle rate limiting (429)
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 15;
      const message = error.response.data?.message || `Too many requests. Please try again after ${retryAfter} seconds.`;
      // Show user-friendly message
      if (typeof window !== 'undefined' && window.showToast) {
        window.showToast.error('Too Many Requests', message);
      }
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTH API
// ============================================
export const authApi = {
  login: (email, password) => stockshipApi.post("/auth/login", { email, password }),
  register: (data) => stockshipApi.post("/auth/register", data),
  guestLogin: () => stockshipApi.post("/auth/guest"),
  logout: () => stockshipApi.post("/auth/logout"),
  me: () => stockshipApi.get("/auth/me"),
  updateProfile: (data) => stockshipApi.put("/auth/me", data),
  forgotPassword: (email) => stockshipApi.post("/auth/forgot-password", { email }),
  resetPassword: (token, password) => stockshipApi.post("/auth/reset-password", { token, password }),
  verifyEmail: (token) => stockshipApi.post("/auth/verify-email", { token }),
  resendVerification: () => stockshipApi.post("/auth/resend-verification"),
  refreshToken: () => stockshipApi.post("/auth/refresh-token"),
};

// ============================================
// ADMIN API
// ============================================
export const adminApi = {
  // Dashboard
  getDashboardStats: () => stockshipApi.get("/admin/dashboard/stats"),
  
  // Users
  getUsers: (params) => stockshipApi.get("/admin/users", { params }),
  getUser: (id) => stockshipApi.get(`/admin/users/${id}`),
  createUser: (data) => stockshipApi.post("/admin/users", data),
  updateUser: (id, data) => stockshipApi.put(`/admin/users/${id}`, data),
  deleteUser: (id) => stockshipApi.delete(`/admin/users/${id}`),
  updateUserStatus: (id, data) => stockshipApi.put(`/admin/users/${id}/status`, data),
  
  // Employees (Mediation Platform)
  getEmployees: (params) => stockshipApi.get("/admin/employees", { params }),
  getEmployee: (id) => stockshipApi.get(`/employees/${id}`),
  createEmployee: (data) => stockshipApi.post("/admin/employees", data),
  updateEmployee: (id, data) => stockshipApi.put(`/admin/employees/${id}`, data),
  
  // Traders (Mediation Platform)
  getTraders: (params) => stockshipApi.get("/admin/traders", { params }),
  getTrader: (id) => stockshipApi.get(`/traders/${id}`),
  updateTrader: (id, data) => stockshipApi.put(`/traders/${id}`, data),
  deleteTrader: (id) => stockshipApi.delete(`/admin/traders/${id}`),
  
  // Offers (Mediation Platform)
  getOffers: (params) => stockshipApi.get("/admin/offers", { params }),
  getOffer: (id) => stockshipApi.get(`/offers/${id}`),
  
  // Platform Settings
  getPlatformSettings: () => stockshipApi.get("/admin/platform-settings"),
  updatePlatformSettings: (data) => stockshipApi.put("/admin/platform-settings", data),
  
  // Deals (Mediation Platform)
  getDeals: (params) => stockshipApi.get("/deals", { params }), // Works for ADMIN, EMPLOYEE, TRADER, CLIENT
  getDeal: (id) => stockshipApi.get(`/deals/${id}`),
  settleDeal: (id) => stockshipApi.put(`/deals/${id}/settle`),
  
  // Vendors (Legacy - kept for backward compatibility)
  getVendors: (params) => stockshipApi.get("/admin/vendors", { params }),
  getVendor: (id) => stockshipApi.get(`/admin/vendors/${id}`),
  createVendor: (data) => stockshipApi.post("/admin/vendors", data),
  updateVendor: (id, data) => stockshipApi.put(`/admin/vendors/${id}`, data),
  deleteVendor: (id) => stockshipApi.delete(`/admin/vendors/${id}`),
  approveVendor: (id) => stockshipApi.put(`/admin/vendors/${id}/approve`),
  rejectVendor: (id, reason) => stockshipApi.put(`/admin/vendors/${id}/reject`, { reason }),
  suspendVendor: (id, reason) => stockshipApi.put(`/admin/vendors/${id}/suspend`, { reason }),
  activateVendor: (id) => stockshipApi.put(`/admin/vendors/${id}/activate`),
  
  // Products (via /products with admin auth)
  getProducts: (params) => stockshipApi.get("/products", { params }),
  getProduct: (id) => stockshipApi.get(`/products/${id}`),
  createProduct: (data) => stockshipApi.post("/products", data),
  updateProduct: (id, data) => stockshipApi.put(`/products/${id}`, data),
  deleteProduct: (id) => stockshipApi.delete(`/products/${id}`),
  approveProduct: (id) => stockshipApi.put(`/products/${id}/approve`),
  rejectProduct: (id, reason) => stockshipApi.put(`/products/${id}/reject`, { reason }),
  uploadProductImages: (id, formData) => {
    // Create FormData for file upload
    const uploadFormData = new FormData();
    // Add files
    if (formData.files && formData.files.length > 0) {
      formData.files.forEach((file) => {
        uploadFormData.append('images', file);
      });
      // Add metadata as JSON string
      if (formData.imageData) {
        uploadFormData.append('imageData', JSON.stringify(formData.imageData));
      }
    } else if (formData.images) {
      // Fallback: send as JSON for URL-based images
      return stockshipApi.post(`/products/${id}/images`, { images: formData.images });
    }
    return stockshipApi.post(`/products/${id}/images`, uploadFormData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteProductImage: (id, imageId) => stockshipApi.delete(`/products/${id}/images/${imageId}`),
  exportProducts: (params) => stockshipApi.get('/products/export', { params, responseType: 'blob' }),
  downloadTemplate: () => stockshipApi.get('/products/export/template', { responseType: 'blob' }),
  importProducts: (file) => {
    const formData = new FormData();
    formData.append('csv', file);
    return stockshipApi.post('/products/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Categories
  getCategories: (params) => stockshipApi.get("/categories", { params }),
  getCategory: (id) => stockshipApi.get(`/categories/${id}`),
  createCategory: (data) => stockshipApi.post("/categories", data),
  updateCategory: (id, data) => stockshipApi.put(`/categories/${id}`, data),
  deleteCategory: (id) => stockshipApi.delete(`/categories/${id}`),
  
  // Sliders
  getSliders: (params) => stockshipApi.get("/sliders", { params }),
  getSlider: (id) => stockshipApi.get(`/sliders/${id}`),
  createSlider: (data) => stockshipApi.post("/sliders", data),
  updateSlider: (id, data) => stockshipApi.put(`/sliders/${id}`, data),
  deleteSlider: (id) => stockshipApi.delete(`/sliders/${id}`),
  
  // Video Ads
  getVideoAds: (params) => stockshipApi.get("/video-ads", { params }),
  getVideoAd: (id, params) => stockshipApi.get(`/video-ads/${id}`, { params }),
  createVideoAd: (data) => stockshipApi.post("/video-ads", data),
  updateVideoAd: (id, data) => stockshipApi.put(`/video-ads/${id}`, data),
  deleteVideoAd: (id) => stockshipApi.delete(`/video-ads/${id}`),
  
  // Orders
  getOrders: (params) => stockshipApi.get("/orders/admin", { params }),
  getOrder: (id) => stockshipApi.get(`/orders/admin/${id}`),
  getOrderTracking: (id) => stockshipApi.get(`/orders/admin/${id}/tracking`),
  updateOrderStatus: (id, data) => stockshipApi.put(`/orders/admin/${id}/status`, data),
  
  // Payments
  getPayments: (params) => stockshipApi.get("/admin/payments", { params }),
  getPayment: (id) => stockshipApi.get(`/admin/payments/${id}`),
  
  // Wallets
  getWallets: (params) => stockshipApi.get("/admin/wallets", { params }),
  
  // Support Tickets
  getSupportTickets: (params) => stockshipApi.get("/admin/support/tickets", { params }),
  getSupportTicket: (id) => stockshipApi.get(`/admin/support/tickets/${id}`),
  updateSupportTicketStatus: (id, data) => stockshipApi.put(`/admin/support/tickets/${id}/status`, data),
  addSupportTicketMessage: (id, message) => stockshipApi.post(`/admin/support/tickets/${id}/messages`, { message }),
  
  // Coupons
  getCoupons: (params) => stockshipApi.get("/coupons/admin", { params }),
  getCoupon: (id) => stockshipApi.get(`/coupons/admin/${id}`),
  createCoupon: (data) => stockshipApi.post("/coupons/admin", data),
  updateCoupon: (id, data) => stockshipApi.put(`/coupons/admin/${id}`, data),
  deleteCoupon: (id) => stockshipApi.delete(`/coupons/admin/${id}`),
  getCouponUsage: (id) => stockshipApi.get(`/coupons/admin/${id}/usage`),
  
  // Shipping Companies
  getShippingCompanies: (params) => stockshipApi.get("/admin/shipping-companies", { params }),
  getActiveShippingCompanies: () => stockshipApi.get("/admin/shipping-companies/active"),
  getShippingCompany: (id) => stockshipApi.get(`/admin/shipping-companies/${id}`),
  createShippingCompany: (data) => stockshipApi.post("/admin/shipping-companies", data),
  updateShippingCompany: (id, data) => stockshipApi.put(`/admin/shipping-companies/${id}`, data),
  deleteShippingCompany: (id) => stockshipApi.delete(`/admin/shipping-companies/${id}`),
  
  // Deals - Shipping Assignment
  assignShippingCompany: (dealId, shippingCompanyId) => stockshipApi.put(`/deals/${dealId}/assign-shipping`, { shippingCompanyId }),
  
  // Shipping Tracking
  getShippingTracking: (dealId) => stockshipApi.get(`/deals/${dealId}/shipping-tracking`),
  createOrUpdateShippingTracking: (dealId, data) => stockshipApi.post(`/deals/${dealId}/shipping-tracking`, data),
  updateShippingStatus: (dealId, data) => stockshipApi.put(`/deals/${dealId}/shipping-tracking/status`, data),
  
  // Admin Shipping Tracking
  getAllShippingTracking: (params) => stockshipApi.get("/admin/shipping-tracking", { params }),
  getShippingTrackingStats: (params) => stockshipApi.get("/admin/shipping-tracking/stats", { params }),
  
  // Offers (Legacy - kept for backward compatibility, but mediation platform uses the one above)
  
  // Analytics
  getSalesReport: (params) => stockshipApi.get("/analytics/sales", { params }),
  
  // Activity Logs
  getActivityLogs: (params) => stockshipApi.get("/admin/activity-logs", { params }),
  getActivityLog: (id) => stockshipApi.get(`/admin/activity-logs/${id}`),
  getActivityLogsByUser: (userId, params) => stockshipApi.get(`/admin/activity-logs/user/${userId}`, { params }),
  getActivityLogsByEntity: (entityType, entityId, params) => stockshipApi.get(`/admin/activity-logs/entity/${entityType}/${entityId}`, { params }),
  getAuditTrail: (params) => stockshipApi.get("/audit/trails", { params }),
  
  // Content Pages
  getContentPages: (params) => stockshipApi.get("/admin/content-pages", { params }),
  getContentPage: (id) => stockshipApi.get(`/admin/content-pages/${id}`),
  createContentPage: (data) => stockshipApi.post("/admin/content-pages", data),
  updateContentPage: (id, data) => stockshipApi.put(`/admin/content-pages/${id}`, data),
  deleteContentPage: (id) => stockshipApi.delete(`/admin/content-pages/${id}`),
  getContentPageByType: (type, params) => stockshipApi.get(`/content/${type}`, { params }),
  
  // Translations
  getTranslations: (params) => stockshipApi.get("/translations", { params }),
  getTranslation: (key) => stockshipApi.get(`/translations/${key}`),
  createTranslation: (data) => stockshipApi.post("/translations", data),
  updateTranslation: (key, data) => stockshipApi.put(`/translations/${key}`, data),
  deleteTranslation: (key) => stockshipApi.delete(`/translations/${key}`),
  getAllTranslationKeys: (params) => stockshipApi.get("/translations/keys", { params }),
  getTranslationStatus: (params) => stockshipApi.get("/translations/status", { params }),
  getMissingTranslations: (params) => stockshipApi.get("/translations/missing", { params }),
  importTranslations: (data) => stockshipApi.post("/translations/import", data),
  exportTranslations: (params) => stockshipApi.get("/translations/export", { params }),
  generateTranslationKey: (data) => stockshipApi.post("/translations/generate-key", data),
};

// ============================================
// VENDOR API
// ============================================
export const vendorApi = {
  // Dashboard
  getDashboardStats: () => stockshipApi.get("/vendors/dashboard/stats"),
  
  // Profile
  getProfile: () => stockshipApi.get("/vendors/profile"),
  updateProfile: (data) => stockshipApi.put("/vendors/profile", data),
  
  // Products
  getProducts: (params) => stockshipApi.get("/products", { params }),
  getProduct: (id) => stockshipApi.get(`/products/${id}`),
  createProduct: (data) => stockshipApi.post("/products", data),
  updateProduct: (id, data) => stockshipApi.put(`/products/${id}`, data),
  deleteProduct: (id) => stockshipApi.delete(`/products/${id}`),
  uploadProductImages: (id, formData) => {
    // Create FormData for file upload
    const uploadFormData = new FormData();
    // Add files
    if (formData.files && formData.files.length > 0) {
      formData.files.forEach((file) => {
        uploadFormData.append('images', file);
      });
      // Add metadata as JSON string
      if (formData.imageData) {
        uploadFormData.append('imageData', JSON.stringify(formData.imageData));
      }
    } else if (formData.images) {
      // Fallback: send as JSON for URL-based images
      return stockshipApi.post(`/products/${id}/images`, { images: formData.images });
    }
    return stockshipApi.post(`/products/${id}/images`, uploadFormData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteProductImage: (id, imageId) => stockshipApi.delete(`/products/${id}/images/${imageId}`),
  exportProducts: (params) => stockshipApi.get('/products/export', { params, responseType: 'blob' }),
  downloadTemplate: () => stockshipApi.get('/products/export/template', { responseType: 'blob' }),
  importProducts: (file) => {
    const formData = new FormData();
    formData.append('csv', file);
    return stockshipApi.post('/products/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getProductsBySeller: (sellerId, params) => stockshipApi.get(`/products/seller/${sellerId}`, { params }),
  getRelatedProducts: (id) => stockshipApi.get(`/products/${id}/related`),
  
  // Orders
  getOrders: (params) => stockshipApi.get("/orders/vendor", { params }),
  getOrder: (id) => stockshipApi.get(`/orders/vendor/${id}`),
  getOrderTracking: (id) => stockshipApi.get(`/orders/vendor/${id}/tracking`),
  getPendingAcceptanceOrders: (params) => stockshipApi.get("/orders/pending-acceptance", { params }),
  acceptOrder: (id, data) => stockshipApi.post(`/orders/${id}/accept`, data),
  rejectOrder: (id, reason) => stockshipApi.post(`/orders/${id}/reject`, { reason }),
  updateOrderStatus: (id, status) => stockshipApi.put(`/orders/vendor/${id}/status`, { status }),
  
  // Inventory
  getInventory: (params) => stockshipApi.get("/inventory/stock-levels", { params }),
  getLowStockProducts: (params) => stockshipApi.get("/inventory/low-stock", { params }),
  addStock: (data) => stockshipApi.post("/inventory/add", data),
  removeStock: (data) => stockshipApi.post("/inventory/remove", data),
  updateProductStatus: (id, status) => stockshipApi.put(`/inventory/products/${id}/status`, { status }),
  
  // Wallet
  getWallet: () => stockshipApi.get("/wallets/vendor"),
  getTransactions: (params) => stockshipApi.get("/wallets/vendor/transactions", { params }),
  requestPayout: (data) => stockshipApi.post("/wallets/vendor/payout-request", data),
  
  // Negotiations
  getNegotiations: (params) => stockshipApi.get("/negotiations", { params }),
  getNegotiation: (id) => stockshipApi.get(`/negotiations/${id}`),
  createNegotiation: (data) => stockshipApi.post("/negotiations", data),
  respondToNegotiation: (id, data) => stockshipApi.put(`/negotiations/${id}/respond`, data),
  updateNegotiationStatus: (id, status) => stockshipApi.put(`/negotiations/${id}/status`, { status }),
  
  // Price Requests
  requestPrice: (productId, data) => stockshipApi.post(`/products/${productId}/request-price`, data),
  getPriceRequests: (params) => stockshipApi.get("/price-requests", { params }),
  respondToPriceRequest: (id, data) => stockshipApi.put(`/price-requests/${id}/respond`, data),
  
  // Product Reviews
  getProductReviews: (productId, params) => stockshipApi.get(`/products/${productId}/reviews`, { params }),
  respondToReview: (productId, reviewId, data) => stockshipApi.post(`/products/${productId}/reviews/${reviewId}/respond`, data),
  
  // Coupons
  getCoupons: (params) => stockshipApi.get("/coupons/vendor", { params }),
  createCoupon: (data) => stockshipApi.post("/coupons/vendor", data),
  getCouponAnalytics: (params) => stockshipApi.get("/coupons/vendor/analytics", { params }),
  
  // Offers
  getOffers: (params) => stockshipApi.get("/offers/vendor", { params }),
  createOffer: (data) => stockshipApi.post("/offers/vendor", data),
  updateOffer: (id, data) => stockshipApi.put(`/offers/vendor/${id}`, data),
  deleteOffer: (id) => stockshipApi.delete(`/offers/vendor/${id}`),
};

// ============================================
// PRODUCTS API (Public/Vendor/Admin)
// ============================================
export const productsApi = {
  getAll: (params) => stockshipApi.get("/products", { params }),
  getById: (id) => stockshipApi.get(`/products/${id}`),
  getRelated: (id) => stockshipApi.get(`/products/${id}/related`),
  getBySeller: (sellerId, params) => stockshipApi.get(`/products/seller/${sellerId}`, { params }),
  search: (params) => stockshipApi.get("/search/products", { params }),
  create: (data) => stockshipApi.post("/products", data),
  update: (id, data) => stockshipApi.put(`/products/${id}`, data),
  delete: (id) => stockshipApi.delete(`/products/${id}`),
  uploadImages: (id, formData) => stockshipApi.post(`/products/${id}/images`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  deleteImage: (id, imageId) => stockshipApi.delete(`/products/${id}/images/${imageId}`),
  requestPrice: (id, data) => stockshipApi.post(`/products/${id}/request-price`, data),
  getReviews: (id, params) => stockshipApi.get(`/products/${id}/reviews`, { params }),
  createReview: (id, data) => stockshipApi.post(`/products/${id}/reviews`, data),
  respondToReview: (id, reviewId, data) => stockshipApi.post(`/products/${id}/reviews/${reviewId}/respond`, data),
};

// ============================================
// CATEGORIES API (Public/Admin)
// ============================================
export const categoriesApi = {
  getAll: (params) => stockshipApi.get("/categories", { params }),
  getById: (id) => stockshipApi.get(`/categories/${id}`),
  create: (data) => stockshipApi.post("/categories", data),
  update: (id, data) => stockshipApi.put(`/categories/${id}`, data),
  delete: (id) => stockshipApi.delete(`/categories/${id}`),
};

// ============================================
// ORDERS API (User/Vendor/Admin)
// ============================================
export const ordersApi = {
  // User orders
  getMyOrders: (params) => stockshipApi.get("/orders/my-orders", { params }),
  getMyOrder: (id) => stockshipApi.get(`/orders/my-orders/${id}`),
  getMyOrderTracking: (id) => stockshipApi.get(`/orders/my-orders/${id}/tracking`),
  create: (data) => stockshipApi.post("/orders", data),
  cancel: (id, reason) => stockshipApi.post(`/orders/${id}/cancel`, { reason }),
  
  // Vendor orders
  getVendorOrders: (params) => stockshipApi.get("/orders/vendor", { params }),
  getVendorOrder: (id) => stockshipApi.get(`/orders/vendor/${id}`),
  getVendorOrderTracking: (id) => stockshipApi.get(`/orders/vendor/${id}/tracking`),
  getPendingAcceptance: (params) => stockshipApi.get("/orders/pending-acceptance", { params }),
  acceptOrder: (id, data) => stockshipApi.post(`/orders/${id}/accept`, data),
  rejectOrder: (id, reason) => stockshipApi.post(`/orders/${id}/reject`, { reason }),
  updateVendorOrderStatus: (id, status) => stockshipApi.put(`/orders/vendor/${id}/status`, { status }),
  
  // Admin orders
  getAdminOrders: (params) => stockshipApi.get("/orders/admin", { params }),
  getAdminOrder: (id) => stockshipApi.get(`/orders/admin/${id}`),
  getAdminOrderTracking: (id) => stockshipApi.get(`/orders/admin/${id}/tracking`),
  updateAdminOrderStatus: (id, status) => stockshipApi.put(`/orders/admin/${id}/status`, { status }),
  
  // Common
  getById: (id) => stockshipApi.get(`/orders/${id}`),
  getTracking: (id) => stockshipApi.get(`/orders/${id}/tracking`),
};

// ============================================
// WALLET API (Vendor)
// ============================================
export const walletApi = {
  getVendorWallet: () => stockshipApi.get("/wallets/vendor"),
  getVendorTransactions: (params) => stockshipApi.get("/wallets/vendor/transactions", { params }),
  requestPayout: (data) => stockshipApi.post("/wallets/vendor/payout-request", data),
};

// ============================================
// INVENTORY API (Vendor)
// ============================================
export const inventoryApi = {
  getStockLevels: (params) => stockshipApi.get("/inventory/stock-levels", { params }),
  getLowStockProducts: (params) => stockshipApi.get("/inventory/low-stock", { params }),
  addStock: (data) => stockshipApi.post("/inventory/add", data),
  removeStock: (data) => stockshipApi.post("/inventory/remove", data),
  updateProductStatus: (id, status) => stockshipApi.put(`/inventory/products/${id}/status`, { status }),
};

// ============================================
// NEGOTIATIONS API
// ============================================
export const negotiationsApi = {
  getAll: (params) => stockshipApi.get("/negotiations", { params }),
  getById: (id) => stockshipApi.get(`/negotiations/${id}`),
  create: (data) => stockshipApi.post("/negotiations", data),
  respond: (id, data) => stockshipApi.put(`/negotiations/${id}/respond`, data),
  updateStatus: (id, status) => stockshipApi.put(`/negotiations/${id}/status`, { status }),
};

// ============================================
// PRICE REQUESTS API
// ============================================
export const priceRequestsApi = {
  requestPrice: (productId, data) => stockshipApi.post(`/products/${productId}/request-price`, data),
  getAll: (params) => stockshipApi.get("/price-requests", { params }),
  getById: (id) => stockshipApi.get(`/price-requests/${id}`),
  respond: (id, data) => stockshipApi.put(`/price-requests/${id}/respond`, data),
};

// ============================================
// REVIEWS API
// ============================================
export const reviewsApi = {
  getProductReviews: (productId, params) => stockshipApi.get(`/products/${productId}/reviews`, { params }),
  createReview: (productId, data) => stockshipApi.post(`/products/${productId}/reviews`, data),
  respondToReview: (productId, reviewId, data) => stockshipApi.post(`/products/${productId}/reviews/${reviewId}/respond`, data),
};

export default stockshipApi;
