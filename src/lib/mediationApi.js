/**
 * Mediation Platform API Client
 * 
 * This file contains API functions for the mediation platform
 * Replace the old e-commerce API calls with these new endpoints
 * 
 * Supports multi-role authentication - tokens are stored separately by role
 */

import axios from 'axios';

// Helper to get the appropriate token for API calls
const getTokenForRole = (role) => {
  if (role === 'admin') return localStorage.getItem('admin_token');
  if (role === 'employee') return localStorage.getItem('employee_token');
  if (role === 'trader') return localStorage.getItem('trader_token');
  if (role === 'client') return localStorage.getItem('client_token');
  // Fallback to any available token
  return localStorage.getItem('admin_token') || 
         localStorage.getItem('employee_token') || 
         localStorage.getItem('trader_token') || 
         localStorage.getItem('client_token') ||
         localStorage.getItem('auth_token'); // Legacy
};

// Create axios instance for mediation API
const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor - Add auth token based on role
api.interceptors.request.use(
  (config) => {
    // Try to determine role from URL path
    const path = config.url || '';
    let token = null;
    
    // Get active role from localStorage (set by MultiAuthContext)
    const activeRole = localStorage.getItem('active_role') || '';
    
    // Priority: active role > path-based detection > fallback
    if (activeRole) {
      token = getTokenForRole(activeRole.toLowerCase());
    }
    
    // Path-based detection if no active role token found
    if (!token) {
      if (path.includes('/admin/') || (path.includes('/employees') && !path.includes('/traders'))) {
        token = getTokenForRole('admin');
      } else if (path.includes('/employees/') || path.includes('/employee')) {
        token = getTokenForRole('employee');
      } else if (path.includes('/traders/') || path.includes('/trader')) {
        token = getTokenForRole('trader');
      } else if (path.includes('/clients/') || path.includes('/client')) {
        token = getTokenForRole('client');
      } else if (path.includes('/offers')) {
        // For /offers routes, try trader first (common case), then client
        token = getTokenForRole('trader') || getTokenForRole('client');
      } else if (path.includes('/deals')) {
        // For /deals routes, try all roles (can be accessed by trader, client, employee)
        token = getTokenForRole('trader') || getTokenForRole('client') || getTokenForRole('employee');
      }
    }
    
    // Fallback to any available token
    if (!token) {
      token = getTokenForRole(null);
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
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear all tokens on 401
      ['admin', 'employee', 'trader', 'client'].forEach(role => {
        localStorage.removeItem(`${role}_token`);
        localStorage.removeItem(`${role}_user`);
      });
      if (window.location.pathname !== '/multi-login') {
        window.location.href = '/multi-login';
      }
    }
    return Promise.reject(error);
  }
);

const BASE_URL = '';

// ============================================
// EMPLOYEE API
// ============================================

