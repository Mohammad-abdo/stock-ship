import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import StockshipAdminLayout from "@/components/StockshipAdminLayout";
import StockshipVendorLayout from "@/components/StockshipVendorLayout";

// Admin Pages
import AdminDashboard from "@/pages/stockship/admin/AdminDashboard";
import AdminUsers from "@/pages/stockship/admin/AdminUsers";
import AdminVendors from "@/pages/stockship/admin/AdminVendors";
import AdminProducts from "@/pages/stockship/admin/AdminProducts";
import AdminCategories from "@/pages/stockship/admin/AdminCategories";
import AdminSliders from "@/pages/stockship/admin/AdminSliders";
import AdminOrders from "@/pages/stockship/admin/AdminOrders";
import AdminPayments from "@/pages/stockship/admin/AdminPayments";
import AdminWallets from "@/pages/stockship/admin/AdminWallets";
import AdminCoupons from "@/pages/stockship/admin/AdminCoupons";
import AdminOffers from "@/pages/stockship/admin/AdminOffers";
import AdminAnalytics from "@/pages/stockship/admin/AdminAnalytics";
import AdminContent from "@/pages/stockship/admin/AdminContent";
import AdminSEO from "@/pages/stockship/admin/AdminSEO";
import AdminTranslations from "@/pages/stockship/admin/AdminTranslations";
import AdminActivityLogs from "@/pages/stockship/admin/AdminActivityLogs";
import AdminSettings from "@/pages/stockship/admin/AdminSettings";

// Vendor Pages
import VendorDashboard from "@/pages/stockship/vendor/VendorDashboard";
import VendorProducts from "@/pages/stockship/vendor/VendorProducts";
import VendorOrders from "@/pages/stockship/vendor/VendorOrders";
import VendorInventory from "@/pages/stockship/vendor/VendorInventory";
import VendorWallet from "@/pages/stockship/vendor/VendorWallet";
import VendorNegotiations from "@/pages/stockship/vendor/VendorNegotiations";
import VendorPriceRequests from "@/pages/stockship/vendor/VendorPriceRequests";
import VendorCoupons from "@/pages/stockship/vendor/VendorCoupons";
import VendorOffers from "@/pages/stockship/vendor/VendorOffers";
import VendorAnalytics from "@/pages/stockship/vendor/VendorAnalytics";
import VendorProfile from "@/pages/stockship/vendor/VendorProfile";
import VendorSettings from "@/pages/stockship/vendor/VendorSettings";

export const StockshipRoutes = () => {
  return (
    <Routes>
      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <AdminDashboard />
            </StockshipAdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <AdminUsers />
            </StockshipAdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/vendors"
        element={
          <ProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <AdminVendors />
            </StockshipAdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <ProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <AdminProducts />
            </StockshipAdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <ProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <AdminCategories />
            </StockshipAdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sliders"
        element={
          <ProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <AdminSliders />
            </StockshipAdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <AdminOrders />
            </StockshipAdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/payments"
        element={
          <ProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <AdminPayments />
            </StockshipAdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/wallets"
        element={
          <ProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <AdminWallets />
            </StockshipAdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/coupons"
        element={
          <ProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <AdminCoupons />
            </StockshipAdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/offers"
        element={
          <ProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <AdminOffers />
            </StockshipAdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <AdminAnalytics />
            </StockshipAdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/content"
        element={
          <ProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <AdminContent />
            </StockshipAdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/seo"
        element={
          <ProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <AdminSEO />
            </StockshipAdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/translations"
        element={
          <ProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <AdminTranslations />
            </StockshipAdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/activity-logs"
        element={
          <ProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <AdminActivityLogs />
            </StockshipAdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <AdminSettings />
            </StockshipAdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Vendor Routes */}
      <Route
        path="/vendor/dashboard"
        element={
          <ProtectedRoute requireVendor>
            <StockshipVendorLayout>
              <VendorDashboard />
            </StockshipVendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/products"
        element={
          <ProtectedRoute requireVendor>
            <StockshipVendorLayout>
              <VendorProducts />
            </StockshipVendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/orders"
        element={
          <ProtectedRoute requireVendor>
            <StockshipVendorLayout>
              <VendorOrders />
            </StockshipVendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/inventory"
        element={
          <ProtectedRoute requireVendor>
            <StockshipVendorLayout>
              <VendorInventory />
            </StockshipVendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/wallet"
        element={
          <ProtectedRoute requireVendor>
            <StockshipVendorLayout>
              <VendorWallet />
            </StockshipVendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/negotiations"
        element={
          <ProtectedRoute requireVendor>
            <StockshipVendorLayout>
              <VendorNegotiations />
            </StockshipVendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/price-requests"
        element={
          <ProtectedRoute requireVendor>
            <StockshipVendorLayout>
              <VendorPriceRequests />
            </StockshipVendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/coupons"
        element={
          <ProtectedRoute requireVendor>
            <StockshipVendorLayout>
              <VendorCoupons />
            </StockshipVendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/offers"
        element={
          <ProtectedRoute requireVendor>
            <StockshipVendorLayout>
              <VendorOffers />
            </StockshipVendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/analytics"
        element={
          <ProtectedRoute requireVendor>
            <StockshipVendorLayout>
              <VendorAnalytics />
            </StockshipVendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/profile"
        element={
          <ProtectedRoute requireVendor>
            <StockshipVendorLayout>
              <VendorProfile />
            </StockshipVendorLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/settings"
        element={
          <ProtectedRoute requireVendor>
            <StockshipVendorLayout>
              <VendorSettings />
            </StockshipVendorLayout>
          </ProtectedRoute>
        }
      />
    </>
  );
};

// Export as Routes component for nested routing (alternative)
export const StockshipRoutesNested = () => {
  return (
    <Routes>
      {/* Admin Routes */}
      <Route
        path="admin/dashboard"
        element={
          <ProtectedRoute requireAdmin>
            <StockshipAdminLayout>
              <AdminDashboard />
            </StockshipAdminLayout>
          </ProtectedRoute>
        }
      />
      {/* ... other routes can be added here for nested routing ... */}
    </Routes>
  );
};

