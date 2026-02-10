import React, { useMemo } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { MultiAuthProvider, useMultiAuth } from "./contexts/MultiAuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { VendorProvider } from "./components/VendorProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MultiProtectedRoute } from "./components/MultiProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import ModeratorLogin from "./pages/ModeratorLogin";
import EmployeeLogin from "./pages/EmployeeLogin";
import TraderLogin from "./pages/TraderLogin";

import StockshipAdminLayout from "./components/StockshipAdminLayout";
import StockshipVendorLayout from "./components/StockshipVendorLayout";
import StockshipEmployeeLayout from "./components/StockshipEmployeeLayout";
import StockshipTraderLayout from "./components/StockshipTraderLayout";
import { Toaster } from "sonner";
import ModeratorDashboard from "./pages/moderator/ModeratorDashboard";
import ModeratorTraders from "./pages/moderator/ModeratorTraders";
import ModeratorReports from "./pages/moderator/ModeratorReports";
import ModeratorSettings from "./pages/moderator/ModeratorSettings";
import ModeratorLayout from "./components/ModeratorLayout";
import StockshipModeratorLayout from "./components/StockshipModeratorLayout";

// Removed e-commerce frontend pages - not related to mediation platform

// Stockship Admin Pages
import StockshipAdminDashboard from "./pages/stockship/admin/AdminDashboard";
import StockshipAdminUsers from "./pages/stockship/admin/AdminUsers";
import CreateUser from "./pages/stockship/admin/CreateUser";
import EditUser from "./pages/stockship/admin/EditUser";
import StockshipAdminVendors from "./pages/stockship/admin/AdminVendors";
import StockshipAdminProducts from "./pages/stockship/admin/AdminProducts";
import CreateProduct from "./pages/stockship/admin/CreateProduct";
import EditProduct from "./pages/stockship/admin/EditProduct";
import DeleteProduct from "./pages/stockship/admin/DeleteProduct";
import ViewProduct from "./pages/stockship/admin/ViewProduct";
import StockshipAdminCategories from "./pages/stockship/admin/AdminCategories";
import AdminSliders from "./pages/stockship/admin/AdminSliders";
import CreateSlider from "./pages/stockship/admin/CreateSlider";
import EditSlider from "./pages/stockship/admin/EditSlider";
import ViewSlider from "./pages/stockship/admin/ViewSlider";
import AdminVideoAds from "./pages/stockship/admin/AdminVideoAds";
import CreateVideoAd from "./pages/stockship/admin/CreateVideoAd";
import EditVideoAd from "./pages/stockship/admin/EditVideoAd";
import AdminVideoAdDetails from "./pages/stockship/admin/AdminVideoAdDetails";
import CreateCategory from "./pages/stockship/admin/CreateCategory";
import EditCategory from "./pages/stockship/admin/EditCategory";
import ViewCategory from "./pages/stockship/admin/ViewCategory";
import ViewUser from "./pages/stockship/admin/ViewUser";
import ViewOrder from "./pages/stockship/admin/ViewOrder";
import AdminRolesPermissions from "./pages/stockship/admin/AdminRolesPermissions";
import ViewVendor from "./pages/stockship/admin/ViewVendor";
import CreateVendor from "./pages/stockship/admin/CreateVendor";
import EditVendor from "./pages/stockship/admin/EditVendor";
import DeleteVendor from "./pages/stockship/admin/DeleteVendor";
import StockshipAdminOrders from "./pages/stockship/admin/AdminOrders";
import StockshipAdminPayments from "./pages/stockship/admin/AdminPayments";
import StockshipAdminWallets from "./pages/stockship/admin/AdminWallets";
import StockshipAdminCoupons from "./pages/stockship/admin/AdminCoupons";
import CreateCoupon from "./pages/stockship/admin/CreateCoupon";
import EditCoupon from "./pages/stockship/admin/EditCoupon";
import StockshipAdminOffers from "./pages/stockship/admin/AdminOffers";
import AdminEmployees from "./pages/stockship/admin/AdminEmployees";
import AdminTraders from "./pages/stockship/admin/AdminTraders";
import AdminDeals from "./pages/stockship/admin/AdminDeals";
import ViewTrader from "./pages/stockship/admin/ViewTrader";
import ViewEmployee from "./pages/stockship/admin/ViewEmployee";
import CreateEmployee from "./pages/stockship/admin/CreateEmployee";
import EditEmployee from "./pages/stockship/admin/EditEmployee";
import ViewOffer from "./pages/stockship/admin/ViewOffer";
import ViewPayment from "./pages/stockship/admin/ViewPayment";
import ViewDeal from "./pages/stockship/admin/ViewDeal";
import AdminShippingCompanies from "./pages/stockship/admin/AdminShippingCompanies";
import CreateShippingCompany from "./pages/stockship/admin/CreateShippingCompany";
import EditShippingCompany from "./pages/stockship/admin/EditShippingCompany";
import ViewShippingCompany from "./pages/stockship/admin/ViewShippingCompany";
import AdminShippingTracking from "./pages/stockship/admin/AdminShippingTracking";
import ViewShippingTracking from "./pages/stockship/admin/ViewShippingTracking";
import StockshipAdminAnalytics from "./pages/stockship/admin/AdminAnalytics";
import StockshipAdminContent from "./pages/stockship/admin/AdminContent";
import StockshipAdminSEO from "./pages/stockship/admin/AdminSEO";
import StockshipAdminTranslations from "./pages/stockship/admin/AdminTranslations";
import StockshipAdminSettings from "./pages/stockship/admin/AdminSettings";
import StockshipAdminSupportTickets from "./pages/stockship/admin/AdminSupportTickets";
import StockshipAdminReports from "./pages/stockship/admin/AdminReports";
import ViewReport from "./pages/stockship/admin/ViewReport";
import AdminActivityLogs from "./pages/stockship/admin/AdminActivityLogs";
import ViewActivityLog from "./pages/stockship/admin/ViewActivityLog";