export const employeeApi = {
  // Get all employees (Admin)
  getAllEmployees: (params = {}) => {
    return api.get(`${BASE_URL}/admin/employees`, { params });
  },

  // Get employee by ID
  getEmployeeById: (id) => {
    return api.get(`${BASE_URL}/employees/${id}`);
  },

  // Get employee dashboard
  getEmployeeDashboard: (id) => {
    return api.get(`${BASE_URL}/employees/${id}/dashboard`);
  },

  // Get employee's traders
  getEmployeeTraders: (id, params = {}) => {
    return api.get(`${BASE_URL}/employees/${id}/traders`, { params });
  },

  // Get employee's deals
  getEmployeeDeals: (id, params = {}) => {
    return api.get(`${BASE_URL}/employees/${id}/deals`, { params });
  },

  // Create employee (Admin)
  createEmployee: (data) => {
    return api.post(`${BASE_URL}/admin/employees`, data);
  },

  // Update employee (Admin)
  updateEmployee: (id, data) => {
    return api.put(`${BASE_URL}/admin/employees/${id}`, data);
  },

  // Get active shipping companies
  getActiveShippingCompanies: () => {
    return api.get(`${BASE_URL}/admin/shipping-companies/active`);
  },

  // Get employee shipping tracking
  getEmployeeShippingTracking: (params = {}) => {
    return api.get(`${BASE_URL}/employees/shipping-tracking`, { params });
  },

  // Assign shipping company to deal
  assignShippingCompany: (dealId, shippingCompanyId) => {
    return api.put(`${BASE_URL}/deals/${dealId}/assign-shipping`, { shippingCompanyId });
  },

  // Get shipping tracking for deal
  getShippingTracking: (dealId) => {
    return api.get(`${BASE_URL}/deals/${dealId}/shipping-tracking`);
  },

  // Create or update shipping tracking
  createOrUpdateShippingTracking: (dealId, data) => {
    return api.post(`${BASE_URL}/deals/${dealId}/shipping-tracking`, data);
  },

  // Trader update request functions (Employee/Admin)
  getAllTraderUpdateRequests: (params = {}) => {
    return api.get(`${BASE_URL}/admin/trader-update-requests`, { params });
  },

  getTraderUpdateRequestById: (id) => {
    return api.get(`${BASE_URL}/admin/trader-update-requests/${id}`);
  },

  approveTraderUpdateRequest: (id, data) => {
    return api.put(`${BASE_URL}/admin/trader-update-requests/${id}/approve`, data);
  },

  rejectTraderUpdateRequest: (id, data) => {
    return api.put(`${BASE_URL}/admin/trader-update-requests/${id}/reject`, data);
  },

  // Offer update request functions (Employee/Admin)
  getAllOfferUpdateRequests: (params = {}) => {
    return api.get(`${BASE_URL}/admin/offer-update-requests`, { params });
  },

  getOfferUpdateRequestById: (id) => {
    return api.get(`${BASE_URL}/admin/offer-update-requests/${id}`);
  },

  approveOfferUpdateRequest: (id, data) => {
    return api.put(`${BASE_URL}/admin/offer-update-requests/${id}/approve`, data);
  },

  rejectOfferUpdateRequest: (id, data) => {
    return api.put(`${BASE_URL}/admin/offer-update-requests/${id}/reject`, data);
  },

  // Offer support ticket functions (Employee/Admin)
  createOfferSupportTicket: (offerId, data) => {
    return api.post(`${BASE_URL}/employees/offers/${offerId}/support-tickets`, data);
  },

  getAllOfferSupportTickets: (params = {}) => {
    return api.get(`${BASE_URL}/admin/offer-support-tickets`, { params });
  },

  getOfferSupportTicketById: (id) => {
    return api.get(`${BASE_URL}/admin/offer-support-tickets/${id}`);
  },

  addOfferSupportTicketMessage: (id, data) => {
    return api.post(`${BASE_URL}/admin/offer-support-tickets/${id}/messages`, data);
  },

  updateOfferSupportTicketStatus: (id, data) => {
    return api.put(`${BASE_URL}/admin/offer-support-tickets/${id}/status`, data);
  },

  assignOfferSupportTicket: (id, data) => {
    return api.put(`${BASE_URL}/admin/offer-support-tickets/${id}/assign`, data);
  }
};

// ============================================
// TRADER API
// ============================================

export const traderApi = {
  // Get trader by ID
  getTraderById: (id) => {
    return api.get(`${BASE_URL}/traders/${id}`);
  },

  // Get trader's offers
  getTraderOffers: (id, params = {}) => {
    return api.get(`${BASE_URL}/traders/${id}/offers`, { params });
  },

  // Create trader (Employee)
  createTrader: (employeeId, data) => {
    return api.post(`${BASE_URL}/employees/${employeeId}/traders`, data);
  },

  // Update trader (Employee/Admin)
  updateTrader: (id, data) => {
    return api.put(`${BASE_URL}/traders/${id}`, data);
  },

  // Update request functions
  createUpdateRequest: (data) => {
    return api.post(`${BASE_URL}/traders/update-request`, data);
  },

  getUpdateRequests: () => {
    return api.get(`${BASE_URL}/traders/update-requests`);
  },

  cancelUpdateRequest: (id) => {
    return api.put(`${BASE_URL}/traders/update-requests/${id}/cancel`);
  }
};

// ============================================
// OFFER API
// ============================================

