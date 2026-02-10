import stockshipApi from "./stockshipApi";

// Note: stockshipApi is already configured with base URL and interceptors

// Public API endpoints for frontend (no auth required for most)
export const frontendApi = {
  // Products
  getProducts: (params = {}) => stockshipApi.get("/products", { params }),
  getProduct: (id) => stockshipApi.get(`/products/${id}`),
  getRelatedProducts: (id) => stockshipApi.get(`/products/${id}/related`),
  searchProducts: (query, params = {}) =>
    stockshipApi.get("/search/products", { params: { q: query, ...params } }),

  // Categories
  getCategories: (params = {}) => stockshipApi.get("/categories", { params }),
  getCategory: (id) => stockshipApi.get(`/categories/${id}`),
  getCategoryProducts: (id, params = {}) =>
    stockshipApi.get(`/categories/${id}/products`, { params }),

  // Homepage
  getHomepageData: (params = {}) => stockshipApi.get("/home/top-rated", { params }),
  getTopRated: (params = {}) => stockshipApi.get("/home/top-rated", { params }),
  getBestSellers: (params = {}) => stockshipApi.get("/home/best-sellers", { params }),
  getRecentlyAdded: (params = {}) => stockshipApi.get("/home/recently-added", { params }),
  getPopularCategories: (params = {}) => stockshipApi.get("/home/popular-categories", { params }),

  // Cart (requires auth)
  getCart: () => stockshipApi.get("/cart"),
  addToCart: (data) => stockshipApi.post("/cart/items", data),
  updateCartItem: (id, data) => stockshipApi.put(`/cart/items/${id}`, data),
  removeFromCart: (id) => stockshipApi.delete(`/cart/items/${id}`),
  clearCart: () => stockshipApi.delete("/cart"),

  // Wishlist (requires auth)
  getWishlist: () => stockshipApi.get("/wishlist"),
  addToWishlist: (wishlistId, productId) =>
    stockshipApi.post(`/wishlist/${wishlistId}/products/${productId}`),
  removeFromWishlist: (wishlistId, productId) =>
    stockshipApi.delete(`/wishlist/${wishlistId}/products/${productId}`),

  // Checkout (requires auth)
  initCheckout: (data) => stockshipApi.post("/checkout/init", data),
  getCheckoutSession: (sessionId) => stockshipApi.get(`/checkout/session/${sessionId}`),
  calculateCheckout: (data) => stockshipApi.post("/checkout/calculate", data),
  completeCheckout: (data) => stockshipApi.post("/checkout/complete", data),

  // Orders (requires auth)
  getMyOrders: (params = {}) => stockshipApi.get("/orders/my-orders", { params }),
  getOrder: (id) => stockshipApi.get(`/orders/my-orders/${id}`),
  getOrderTracking: (id) => stockshipApi.get(`/orders/my-orders/${id}/tracking`),

  // Reviews
  getProductReviews: (productId, params = {}) =>
    stockshipApi.get(`/products/${productId}/reviews`, { params }),
  createReview: (productId, data) => stockshipApi.post(`/products/${productId}/reviews`, data),
};

export default frontendApi;