// Stockship Vendor Pages
import VendorDashboard from "./pages/stockship/vendor/VendorDashboard";
import VendorProducts from "./pages/stockship/vendor/VendorProducts";
import VendorOrders from "./pages/stockship/vendor/VendorOrders";
import VendorInventory from "./pages/stockship/vendor/VendorInventory";
import VendorWallet from "./pages/stockship/vendor/VendorWallet";
import VendorNegotiations from "./pages/stockship/vendor/VendorNegotiations";
import VendorPriceRequests from "./pages/stockship/vendor/VendorPriceRequests";
import VendorCoupons from "./pages/stockship/vendor/VendorCoupons";
import VendorOffers from "./pages/stockship/vendor/VendorOffers";
import VendorAnalytics from "./pages/stockship/vendor/VendorAnalytics";
import VendorProfile from "./pages/stockship/vendor/VendorProfile";
import VendorSettings from "./pages/stockship/vendor/VendorSettings";

// Mediation Platform Pages
import EmployeeDashboard from "./pages/stockship/employee/EmployeeDashboard";
import EmployeeTraders from "./pages/stockship/employee/EmployeeTraders";
import EmployeeDeals from "./pages/stockship/employee/EmployeeDeals";
import EmployeeTraderUpdateRequests from "./pages/stockship/employee/EmployeeTraderUpdateRequests";
import ViewTraderUpdateRequest from "./pages/stockship/employee/ViewTraderUpdateRequest";
import EmployeeOfferUpdateRequests from "./pages/stockship/employee/EmployeeOfferUpdateRequests";
import ViewOfferUpdateRequest from "./pages/stockship/employee/ViewOfferUpdateRequest";
import EmployeeOfferSupportTickets from "./pages/stockship/employee/EmployeeOfferSupportTickets";
import CreateOfferSupportTicketEmployee from "./pages/stockship/employee/CreateOfferSupportTicket";
import ViewOfferSupportTicketEmployee from "./pages/stockship/employee/ViewOfferSupportTicket";
import CreateTrader from "./pages/stockship/employee/CreateTrader";
import EmployeeViewTrader from "./pages/stockship/employee/ViewTrader";
import EmployeeViewDeal from "./pages/stockship/employee/ViewDeal";
import DealPriceQuotePage from "./pages/stockship/employee/DealPriceQuotePage";
import EmployeeOffers from "./pages/stockship/employee/EmployeeOffers";
import EmployeeViewOffer from "./pages/stockship/employee/EmployeeViewOffer";
import EmployeeShippingTracking from "./pages/stockship/employee/EmployeeShippingTracking";
import EmployeeViewShippingTracking from "./pages/stockship/employee/EmployeeViewShippingTracking";
import EmployeePayments from "./pages/stockship/employee/EmployeePayments";
import EmployeeViewPayment from "./pages/stockship/employee/EmployeeViewPayment";
import EmployeeSettings from "./pages/stockship/employee/EmployeeSettings";
import EmployeeCategories from "./pages/stockship/employee/EmployeeCategories";
import EmployeeCreateCategory from "./pages/stockship/employee/CreateCategory";
import EmployeeEditCategory from "./pages/stockship/employee/EditCategory";
import EmployeeViewCategory from "./pages/stockship/employee/ViewCategory";
import NotFound from "./pages/ErrorPages/NotFound";
import ServerError from "./pages/ErrorPages/ServerError";
import Forbidden from "./pages/ErrorPages/Forbidden";
import TraderDashboard from "./pages/stockship/trader/TraderDashboard";
import TraderOffers from "./pages/stockship/trader/TraderOffers";
import CreateOffer from "./pages/stockship/trader/CreateOffer";
import TraderViewOffer from "./pages/stockship/trader/TraderViewOffer";
import TraderEditOfferRequest from "./pages/stockship/trader/TraderEditOfferRequest";
import TraderOfferSupportTickets from "./pages/stockship/trader/TraderOfferSupportTickets";
import TraderViewOfferSupportTicket from "./pages/stockship/trader/ViewOfferSupportTicket";
import CreateOfferSupportTicket from "./pages/stockship/trader/CreateOfferSupportTicket";
import TraderDeals from "./pages/stockship/trader/TraderDeals";
import TraderViewDeal from "./pages/stockship/trader/TraderViewDeal";
import TraderPayments from "./pages/stockship/trader/TraderPayments";
import TraderSettings from "./pages/stockship/trader/TraderSettings";
import TraderUpdateRequest from "./pages/stockship/trader/TraderUpdateRequest";