export const offerApi = {
  // Get active offers (Public)
  getActiveOffers: (params = {}) => {
    return api.get(`${BASE_URL}/offers`, { params });
  },

  // Get offer by ID (Public)
  getOfferById: (id) => {
    return api.get(`${BASE_URL}/offers/${id}`);
  },

  // Create offer (Trader)
  createOffer: (data) => {
    return api.post(`${BASE_URL}/traders/offers`, data);
  },

  // Upload Excel file (Trader)
  uploadOfferExcel: (offerId, file) => {
    const formData = new FormData();
    formData.append('excelFile', file);
    return api.post(`${BASE_URL}/traders/offers/${offerId}/upload-excel`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // Validate offer (Employee)
  validateOffer: (id, data) => {
    return api.put(`${BASE_URL}/employees/offers/${id}/validate`, data);
  },

  // Update offer (Employee)
  updateOffer: (id, data) => {
    return api.put(`${BASE_URL}/employees/offers/${id}`, data);
  },

  // Upload Excel file (Employee)
  uploadOfferExcelEmployee: (offerId, file) => {
    const formData = new FormData();
    formData.append('excelFile', file);
    return api.post(`${BASE_URL}/employees/offers/${offerId}/upload-excel`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // Get Employee's Offers
  getEmployeeOffers: (params = {}) => {
    return api.get(`${BASE_URL}/employees/offers`, { params });
  },

  // Delete Offer (Employee)
  deleteOfferEmployee: (id) => {
    return api.delete(`${BASE_URL}/employees/offers/${id}`);
  },

  // Offer Update Request functions (Trader)
  createOfferUpdateRequest: (offerId, data) => {
    return api.post(`${BASE_URL}/traders/offers/${offerId}/update-request`, data);
  },

  getTraderOfferUpdateRequests: (params = {}) => {
    return api.get(`${BASE_URL}/traders/offers/update-requests`, { params });
  },

  cancelOfferUpdateRequest: (id) => {
    return api.put(`${BASE_URL}/traders/offers/update-requests/${id}/cancel`);
  },

  // Offer support ticket functions (Trader)
  createOfferSupportTicket: (offerId, data) => {
    return api.post(`${BASE_URL}/traders/offers/${offerId}/support-tickets`, data);
  },

  getTraderOfferSupportTickets: (params = {}) => {
    return api.get(`${BASE_URL}/traders/support-tickets`, { params });
  },

  getOfferSupportTickets: (offerId, params = {}) => {
    return api.get(`${BASE_URL}/traders/offers/${offerId}/support-tickets`, { params });
  },

  getTraderOfferSupportTicketById: (id) => {
    return api.get(`${BASE_URL}/traders/support-tickets/${id}`);
  },

  addTraderOfferSupportTicketMessage: (id, data) => {
    return api.post(`${BASE_URL}/traders/support-tickets/${id}/messages`, data);
  }
};

// ============================================
// OFFER SUPPORT TICKET API
// ============================================

export const offerSupportTicketApi = {
  // Trader methods
  // Create support ticket for an offer
  createTicket: (offerId, data) => {
    return api.post(`${BASE_URL}/traders/offers/${offerId}/support-tickets`, data);
  },

  // Get trader's support tickets
  getTraderTickets: (params = {}) => {
    return api.get(`${BASE_URL}/traders/support-tickets`, { params });
  },

  // Get tickets for specific offer
  getOfferTickets: (offerId, params = {}) => {
    return api.get(`${BASE_URL}/traders/offers/${offerId}/support-tickets`, { params });
  },

  // Get ticket by ID (Trader)
  getTraderTicketById: (id) => {
    return api.get(`${BASE_URL}/traders/support-tickets/${id}`);
  },

  // Add message to ticket (Trader)
  addTraderMessage: (id, data) => {
    return api.post(`${BASE_URL}/traders/support-tickets/${id}/messages`, data);
  }
};

// ============================================
// UPLOAD API
// ============================================

export const uploadApi = {
  // Upload images
  uploadImages: (files) => {
    const formData = new FormData();
    if (Array.isArray(files)) {
      files.forEach(file => {
        formData.append('images', file);
      });
    } else {
      formData.append('images', files);
    }
    return api.post(`${BASE_URL}/upload/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // Upload Excel file
  uploadExcel: (file) => {
    const formData = new FormData();
    formData.append('excel', file);
    return api.post(`${BASE_URL}/upload/excel`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

// ============================================
// DEAL API
// ============================================

export const shippingTrackingApi = {
  getShippingTracking: (dealId) => api.get(`/deals/${dealId}/shipping-tracking`),
};

export const dealApi = {
  // Request negotiation (Client)
  requestNegotiation: (offerId, data = {}) => {
    return api.post(`${BASE_URL}/offers/${offerId}/request-negotiation`, data);
  },

  // Get deals (filtered by role)
  getDeals: (params = {}) => {
    return api.get(`${BASE_URL}/deals`, { params });
  },

  // Get deal by ID
  getDealById: (id) => {
    return api.get(`${BASE_URL}/deals/${id}`);
  },

  // Add deal items (Client/Trader)
  addDealItems: (id, data) => {
    return api.post(`${BASE_URL}/deals/${id}/items`, data);
  },

  // Approve deal (Trader) — send negotiatedAmount in body, query and header so backend always receives it
  approveDeal: (id, data) => {
    const body = data && typeof data === 'object' ? { ...data } : {};
    const amount = body.negotiatedAmount != null ? Number(body.negotiatedAmount) : null;
    if (amount != null && !Number.isNaN(amount)) body.negotiatedAmount = amount;
    const url = `${BASE_URL}/traders/deals/${id}/approve${amount != null && !Number.isNaN(amount) ? `?negotiatedAmount=${encodeURIComponent(String(amount))}` : ''}`;
    const headers = { 'Content-Type': 'application/json' };
    if (amount != null && !Number.isNaN(amount)) headers['X-Negotiated-Amount'] = String(amount);
    return api.put(url, body, { headers });
  },

  // Settle deal (Employee/Admin)
  settleDeal: (id) => {
    return api.put(`${BASE_URL}/deals/${id}/settle`);
  },

  // Send price quote to client (Employee/Admin) — notifies client to view quote
  sendQuoteToClient: (id, data = {}) => {
    return api.post(`${BASE_URL}/deals/${id}/send-quote-to-client`, data);
  },

  // Update deal shipping information
  updateDealShipping: (id, data) => {
    return api.put(`${BASE_URL}/deals/${id}/shipping`, data);
  },

  // Trader: set price & quantity as final (client can only accept or reject)
  setDealPriceQuantityFinal: (id, priceQuantityFinal) => {
    return api.put(`${BASE_URL}/traders/deals/${id}/final-offer`, { priceQuantityFinal: !!priceQuantityFinal });
  }
};

// ============================================
// NEGOTIATION API
// ============================================

export const negotiationApi = {
  // Send negotiation message (Client/Trader)
  sendMessage: (dealId, data) => {
    return api.post(`${BASE_URL}/deals/${dealId}/negotiations`, data);
  },

  // Get negotiation messages
  getMessages: (dealId, params = {}) => {
    return api.get(`${BASE_URL}/deals/${dealId}/negotiations`, { params });
  },

  // Mark messages as read
  markAsRead: (dealId) => {
    return api.put(`${BASE_URL}/deals/${dealId}/negotiations/read`);
  }
};

// ============================================
// FINANCIAL API
// ============================================

export const financialApi = {
  // Process payment (Client)
  processPayment: (dealId, data) => {
    return api.post(`${BASE_URL}/deals/${dealId}/payments`, data);
  },

  // Verify payment (Employee)
  verifyPayment: (paymentId, data) => {
    return api.put(`${BASE_URL}/employees/payments/${paymentId}/verify`, data);
  },

  // Get financial transactions (Admin/Employee)
  getTransactions: (params = {}) => {
    return api.get(`${BASE_URL}/financial/transactions`, { params });
  },

  // Get financial ledger (Admin)
  getLedger: (params = {}) => {
    return api.get(`${BASE_URL}/financial/ledger`, { params });
  }
};

// ============================================
// INVOICE API
// ============================================

export const invoiceApi = {
  // Get invoices by deal
  getInvoicesByDeal: (dealId) => {
    return api.get(`${BASE_URL}/deals/${dealId}/invoices`);
  },

  // Get invoice by ID
  getInvoiceById: (id) => {
    return api.get(`${BASE_URL}/invoices/${id}`);
  },

  // Download invoice PDF
  downloadInvoicePDF: (id) => {
    return api.get(`${BASE_URL}/invoices/${id}/download`, {
      responseType: 'blob'
    });
  }
};


// ============================================
// CATEGORY API
// ============================================

export const categoriesApi = {
  // Get all categories (Public)
  getAll: (params = {}) => {
    return api.get(`${BASE_URL}/categories`, { params });
  },

  // Get category by ID (Public)
  getById: (id) => {
    return api.get(`${BASE_URL}/categories/${id}`);
  },

  // Create category (Admin/Employee)
  create: (data) => {
    return api.post(`${BASE_URL}/categories`, data);
  },

  // Update category (Admin/Employee)
  update: (id, data) => {
    return api.put(`${BASE_URL}/categories/${id}`, data);
  },

  // Delete category (Admin/Employee)
  delete: (id) => {
    return api.delete(`${BASE_URL}/categories/${id}`);
  }
};

// ============================================
// EXPORT ALL
// ============================================

export default {
  employee: employeeApi,
  trader: traderApi,
  offer: offerApi,
  deal: dealApi,
  shippingTracking: shippingTrackingApi,
  negotiation: negotiationApi,
  financial: financialApi,
  categories: categoriesApi,
  // Alias for easier access
  category: categoriesApi,
  offerSupportTicket: offerSupportTicketApi
};

