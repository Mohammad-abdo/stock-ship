# Stockship Admin & Vendor Dashboards

This document describes the React dashboard structure for the Stockship B2B e-commerce platform.

## Structure

### Components
- **StockshipAdminLayout.jsx**: Main layout component for admin dashboard with sidebar navigation
- **StockshipVendorLayout.jsx**: Main layout component for vendor dashboard with sidebar navigation

### Pages

#### Admin Pages (`src/pages/stockship/admin/`)
- `AdminDashboard.jsx` - Main dashboard with stats and overview
- `AdminUsers.jsx` - User management
- `AdminVendors.jsx` - Vendor management
- `AdminProducts.jsx` - Product management
- `AdminCategories.jsx` - Category management
- `AdminOrders.jsx` - Order management
- `AdminPayments.jsx` - Payment management
- `AdminWallets.jsx` - Wallet management
- `AdminCoupons.jsx` - Coupon management
- `AdminOffers.jsx` - Offer management
- `AdminAnalytics.jsx` - Analytics and reports
- `AdminContent.jsx` - Content pages management
- `AdminSEO.jsx` - SEO management
- `AdminTranslations.jsx` - Translation management
- `AdminActivityLogs.jsx` - Activity logs and audit trails
- `AdminSettings.jsx` - System settings

#### Vendor Pages (`src/pages/stockship/vendor/`)
- `VendorDashboard.jsx` - Main dashboard with stats and overview
- `VendorProducts.jsx` - Product management
- `VendorOrders.jsx` - Order management
- `VendorInventory.jsx` - Inventory management
- `VendorWallet.jsx` - Wallet and transactions
- `VendorNegotiations.jsx` - Negotiation management
- `VendorPriceRequests.jsx` - Price request management
- `VendorCoupons.jsx` - Coupon management
- `VendorOffers.jsx` - Offer management
- `VendorAnalytics.jsx` - Analytics and reports
- `VendorProfile.jsx` - Profile management
- `VendorSettings.jsx` - Settings

## API Integration

### API Service (`src/lib/stockshipApi.js`)
The API service provides organized functions for all backend endpoints:

- **authApi**: Authentication endpoints
- **adminApi**: Admin-specific endpoints
- **vendorApi**: Vendor-specific endpoints
- **productsApi**: Product endpoints
- **categoriesApi**: Category endpoints
- **ordersApi**: Order endpoints

### Configuration
- API URL: Set via `VITE_API_URL` environment variable (defaults to `http://localhost:6000/api`)
- Authentication: JWT tokens stored in localStorage
- Auto token refresh and error handling via axios interceptors

## Routing

Routes are defined in `src/App.jsx`:
- Admin routes: `/admin/*`
- Vendor routes: `/vendor/*`

All routes are protected using `ProtectedRoute` component which checks:
- User authentication
- Role-based access (ADMIN, VENDOR, USER)

## Authentication

### AuthContext (`src/contexts/AuthContext.jsx`)
Supports Stockship roles:
- `ADMIN` - Platform administrators
- `VENDOR` - Sellers/vendors
- `USER` - Regular buyers

The context provides:
- `isAdmin` - Boolean for admin access
- `isVendor` - Boolean for vendor access
- `isUser` - Boolean for regular user access

## Features

### Admin Dashboard Features
- User management (CRUD operations)
- Vendor approval/rejection/suspension
- Product approval/rejection
- Category management
- Order management and tracking
- Payment monitoring
- Wallet management
- Coupon and offer management
- Analytics and reporting
- Content page management
- SEO management
- Translation management
- Activity logs and audit trails
- System settings

### Vendor Dashboard Features
- Product management (CRUD, bulk upload)
- Order management and acceptance
- Inventory management
- Wallet and payout requests
- Negotiation handling
- Price request responses
- Coupon and offer creation
- Analytics and reports
- Profile management
- Settings

## Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Theme Support**: Dark/light mode via ThemeContext
- **RTL Support**: Arabic (RTL) and English (LTR) via LanguageContext
- **Responsive Design**: Mobile-first approach with sidebar collapse

## Next Steps

1. **Design Integration**: When design is provided, update each page component with the actual UI
2. **API Integration**: Connect all pages to backend endpoints using the API service functions
3. **Form Validation**: Add form validation using react-hook-form and zod
4. **Data Tables**: Implement data tables using @tanstack/react-table
5. **Charts**: Add charts using recharts for analytics pages
6. **File Uploads**: Implement file upload for product images, Excel imports, etc.
7. **Real-time Updates**: Integrate WebSocket for real-time notifications
8. **Translation**: Implement i18n for multi-language support

## Environment Variables

Create a `.env` file in the dashboard root:

```env
VITE_API_URL=http://localhost:6000/api
```

## Running the Dashboard

```bash
cd dashbaord
npm install
npm run dev
```

The dashboard will be available at `http://localhost:6000` (or the port configured in vite.config.js).

## Backend Integration

The dashboard is designed to work with the Stockship backend API. Ensure:
1. Backend server is running on the configured API URL
2. CORS is properly configured on the backend
3. Authentication endpoints return JWT tokens
4. API responses follow the expected format:
   ```json
   {
     "success": true,
     "message": "Success message",
     "data": { ... }
   }
   ```

