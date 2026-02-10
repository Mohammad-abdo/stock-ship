import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor - Add auth token (supports multi-role)
api.interceptors.request.use(
  (config) => {
    // Get active role from localStorage (set by MultiAuthContext)
    const activeRole = localStorage.getItem('active_role');
    const path = config.url || window.location.pathname || '';
    
    // Determine which token to use based on active role or endpoint path
    let token = null;
    let roleToUse = null;
    
    // First, try to use active role from context
    if (activeRole) {
      roleToUse = activeRole;
      token = localStorage.getItem(`${activeRole}_token`);
    }
    
    // If no active role token, determine from endpoint path
    if (!token) {
      if (path.includes('/stockship/moderator') || (path.includes('/admin/') && activeRole === 'moderator')) {
         roleToUse = 'moderator';
         token = localStorage.getItem('moderator_token');
      } else if (path.includes('/admin/') || path.includes('/stockship/admin')) {
        roleToUse = 'admin';
        token = localStorage.getItem('admin_token');
      } else if (path.includes('/employees/') || path.includes('/employee') || path.includes('/stockship/employee')) {
        roleToUse = 'employee';
        token = localStorage.getItem('employee_token');
      } else if (path.includes('/traders/') || path.includes('/trader') || path.includes('/stockship/trader')) {
        roleToUse = 'trader';
        token = localStorage.getItem('trader_token');
      } else if (path.includes('/client') || path.includes('/stockship/client') || path.includes('/deals') || path.includes('/offers')) {
        roleToUse = 'client';
        token = localStorage.getItem('client_token');
      }
    }
    
    // Fallback: try all roles in priority order
    if (!token) {
      const tokenOrder = ['admin', 'moderator', 'employee', 'trader', 'client'];
      for (const role of tokenOrder) {
        const roleToken = localStorage.getItem(`${role}_token`);
        if (roleToken) {
          token = roleToken;
          roleToUse = role;
          break;
        }
      }
    }
    
    // Legacy support
    if (!token) {
      token = localStorage.getItem('auth_token');
    }
    
    if (token) {
      // Only set Authorization header if not already set
      if (!config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
      }
      // Add role context to request (useful for debugging)
      if (roleToUse) {
        config.headers['X-User-Role'] = roleToUse;
      }
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
      // Don't clear all tokens, just the one that failed
      // The frontend will handle re-authentication
      if (window.location.pathname !== "/login" && window.location.pathname !== "/multi-login") {
        // Optionally redirect to login
      }
    }
    return Promise.reject(error);
  }
);

export default api;
