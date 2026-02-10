import { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "@/lib/stockshipApi";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        // Determine user role - Stockship uses userType (ADMIN, VENDOR, USER)
        let userRole = parsedUser.userType || parsedUser.role;
        if (!userRole && parsedUser.role_names && Array.isArray(parsedUser.role_names) && parsedUser.role_names.length > 0) {
          // Stockship roles priority: ADMIN > VENDOR > USER
          if (parsedUser.role_names.includes('ADMIN') || parsedUser.role_names.includes('admin')) {
            userRole = 'ADMIN';
          } else if (parsedUser.role_names.includes('VENDOR') || parsedUser.role_names.includes('vendor')) {
            userRole = 'VENDOR';
          } else if (parsedUser.role_names.includes('USER') || parsedUser.role_names.includes('user')) {
            userRole = 'USER';
          } else {
            // Legacy roles
            if (parsedUser.role_names.includes('doctor')) {
              userRole = 'doctor';
            } else if (parsedUser.role_names.includes('representative')) {
              userRole = 'representative';
            } else {
              userRole = parsedUser.role_names[0];
            }
          }
        }
        
        const userWithRole = {
          ...parsedUser,
          userType: userRole || parsedUser.userType,
          role: userRole || parsedUser.role,
        };
        setToken(storedToken);
        setUser(userWithRole);
        verifyToken(storedToken);
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (tokenToVerify) => {
    try {
      const response = await authApi.me();
      const userData = response.data.data || response.data;
      
      // Decode token to get userType
      let userTypeFromToken = null;
      try {
        const tokenParts = tokenToVerify.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          userTypeFromToken = payload.userType;
        }
      } catch (e) {
        console.error('Error decoding token:', e);
      }
      
      // Determine user role - Stockship uses userType (ADMIN, VENDOR, USER)
      let userRole = userTypeFromToken || userData.userType || userData.role;
      if (!userRole && userData.role_names && Array.isArray(userData.role_names) && userData.role_names.length > 0) {
        // Stockship roles priority: ADMIN > VENDOR > USER
        if (userData.role_names.includes('ADMIN') || userData.role_names.includes('admin')) {
          userRole = 'ADMIN';
        } else if (userData.role_names.includes('VENDOR') || userData.role_names.includes('vendor')) {
          userRole = 'VENDOR';
        } else if (userData.role_names.includes('USER') || userData.role_names.includes('user')) {
          userRole = 'USER';
        } else {
          // Legacy roles
          if (userData.role_names.includes('doctor')) {
            userRole = 'doctor';
          } else if (userData.role_names.includes('representative')) {
            userRole = 'representative';
          } else {
            userRole = userData.role_names[0];
          }
        }
      }
      
      const userWithRole = {
        ...userData,
        userType: userRole || userTypeFromToken || userData.userType,
        role: userRole || userData.role,
      };
      
      // Update localStorage with the verified user data
      localStorage.setItem("auth_user", JSON.stringify(userWithRole));
      setUser(userWithRole);
      setToken(tokenToVerify);
    } catch (error) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authApi.login(email, password);
      // Stockship backend response format: { success: true, data: { token, user }, message }
      const responseData = response.data.data || response.data;
      const newToken = responseData.token || responseData.accessToken;
      const newUser = responseData.user || responseData;
      
      // Decode token to get userType
      let userTypeFromToken = null;
      try {
        if (newToken) {
          const tokenParts = newToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            userTypeFromToken = payload.userType;
          }
        }
      } catch (e) {
        console.error('Error decoding token:', e);
      }
      
      // Determine user role - Stockship uses userType (ADMIN, VENDOR, USER)
      let userRole = userTypeFromToken || newUser.userType || newUser.role;
      if (!userRole && newUser.role_names && Array.isArray(newUser.role_names) && newUser.role_names.length > 0) {
        // Stockship roles priority: ADMIN > VENDOR > USER
        if (newUser.role_names.includes('ADMIN') || newUser.role_names.includes('admin')) {
          userRole = 'ADMIN';
        } else if (newUser.role_names.includes('VENDOR') || newUser.role_names.includes('vendor')) {
          userRole = 'VENDOR';
        } else if (newUser.role_names.includes('USER') || newUser.role_names.includes('user')) {
          userRole = 'USER';
        } else {
          // Legacy roles
          if (newUser.role_names.includes('doctor')) {
            userRole = 'doctor';
          } else if (newUser.role_names.includes('representative')) {
            userRole = 'representative';
          } else {
            userRole = newUser.role_names[0];
          }
        }
      }

      const userWithRole = {
        ...newUser,
        userType: userRole || userTypeFromToken || newUser.userType,
        role: userRole || newUser.role,
      };

      localStorage.setItem("auth_token", newToken);
      localStorage.setItem("auth_user", JSON.stringify(userWithRole));

      setToken(newToken);
      setUser(userWithRole);
      
      return userWithRole; // Return user for navigation
    } catch (error) {
      throw new Error(error.response?.data?.message || "Login failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setUser(null);
    setToken(null);
  };

  // Stockship roles: ADMIN, VENDOR, USER
  const userType = user?.userType || user?.role;
  const isAdmin = userType === "ADMIN" || user?.role === "admin" || user?.role === "ADMIN" || 
    (user?.role_names && (user.role_names.includes("ADMIN") || user.role_names.includes("admin")));
  const isVendor = userType === "VENDOR" || user?.role === "vendor" || user?.role === "VENDOR" || 
    (user?.role_names && (user.role_names.includes("VENDOR") || user.role_names.includes("vendor")));
  const isUser = userType === "USER" || user?.role === "user" || user?.role === "USER" || 
    (!isAdmin && !isVendor && user);
  
  // Legacy roles (for backward compatibility)
  const isDoctor = user?.role === "doctor" || (user?.role_names && user.role_names.includes("doctor"));
  const isRepresentative = user?.role === "representative" || (user?.role_names && user.role_names.includes("representative"));

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAdmin,
        isVendor,
        isUser,
        // Legacy support
        isDoctor,
        isRepresentative,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
