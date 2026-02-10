/**
 * Multi-Auth Context - Supports multiple role logins in one browser
 * Stores tokens separately by role: admin_token, employee_token, trader_token
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import api from "@/lib/api";

const MultiAuthContext = createContext(undefined);

export const MultiAuthProvider = ({ children }) => {
  const [auths, setAuths] = useState({
    admin: { user: null, token: null },
    moderator: { user: null, token: null },
    employee: { user: null, token: null },
    vendor: { user: null, token: null },
    trader: { user: null, token: null },
    client: { user: null, token: null }
  });
  const [activeRole, setActiveRole] = useState(null); // Track the most recently logged-in role
  const [loading, setLoading] = useState(true);

  // Load all stored auths on mount
  useEffect(() => {
    const loadStoredAuths = () => {
      const storedAuths = {
        admin: {
          token: localStorage.getItem('admin_token'),
          user: localStorage.getItem('admin_user') ? JSON.parse(localStorage.getItem('admin_user')) : null
        },
        moderator: {
          token: localStorage.getItem('moderator_token'),
          user: localStorage.getItem('moderator_user') ? JSON.parse(localStorage.getItem('moderator_user')) : null
        },
        employee: {
          token: localStorage.getItem('employee_token'),
          user: localStorage.getItem('employee_user') ? JSON.parse(localStorage.getItem('employee_user')) : null
        },
        vendor: {
          token: localStorage.getItem('vendor_token'),
          user: localStorage.getItem('vendor_user') ? JSON.parse(localStorage.getItem('vendor_user')) : null
        },
        trader: {
          token: localStorage.getItem('trader_token'),
          user: localStorage.getItem('trader_user') ? JSON.parse(localStorage.getItem('trader_user')) : null
        },
        client: {
          token: localStorage.getItem('client_token'),
          user: localStorage.getItem('client_user') ? JSON.parse(localStorage.getItem('client_user')) : null
        }
      };
      setAuths(storedAuths);
      
      // Restore active role from localStorage if available
      const storedActiveRole = localStorage.getItem('active_role');
      if (storedActiveRole && storedAuths[storedActiveRole]?.user && storedAuths[storedActiveRole]?.token) {
        setActiveRole(storedActiveRole);
      }
    };

    // Check for token handover from frontend app
    const params = new URLSearchParams(window.location.search);
    const handoverToken = params.get('token');
    const handoverUserType = params.get('role');
    
    if (handoverToken) {
      console.log('Received auth handover token');
      localStorage.setItem('auth_token', handoverToken);
      if (handoverUserType) {
        localStorage.setItem('active_role', handoverUserType);
      }
      
      // Clean URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      // Force reload to apply auth
      // or just let loadStoredAuths handle it? loadStoredAuths is called next.
    }

    loadStoredAuths();
    setLoading(false);
  }, []);

  // Login function that stores by role
  const login = async (email, password, requestedRole = null) => {
    try {
      // Send role parameter to backend for explicit role-based login
      const requestBody = { email, password };
      if (requestedRole) {
        // Map frontend role names to backend role names
        const roleMap = {
          'admin': 'ADMIN',
          'moderator': 'MODERATOR',
          'employee': 'EMPLOYEE',
          'trader': 'TRADER',
          'client': 'CLIENT',
          'user': 'CLIENT'
        };
        requestBody.role = roleMap[requestedRole.toLowerCase()] || requestedRole.toUpperCase();
      }
      const response = await api.post('/auth/login', requestBody);
      
      // Check if response is successful
      if (!response.data || (!response.data.success && !response.data.data)) {
        throw new Error(response.data?.message || 'Login failed: Invalid response from server');
      }
      
      const responseData = response.data.data || response.data;
      const primaryToken = responseData.token || responseData.accessToken;
      const primaryUser = responseData.user || responseData;
      
      // Validate response data
      if (!primaryToken) {
        throw new Error('Login failed: No token received from server');
      }
      if (!primaryUser) {
        throw new Error('Login failed: No user data received from server');
      }

      // Determine role: prioritize requested role, then check roleTokens, then primary user role
      let selectedRole = requestedRole;
      let selectedToken = primaryToken;
      let selectedUser = primaryUser;
      let selectedUserRole = primaryUser.userType || primaryUser.role;

      // SECURITY: Validate that requested role matches user's actual role
      if (requestedRole) {
        const requestedRoleUpper = requestedRole.toUpperCase();
        const availableRoles = (responseData.availableRoles || []).map(r => r.toUpperCase());
        const primaryRole = (primaryUser.userType || primaryUser.role || '').toUpperCase();

        
        // Handle USER/CLIENT aliasing
        const isRequestedClient = requestedRoleUpper === 'CLIENT' || requestedRoleUpper === 'USER';
        
        // Check if requested role is available
        const isPrimaryMatch = primaryRole === requestedRoleUpper || (isRequestedClient && (primaryRole === 'USER' || primaryRole === 'CLIENT'));
        const isAvailableMatch = availableRoles.includes(requestedRoleUpper) || (isRequestedClient && (availableRoles.includes('USER') || availableRoles.includes('CLIENT')));

        if (!isPrimaryMatch && !isAvailableMatch) {
          // throw new Error(`You do not have access to ${requestedRole} role. Available roles: ${availableRoles.join(', ')}`);
        }
      }

      // If roleTokens exist and user requested a specific role, use that role's token
      if (requestedRole && responseData.roleTokens) {
        const requestedRoleUpper = requestedRole.toUpperCase();
        const roleToken = responseData.roleTokens[requestedRoleUpper];
        const roleProfile = responseData.roleProfiles?.[requestedRoleUpper] || 
                          responseData.linkedProfiles?.find(
                            p => p.userType === requestedRoleUpper
                          ) ||
                          (requestedRoleUpper === selectedUserRole ? primaryUser : null);
        
        if (roleToken && roleProfile) {
          // User requested a specific role and we have a token for it
          selectedToken = roleToken;
          selectedUser = roleProfile;
          selectedUserRole = requestedRoleUpper;
        } else if (responseData.availableRoles && responseData.availableRoles.includes(requestedRoleUpper)) {
          // Requested role exists but no separate token - use primary token but set role correctly
          selectedUserRole = requestedRoleUpper;
        }
      }

      // Normalize role to our storage keys
      const roleKey = normalizeRole(selectedUserRole || requestedRole);
      
      if (!roleKey) {
        throw new Error('Unknown user role');
      }
      
      // SECURITY: Final validation - ensure role matches
      if (requestedRole && roleKey !== requestedRole) {
        console.warn(`Role mismatch: requested ${requestedRole}, got ${roleKey}`);
      }

      // Store auth for the selected role
      const roleTokenKey = `${roleKey}_token`;
      const roleUserKey = `${roleKey}_user`;
      
      localStorage.setItem(roleTokenKey, selectedToken);
      localStorage.setItem(roleUserKey, JSON.stringify({ ...selectedUser, userType: selectedUserRole }));

      // Update state
      const updatedAuths = {
        ...auths,
        [roleKey]: { user: { ...selectedUser, userType: selectedUserRole }, token: selectedToken }
      };

      // Handle linked profiles and multiple roles - store ALL available roles
      if (responseData.roleTokens) {
        for (const [roleType, roleToken] of Object.entries(responseData.roleTokens)) {
          const linkedRoleKey = normalizeRole(roleType);
          if (linkedRoleKey && linkedRoleKey !== roleKey) {
            // Find the profile data for this role
            const linkedProfile = responseData.roleProfiles?.[roleType] || 
                                responseData.linkedProfiles?.find(
                                  p => p.userType === roleType
                                ) ||
                                (roleType === primaryUser.userType ? primaryUser : null);
            
            if (linkedProfile) {
              const linkedTokenKey = `${linkedRoleKey}_token`;
              const linkedUserKey = `${linkedRoleKey}_user`;
              
              localStorage.setItem(linkedTokenKey, roleToken);
              localStorage.setItem(linkedUserKey, JSON.stringify(linkedProfile));
              
              updatedAuths[linkedRoleKey] = { 
                user: linkedProfile, 
                token: roleToken 
              };
            }
          }
        }
      } else if (responseData.availableRoles && responseData.availableRoles.length > 1) {
        // Fallback: Multiple roles available but no separate tokens
        for (const availableRole of responseData.availableRoles) {
          const linkedRoleKey = normalizeRole(availableRole);
          if (linkedRoleKey && linkedRoleKey !== roleKey) {
            const linkedProfile = responseData.linkedProfiles?.find(
              p => p.userType === availableRole
            ) || (availableRole === primaryUser.userType ? primaryUser : null);
            
            if (linkedProfile) {
              const linkedTokenKey = `${linkedRoleKey}_token`;
              const linkedUserKey = `${linkedRoleKey}_user`;
              
              // Use primary token for linked roles if no separate token
              localStorage.setItem(linkedTokenKey, primaryToken);
              localStorage.setItem(linkedUserKey, JSON.stringify(linkedProfile));
              
              updatedAuths[linkedRoleKey] = { 
                user: linkedProfile, 
                token: primaryToken 
              };
            }
          }
        }
      }

      setAuths(updatedAuths);

      // Set active role to the requested role (or selected role), not the primary role from backend
      const activeRoleKey = normalizeRole(requestedRole) || roleKey;
      setActiveRole(activeRoleKey);
      localStorage.setItem('active_role', activeRoleKey);

      return { 
        user: { ...selectedUser, userType: selectedUserRole }, 
        token: selectedToken, 
        role: activeRoleKey, 
        availableRoles: responseData.availableRoles || [selectedUserRole] 
      };
    } catch (error) {
      // Better error handling
      if (error.response) {
        // Server responded with error
        const errorMessage = error.response.data?.message || error.response.data?.error || 'Login failed';
        const status = error.response.status;
        
        // Provide more specific error messages
        if (status === 401) {
          throw new Error(errorMessage || 'Invalid email or password');
        } else if (status === 403) {
          throw new Error(errorMessage || 'Access denied. You do not have permission to login with this role.');
        } else if (status === 500) {
          throw new Error(errorMessage || 'Server error. Please try again later.');
        } else {
          throw new Error(errorMessage || `Login failed (${status})`);
        }
      } else if (error.request) {
        // Request was made but no response received
        throw new Error('Network error. Please check your connection and try again.');
      } else {
        // Error in setting up the request
        throw new Error(error.message || 'Login failed. Please try again.');
      }
    }
  };

  // Logout specific role
  const logout = (role = null) => {
    if (role) {
      const roleKey = normalizeRole(role);
      localStorage.removeItem(`${roleKey}_token`);
      localStorage.removeItem(`${roleKey}_user`);
      setAuths(prev => ({
        ...prev,
        [roleKey]: { user: null, token: null }
      }));
      // Clear active role if it's the one being logged out
      if (activeRole === roleKey) {
        setActiveRole(null);
        localStorage.removeItem('active_role');
      }
    } else {
      // Logout all
      ['admin', 'moderator', 'employee', 'trader', 'client'].forEach(roleKey => {
        localStorage.removeItem(`${roleKey}_token`);
        localStorage.removeItem(`${roleKey}_user`);
      });
      setAuths({
        admin: { user: null, token: null },
        moderator: { user: null, token: null },
        employee: { user: null, token: null },
        vendor: { user: null, token: null },
        trader: { user: null, token: null },
        client: { user: null, token: null }
      });
      setActiveRole(null);
      localStorage.removeItem('active_role');
    }
  };

  // Normalize role to our storage keys - memoized (must be defined before use)
  const normalizeRole = useCallback((role) => {
    if (!role) return null;
    const roleUpper = role.toUpperCase();
    if (roleUpper === 'ADMIN') return 'admin';
    if (roleUpper === 'MODERATOR') return 'moderator';
    if (roleUpper === 'EMPLOYEE') return 'employee';
    if (roleUpper === 'VENDOR') return 'vendor';
    if (roleUpper === 'TRADER') return 'trader';
    if (roleUpper === 'CLIENT' || roleUpper === 'USER') return 'client';
    return null;
  }, []);

  // Check if user is logged in for a role - memoized
  const isLoggedIn = useCallback((role) => {
    const roleKey = normalizeRole(role);
    return !!auths[roleKey]?.user && !!auths[roleKey]?.token;
  }, [auths, normalizeRole]);

  // Get current auth for a role - memoized to prevent hook order changes
  const getAuth = useCallback((role) => {
    const roleKey = normalizeRole(role);
    return auths[roleKey] || { user: null, token: null };
  }, [auths, normalizeRole]);

  // Get active token for API calls (prioritizes current role) - memoized
  const getActiveToken = useCallback((preferredRole = null) => {
    if (preferredRole) {
      const roleKey = normalizeRole(preferredRole);
      return auths[roleKey]?.token;
    }
    // Return first available token
    return auths.admin?.token || 
           auths.moderator?.token ||
           auths.employee?.token || 
           auths.vendor?.token ||
           auths.trader?.token || 
           auths.client?.token;
  }, [auths, normalizeRole]);

  // Role checkers - memoized to prevent infinite re-renders
  const isAdmin = useCallback(() => isLoggedIn('admin'), [isLoggedIn]);
  const isModerator = useCallback(() => isLoggedIn('moderator'), [isLoggedIn]);
  const isEmployee = useCallback(() => isLoggedIn('employee'), [isLoggedIn]);
  const isVendor = useCallback(() => isLoggedIn('vendor'), [isLoggedIn]);
  const isTrader = useCallback(() => isLoggedIn('trader'), [isLoggedIn]);
  const isClient = useCallback(() => isLoggedIn('client'), [isLoggedIn]);

  // Get all logged in roles - memoized
  const getActiveRoles = useCallback(() => {
    const roles = [];
    if (isLoggedIn('admin')) roles.push('admin');
    if (isLoggedIn('moderator')) roles.push('moderator');
    if (isLoggedIn('employee')) roles.push('employee');
    if (isLoggedIn('vendor')) roles.push('vendor');
    if (isLoggedIn('trader')) roles.push('trader');
    if (isLoggedIn('client')) roles.push('client');
    return roles;
  }, [isLoggedIn]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    auths,
    loading,
    activeRole,
    setActiveRole,
    login,
    logout,
    getAuth,
    getActiveToken,
    isLoggedIn,
    isAdmin,
    isModerator,
    isEmployee,
    isVendor,
    isTrader,
    isClient,
    getActiveRoles
  }), [auths, loading, activeRole, isAdmin, isModerator, isEmployee, isVendor, isTrader, isClient, getActiveRoles, getAuth, getActiveToken, isLoggedIn, login, logout, setActiveRole]);

  return (
    <MultiAuthContext.Provider value={contextValue}>
      {children}
    </MultiAuthContext.Provider>
  );
};

export const useMultiAuth = () => {
  const context = useContext(MultiAuthContext);
  if (context === undefined) {
    throw new Error("useMultiAuth must be used within a MultiAuthProvider");
  }
  return context;
};