import StockshipClientLayout from "./components/StockshipClientLayout";
import ClientDashboard from "./pages/stockship/client/ClientDashboard";
import ClientViewOffer from "./pages/stockship/client/ClientViewOffer";
import ClientViewDeal from "./pages/stockship/client/ClientViewDeal";
import ClientDealQuotePage from "./pages/stockship/client/ClientDealQuotePage";
import ClientDeals from "./pages/stockship/client/ClientDeals";
import ClientSettings from "./pages/stockship/client/ClientSettings";
import LandingPage from "./pages/LandingPage";
import PublicViewOffer from "./pages/PublicViewOffer";



function AppRoutes() {
  const { user, loading: authLoading } = useAuth();
  const { loading: multiAuthLoading, isAdmin, isEmployee, isTrader, isClient, isVendor, isModerator, activeRole } = useMultiAuth();

  const loading = authLoading || multiAuthLoading;

  // Memoize getDefaultRoute to prevent infinite re-renders - MUST be before conditional return
  const getDefaultRoute = useMemo(() => {
    // ALWAYS prioritize activeRole first (what the user selected/currently using)
    if (activeRole === 'admin' && isAdmin()) return "/stockship/admin/dashboard";
    if (activeRole === 'employee' && isEmployee()) return "/stockship/employee/dashboard";
    if (activeRole === 'trader' && isTrader()) return "/stockship/trader/dashboard";
    if (activeRole === 'client' && isClient()) return "/stockship/client/dashboard";
    
    // If activeRole is set but doesn't match any logged-in role, check other roles
    // But prioritize by what's actually logged in, not by default priority
    if (isAdmin()) return "/stockship/admin/dashboard";
    if (isTrader()) return "/stockship/trader/dashboard";
    if (isEmployee()) return "/stockship/employee/dashboard";
    if (isClient()) return "/stockship/client/dashboard";
    
    // Fallback to old AuthContext for legacy roles
    if (!user) return "/login";
    
    // Stockship roles (userType: ADMIN, VENDOR, USER)
    const userType = user.userType || user.role;
    const hasAdminRole = userType === "ADMIN" || userType === "admin" || 
      (user.role_names && Array.isArray(user.role_names) && 
       (user.role_names.includes("ADMIN") || user.role_names.includes("admin")));
    const hasVendorRole = userType === "VENDOR" || userType === "vendor" || 
      (user.role_names && Array.isArray(user.role_names) && 
       (user.role_names.includes("VENDOR") || user.role_names.includes("vendor")));
    
    if (activeRole === 'admin' && isAdmin()) return "/stockship/admin/dashboard";
    if (activeRole === 'employee' && isEmployee()) return "/stockship/employee/dashboard";
    if (activeRole === 'moderator' && isModerator()) return "/stockship/moderator/dashboard";
    if (activeRole === 'vendor' && isVendor()) return "/stockship/vendor/dashboard";
    if (activeRole === 'trader' && isTrader()) return "/stockship/trader/dashboard";
    if (activeRole === 'client' && isClient()) return "/stockship/client/dashboard";
    
    // If activeRole is set but doesn't match any logged-in role, check other roles
    if (isAdmin()) return "/stockship/admin/dashboard";
    if (isModerator()) return "/stockship/moderator/dashboard";
    if (isEmployee()) return "/stockship/employee/dashboard";
    if (isVendor()) return "/stockship/vendor/dashboard";
    if (isTrader()) return "/stockship/trader/dashboard";
    if (isClient()) return "/stockship/client/dashboard";
    
    // Fallback to old AuthContext for legacy roles
    if (!user) return "/login";
    

    
    // Stockship routes
    if (hasAdminRole) return "/stockship/admin/dashboard";
    if (hasVendorRole) return "/stockship/vendor/dashboard";
    
    return "/login";
  }, [activeRole, isAdmin, isEmployee, isTrader, isClient, isVendor, isModerator, user]);

  return (
    <Routes>
      <Route
        path="/login"
        element={<Navigate to="/admin/login" replace />}
      />
      <Route
        path="/admin/login"
        element={isAdmin() ? <Navigate to={getDefaultRoute} replace /> : <AdminLogin />}
      />
      <Route
        path="/moderator/login"
        element={isModerator() ? <Navigate to={getDefaultRoute} replace /> : <ModeratorLogin />}
      />
      <Route
        path="/employee/login"
        element={isEmployee() ? <Navigate to={getDefaultRoute} replace /> : <EmployeeLogin />}
      />
      <Route
        path="/trader/login"
        element={isTrader() ? <Navigate to={getDefaultRoute} replace /> : <TraderLogin />}
      />

      {/* Moderator Routes */}
      <Route
        path="/stockship/moderator/dashboard"
        element={
          <MultiProtectedRoute requireModerator>
            <StockshipModeratorLayout>
              <ModeratorDashboard />
            </StockshipModeratorLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/moderator/traders"
        element={
          <MultiProtectedRoute requireModerator>
            <StockshipModeratorLayout>
              <ModeratorTraders />
            </StockshipModeratorLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/moderator/reports"
        element={
          <MultiProtectedRoute requireModerator>
            <StockshipModeratorLayout>
              <ModeratorReports />
            </StockshipModeratorLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/moderator/settings"
        element={
          <MultiProtectedRoute requireModerator>
            <StockshipModeratorLayout>
              <ModeratorSettings />
            </StockshipModeratorLayout>
          </MultiProtectedRoute>
        }
      />
      
      {/* Stockship Admin Routes */}
      <Route
        path="/stockship/admin/dashboard"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <StockshipAdminDashboard />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/employees"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <AdminEmployees />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/employees/create"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <CreateEmployee />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/employees/:id/view"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <ViewEmployee />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/employees/:id/edit"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <EditEmployee />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/traders"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <AdminTraders />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/traders/:id/view"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <ViewTrader />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/offers"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <StockshipAdminOffers />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/offers/:id/view"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <ViewOffer />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/deals"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <AdminDeals />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/deals/:id/view"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <ViewDeal />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/shipping-companies"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <AdminShippingCompanies />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/shipping-companies/create"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <CreateShippingCompany />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/shipping-companies/:id/view"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <ViewShippingCompany />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/shipping-companies/:id/edit"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <EditShippingCompany />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/shipping-tracking"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <AdminShippingTracking />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/shipping-tracking/:dealId/view"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <ViewShippingTracking />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/users"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <StockshipAdminUsers />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/users/create"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <CreateUser />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/users/:id/edit"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <EditUser />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/vendors"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <StockshipAdminVendors />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/vendors/create"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <CreateVendor />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/vendors/:id/view"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <ViewVendor />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/vendors/:id/edit"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <EditVendor />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/vendors/:id/delete"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <DeleteVendor />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/products"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <StockshipAdminProducts />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/products/create"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <CreateProduct />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/products/:id/edit"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <EditProduct />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/products/:id/delete"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <DeleteProduct />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/products/:id/view"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <ViewProduct />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/categories"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <StockshipAdminCategories />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/categories/create"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <CreateCategory />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/categories/:id/edit"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <EditCategory />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/categories/:id/view"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <ViewCategory />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/sliders"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <AdminSliders />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/sliders/create"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <CreateSlider />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/sliders/:id/edit"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <EditSlider />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/sliders/:id/view"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <ViewSlider />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/video-ads"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <AdminVideoAds />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/video-ads/create"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <CreateVideoAd />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
             <Route
               path="/stockship/admin/video-ads/:id/edit"
               element={
                 <MultiProtectedRoute requireAdmin>
                   <StockshipAdminLayout>
                     <EditVideoAd />
                   </StockshipAdminLayout>
                 </MultiProtectedRoute>
               }
             />
             <Route
               path="/stockship/admin/video-ads/:id/view"
               element={
                 <MultiProtectedRoute requireAdmin>
                   <StockshipAdminLayout>
                     <AdminVideoAdDetails />
                   </StockshipAdminLayout>
                 </MultiProtectedRoute>
               }
             />
      <Route
        path="/stockship/admin/users/:id/view"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <ViewUser />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/orders"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <StockshipAdminOrders />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/orders/:id/view"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <ViewOrder />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/payments"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <StockshipAdminPayments />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/payments/:id/view"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <ViewPayment />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/wallets"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <StockshipAdminWallets />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/coupons"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <StockshipAdminCoupons />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/coupons/create"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <CreateCoupon />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/coupons/:id/edit"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <EditCoupon />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/analytics"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <StockshipAdminAnalytics />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/content"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <StockshipAdminContent />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/seo"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <StockshipAdminSEO />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/translations"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <StockshipAdminTranslations />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/roles-permissions"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <AdminRolesPermissions />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/settings"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <StockshipAdminSettings />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/support-tickets"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <StockshipAdminSupportTickets />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/reports"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <StockshipAdminReports />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/reports/:id/view"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <ViewReport />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/activity-logs"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <AdminActivityLogs />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/admin/activity-logs/:id/view"
        element={
          <MultiProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <ViewActivityLog />
            </StockshipAdminLayout>
          </MultiProtectedRoute>
        }
      />

      {/* Mediation Platform - Employee Routes */}
      <Route
        path="/stockship/employee/dashboard"
        element={
          <MultiProtectedRoute requireEmployee>
            <StockshipEmployeeLayout>
              <EmployeeDashboard />
            </StockshipEmployeeLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/employee/traders"
        element={
          <MultiProtectedRoute requireEmployee>
            <StockshipEmployeeLayout>
              <EmployeeTraders />
            </StockshipEmployeeLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/employee/trader-update-requests"
        element={
          <MultiProtectedRoute requireEmployee>
            <StockshipEmployeeLayout>
              <EmployeeTraderUpdateRequests />
            </StockshipEmployeeLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/employee/trader-update-requests/:id"
        element={
          <MultiProtectedRoute requireEmployee>
            <StockshipEmployeeLayout>
              <ViewTraderUpdateRequest />
            </StockshipEmployeeLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/employee/offer-update-requests"
        element={
          <MultiProtectedRoute requireEmployee>
            <StockshipEmployeeLayout>
              <EmployeeOfferUpdateRequests />
            </StockshipEmployeeLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/employee/offer-update-requests/:id"
        element={
          <MultiProtectedRoute requireEmployee>
            <StockshipEmployeeLayout>
              <ViewOfferUpdateRequest />
            </StockshipEmployeeLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/employee/offer-support-tickets"
        element={
          <MultiProtectedRoute requireEmployee>
            <StockshipEmployeeLayout>
              <EmployeeOfferSupportTickets />
            </StockshipEmployeeLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/employee/offer-support-tickets/:id"
        element={
          <MultiProtectedRoute requireEmployee>
            <StockshipEmployeeLayout>
              <ViewOfferSupportTicketEmployee />
            </StockshipEmployeeLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/employee/offers/:offerId/support-tickets/create"
        element={
          <MultiProtectedRoute requireEmployee>
            <StockshipEmployeeLayout>
              <CreateOfferSupportTicketEmployee />
            </StockshipEmployeeLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/employee/traders/create"
        element={
          <MultiProtectedRoute requireEmployee>
            <StockshipEmployeeLayout>
              <CreateTrader />
            </StockshipEmployeeLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/employee/traders/:id"
        element={
          <MultiProtectedRoute requireEmployee>
            <StockshipEmployeeLayout>
              <EmployeeViewTrader />
            </StockshipEmployeeLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/employee/traders/:id/edit"
        element={
          <MultiProtectedRoute requireEmployee>
            <StockshipEmployeeLayout>
              <CreateTrader />
            </StockshipEmployeeLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/employee/deals"
        element={
          <MultiProtectedRoute requireEmployee>
            <StockshipEmployeeLayout>
              <EmployeeDeals />
            </StockshipEmployeeLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/employee/deals/:id/quote"
        element={
          <MultiProtectedRoute requireEmployee>
            <StockshipEmployeeLayout>
              <DealPriceQuotePage />
            </StockshipEmployeeLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/employee/deals/:id"
        element={
          <MultiProtectedRoute requireEmployee>
            <StockshipEmployeeLayout>
              <EmployeeViewDeal />
            </StockshipEmployeeLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/employee/offers/:id"
        element={
          <MultiProtectedRoute requireEmployee>
            <StockshipEmployeeLayout>
              <EmployeeViewOffer />
            </StockshipEmployeeLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/employee/offers"
        element={
          <MultiProtectedRoute requireEmployee>
            <StockshipEmployeeLayout>
              <EmployeeOffers />
            </StockshipEmployeeLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/employee/payments/:id"
        element={
          <MultiProtectedRoute requireEmployee>
            <StockshipEmployeeLayout>
              <EmployeeViewPayment />
            </StockshipEmployeeLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/employee/payments/:id"
        element={
          <MultiProtectedRoute requireEmployee>
            <StockshipEmployeeLayout>
              <EmployeeViewPayment />
            </StockshipEmployeeLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/employee/payments"
        element={
          <MultiProtectedRoute requireEmployee>
            <StockshipEmployeeLayout>
              <EmployeePayments />
            </StockshipEmployeeLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/employee/settings"
        element={
          <MultiProtectedRoute requireEmployee>
            <StockshipEmployeeLayout>
              <EmployeeSettings />
            </StockshipEmployeeLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/employee/shipping-tracking"
        element={
          <MultiProtectedRoute requireEmployee>
            <StockshipEmployeeLayout>
              <EmployeeShippingTracking />
            </StockshipEmployeeLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/employee/shipping-tracking/:dealId/view"
        element={
          <MultiProtectedRoute requireEmployee>
            <StockshipEmployeeLayout>
              <EmployeeViewShippingTracking />
            </StockshipEmployeeLayout>
          </MultiProtectedRoute>
        }
      />

      {/* Mediation Platform - Client Routes */}
      <Route
        path="/stockship/client/dashboard"
        element={
          <MultiProtectedRoute requireClient>
            <StockshipClientLayout>
              <ClientDashboard />
            </StockshipClientLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/client/offers/:id"
        element={
          <MultiProtectedRoute requireClient>
            <StockshipClientLayout>
              <ClientViewOffer />
            </StockshipClientLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/client/deals/:id/quote"
        element={
          <MultiProtectedRoute requireClient>
            <StockshipClientLayout>
              <ClientDealQuotePage />
            </StockshipClientLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/client/deals/:id"
        element={
          <MultiProtectedRoute requireClient>
            <StockshipClientLayout>
              <ClientViewDeal />
            </StockshipClientLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/client/deals"
        element={
          <MultiProtectedRoute requireClient>
            <StockshipClientLayout>
              <ClientDeals />
            </StockshipClientLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/client/settings"
        element={
          <MultiProtectedRoute requireClient>
            <StockshipClientLayout>
              <ClientSettings />
            </StockshipClientLayout>
          </MultiProtectedRoute>
        }
      />

      <Route
        path="/stockship/employee/categories"
        element={
          <MultiProtectedRoute requireEmployee>
            <StockshipEmployeeLayout>
              <EmployeeCategories />
            </StockshipEmployeeLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/employee/categories/create"
        element={
          <MultiProtectedRoute requireEmployee>
            <StockshipEmployeeLayout>
              <EmployeeCreateCategory />
            </StockshipEmployeeLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/employee/categories/:id/edit"
        element={
          <MultiProtectedRoute requireEmployee>
            <StockshipEmployeeLayout>
              <EmployeeEditCategory />
            </StockshipEmployeeLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/employee/categories/:id/view"
        element={
          <MultiProtectedRoute requireEmployee>
            <StockshipEmployeeLayout>
              <EmployeeViewCategory />
            </StockshipEmployeeLayout>
          </MultiProtectedRoute>
        }
      />

      {/* Mediation Platform - Trader Routes */}
      <Route
        path="/stockship/trader/dashboard"
        element={
          <MultiProtectedRoute requireTrader>
            <StockshipTraderLayout>
              <TraderDashboard />
            </StockshipTraderLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/trader/offers/create"
        element={
          <MultiProtectedRoute requireTrader>
            <StockshipTraderLayout>
              <CreateOffer />
            </StockshipTraderLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/trader/offers/:id/request-edit"
        element={
          <MultiProtectedRoute requireTrader>
            <StockshipTraderLayout>
              <TraderEditOfferRequest />
            </StockshipTraderLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/trader/support-tickets"
        element={
          <MultiProtectedRoute requireTrader>
            <StockshipTraderLayout>
              <TraderOfferSupportTickets />
            </StockshipTraderLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/trader/support-tickets/:id"
        element={
          <MultiProtectedRoute requireTrader>
            <StockshipTraderLayout>
              <TraderViewOfferSupportTicket />
            </StockshipTraderLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/trader/offers/:offerId/support-tickets/create"
        element={
          <MultiProtectedRoute requireTrader>
            <StockshipTraderLayout>
              <CreateOfferSupportTicket />
            </StockshipTraderLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/trader/offers/:id"
        element={
          <MultiProtectedRoute requireTrader>
            <StockshipTraderLayout>
              <TraderViewOffer />
            </StockshipTraderLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/trader/offers"
        element={
          <MultiProtectedRoute requireTrader>
            <StockshipTraderLayout>
              <TraderOffers />
            </StockshipTraderLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/trader/deals"
        element={
          <MultiProtectedRoute requireTrader>
            <StockshipTraderLayout>
              <TraderDeals />
            </StockshipTraderLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/trader/deals/:id"
        element={
          <MultiProtectedRoute requireTrader>
            <StockshipTraderLayout>
              <TraderViewDeal />
            </StockshipTraderLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/trader/payments"
        element={
          <MultiProtectedRoute requireTrader>
            <StockshipTraderLayout>
              <TraderPayments />
            </StockshipTraderLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/trader/settings"
        element={
          <MultiProtectedRoute requireTrader>
            <StockshipTraderLayout>
              <TraderSettings />
            </StockshipTraderLayout>
          </MultiProtectedRoute>
        }
      />
      <Route
        path="/stockship/trader/update-request"
        element={
          <MultiProtectedRoute requireTrader>
            <StockshipTraderLayout>
              <TraderUpdateRequest />
            </StockshipTraderLayout>
          </MultiProtectedRoute>
        }
      />

      {/* Stockship Vendor Routes */}
      <Route
        path="/stockship/vendor/dashboard"
        element={
          <ProtectedRoute requireVendor>
            <StockshipVendorLayout>
              <VendorDashboard />
            </StockshipVendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stockship/vendor/products"
        element={
          <ProtectedRoute requireVendor>
            <StockshipVendorLayout>
              <VendorProducts />
            </StockshipVendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stockship/vendor/orders"
        element={
          <ProtectedRoute requireVendor>
            <StockshipVendorLayout>
              <VendorOrders />
            </StockshipVendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stockship/vendor/inventory"
        element={
          <ProtectedRoute requireVendor>
            <StockshipVendorLayout>
              <VendorInventory />
            </StockshipVendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stockship/vendor/wallet"
        element={
          <ProtectedRoute requireVendor>
            <StockshipVendorLayout>
              <VendorWallet />
            </StockshipVendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stockship/vendor/negotiations"
        element={
          <ProtectedRoute requireVendor>
            <StockshipVendorLayout>
              <VendorNegotiations />
            </StockshipVendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stockship/vendor/price-requests"
        element={
          <ProtectedRoute requireVendor>
            <StockshipVendorLayout>
              <VendorPriceRequests />
            </StockshipVendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stockship/vendor/coupons"
        element={
          <ProtectedRoute requireVendor>
            <StockshipVendorLayout>
              <VendorCoupons />
            </StockshipVendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stockship/vendor/offers"
        element={
          <ProtectedRoute requireVendor>
            <StockshipVendorLayout>
              <VendorOffers />
            </StockshipVendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stockship/vendor/analytics"
        element={
          <ProtectedRoute requireVendor>
            <StockshipVendorLayout>
              <VendorAnalytics />
            </StockshipVendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stockship/vendor/profile"
        element={
          <ProtectedRoute requireVendor>
            <StockshipVendorLayout>
              <VendorProfile />
            </StockshipVendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stockship/vendor/settings"
        element={
          <ProtectedRoute requireVendor>
            <StockshipVendorLayout>
              <VendorSettings />
            </StockshipVendorLayout>
          </ProtectedRoute>
        }
      />

      {/* Error Pages */}
      <Route path="/404" element={<NotFound />} />
      <Route path="/500" element={<ServerError />} />
      <Route path="/403" element={<Forbidden />} />

      {/* Root Landing Page */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/offers/:id" element={<PublicViewOffer />} />
      {/* <Route path="/" element={<Navigate to="/multi-login" replace />} /> */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <MultiAuthProvider>
                <VendorProvider>
                  <AppRoutes />
                </VendorProvider>
              </MultiAuthProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </BrowserRouter>
      <Toaster />
    </ErrorBoundary>
  );
}

export default App;
