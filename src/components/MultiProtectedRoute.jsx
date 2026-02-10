import { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useMultiAuth } from '@/contexts/MultiAuthContext';
import { AlertTriangle, Shield } from 'lucide-react';

export const MultiProtectedRoute = ({ 
  children, 
  requireAdmin = false, 
  requireEmployee = false, 
  requireTrader = false,
  requireModerator = false,
  requireClient = false,
  requireVendor = false
}) => {
  const { loading, isAdmin, isEmployee, isTrader, isClient, isModerator, isVendor, activeRole } = useMultiAuth();
  const location = useLocation();

  // Memoize auth checks to prevent infinite re-renders
  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  const hasAnyAuth = useMemo(() => {
    return isAdmin() || isEmployee() || isTrader() || isClient() || isModerator() || isVendor();
  }, [isAdmin, isEmployee, isTrader, isClient, isModerator, isVendor]);

  // STRICT ROLE CHECKING: User must have the role AND it must be the active role
  // This prevents traders/employees from accessing admin routes even if they have admin token stored
  const isAdminUser = useMemo(() => {
    if (!isAdmin()) return false;
    // STRICT: activeRole MUST be 'admin' to access admin routes
    return activeRole === 'admin';
  }, [isAdmin, activeRole]);
  
  const isEmployeeUser = useMemo(() => {
    if (!isEmployee()) return false;
    // STRICT: activeRole MUST be 'employee' to access employee routes
    return activeRole === 'employee';
  }, [isEmployee, activeRole]);
  
  const isTraderUser = useMemo(() => {
    if (!isTrader()) return false;
    // STRICT: activeRole MUST be 'trader' to access trader routes
    return activeRole === 'trader';
  }, [isTrader, activeRole]);
  
  const isClientUser = useMemo(() => {
    if (!isClient()) return false;
    // STRICT: activeRole MUST be 'client' to access client routes
    return activeRole === 'client';
  }, [isClient, activeRole]);

  const isModeratorUser = useMemo(() => {
    if (!isModerator()) return false;
    // STRICT: activeRole MUST be 'moderator'
    return activeRole === 'moderator';
  }, [isModerator, activeRole]);

  const isVendorUser = useMemo(() => {
    if (!isVendor()) return false;
    return activeRole === 'vendor';
  }, [isVendor, activeRole]);

  // Helper to get correct dashboard route based on activeRole - memoized
  // MUST be before early returns to maintain hook order
  const getCorrectDashboard = useMemo(() => {
    // STRICT: Only redirect to dashboard if activeRole matches
    if (activeRole === 'admin' && isAdmin()) return "/stockship/admin/dashboard";
    if (activeRole === 'modeartor' && isModerator()) return "/stockship/moderator/dashboard";
    if (activeRole === 'employee' && isEmployee()) return "/stockship/employee/dashboard";
    if (activeRole === 'vendor' && isVendor()) return "/stockship/vendor/dashboard";
    if (activeRole === 'trader' && isTrader()) return "/stockship/trader/dashboard";
    if (activeRole === 'client' && isClient()) return "/stockship/client/dashboard";
    
    // Fallback: check all roles and redirect to first available
    if (isAdmin()) return "/stockship/admin/dashboard";
    if (isModerator()) return "/stockship/moderator/dashboard";
    if (isEmployee()) return "/stockship/employee/dashboard";
    if (isVendor()) return "/stockship/vendor/dashboard";
    if (isTrader()) return "/stockship/trader/dashboard";
    if (isClient()) return "/stockship/client/dashboard";
    
    return "/admin/login";
  }, [activeRole, isAdmin, isEmployee, isTrader, isClient, isVendor, isModerator]);

  // Early returns AFTER all hooks
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasAnyAuth) {
    if (requireClient || requireTrader) {
      return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  // STRICT ROLE ENFORCEMENT: Check specific role requirements
  if (requireAdmin) {
    if (!isAdminUser) {
      // Show access denied message for unauthorized access attempts
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center max-w-md p-8">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <Shield className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-4">
              Only administrators can access this page. You are currently logged in as {activeRole || 'unknown role'}.
            </p>
            <button
              onClick={() => window.location.href = getCorrectDashboard}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Your Dashboard
            </button>
          </div>
        </div>
      );
    }
  }

  if (requireEmployee) {
    if (!isEmployeeUser) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center max-w-md p-8">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <Shield className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-4">
              Only employees can access this page. You are currently logged in as {activeRole || 'unknown role'}.
            </p>
            <button
              onClick={() => window.location.href = getCorrectDashboard}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Your Dashboard
            </button>
          </div>
        </div>
      );
    }
  }

  if (requireTrader) {
    if (!isTraderUser) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center max-w-md p-8">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <Shield className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-4">
              Only traders can access this page. You are currently logged in as {activeRole || 'unknown role'}.
            </p>
            <button
              onClick={() => window.location.href = getCorrectDashboard}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Your Dashboard
            </button>
          </div>
        </div>
      );
    }
  }

  if (requireClient) {
    if (!isClientUser) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center max-w-md p-8">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <Shield className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-4">
              Only clients can access this page. You are currently logged in as {activeRole || 'unknown role'}.
            </p>
            <button
              onClick={() => window.location.href = getCorrectDashboard}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Your Dashboard
            </button>
          </div>
        </div>
      );
    }
  }

  if (requireModerator) {
    if (!isModeratorUser) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center max-w-md p-8">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <Shield className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-4">
              Only moderators can access this page. You are currently logged in as {activeRole || 'unknown role'}.
            </p>
            <button
              onClick={() => window.location.href = getCorrectDashboard}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Your Dashboard
            </button>
          </div>
        </div>
      );
    }
  }

  if (requireVendor) {
    if (!isVendorUser) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center max-w-md p-8">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <Shield className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-4">
              Only vendors can access this page. You are currently logged in as {activeRole || 'unknown role'}.
            </p>
            <button
              onClick={() => window.location.href = getCorrectDashboard}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Your Dashboard
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

