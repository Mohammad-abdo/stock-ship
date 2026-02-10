import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  Wallet,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  TrendingUp,
  FileText,
  MessageSquare,
  Tag,
  Gift,
  Globe,
  Moon,
  Sun,
  User,
} from "lucide-react";

const StockshipVendorLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/stockship/vendor/dashboard" },
    { icon: Package, label: "Products", path: "/stockship/vendor/products" },
    { icon: ShoppingCart, label: "Orders", path: "/stockship/vendor/orders" },
    { icon: Warehouse, label: "Inventory", path: "/stockship/vendor/inventory" },
    { icon: Wallet, label: "Wallet", path: "/stockship/vendor/wallet" },
    { icon: MessageSquare, label: "Negotiations", path: "/stockship/vendor/negotiations" },
    { icon: FileText, label: "Price Requests", path: "/stockship/vendor/price-requests" },
    { icon: Tag, label: "Coupons", path: "/stockship/vendor/coupons" },
    { icon: Gift, label: "Offers", path: "/stockship/vendor/offers" },
    { icon: BarChart3, label: "Analytics", path: "/stockship/vendor/analytics" },
    { icon: User, label: "Profile", path: "/stockship/vendor/profile" },
    { icon: Settings, label: "Settings", path: "/stockship/vendor/settings" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-card border-r border-border transition-all duration-300 flex flex-col ${
          mobileMenuOpen ? "fixed inset-y-0 left-0 z-50" : "hidden md:flex"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-foreground">Stockship Vendor</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-accent"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              {user?.companyName?.charAt(0) || user?.name?.charAt(0) || "V"}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.companyName || user?.name || "Vendor"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-accent"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-lg hover:bg-accent"
              title="Toggle Language"
            >
              <Globe size={20} />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-accent"
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="p-2 rounded-lg hover:bg-accent relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default StockshipVendorLayout;

