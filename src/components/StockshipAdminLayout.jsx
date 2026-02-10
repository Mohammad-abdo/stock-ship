import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMultiAuth } from "@/contexts/MultiAuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import RoleSwitcher from "./RoleSwitcher";
import ProfileStatusBadge from "./ProfileStatusBadge";
import NotificationsDropdown from "./NotificationsDropdown";
import LanguageToggle from "./LanguageToggle";
import {
  LayoutDashboard,
  Users,
  Settings,
  BarChart3,
  Bell,
  LogOut,
  Menu,
  X,
  Wallet,
  Shield,
  CreditCard,
  Globe,
  MessageSquare,
  Download,
  Briefcase,
  Store,
  Gift,
  ShoppingCart,
  FileText,
  FolderTree,
  Image as   ImageIcon,
  Truck,
  MapPin,
  Video,
} from "lucide-react";

const StockshipAdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // Legacy support
  const { getAuth, logout: logoutMulti } = useMultiAuth();
  const { t, language, toggleLanguage } = useLanguage();
  
  // Get admin user from MultiAuthContext
  const adminAuth = getAuth('admin');
  const adminUser = adminAuth?.user || user;
  
  // Check if RTL
  const isRTL = language === 'ar';

  // Force light mode
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, label: t('sidebar.dashboard'), path: "/stockship/admin/dashboard" },
    { icon: Briefcase, label: t('mediation.employees.title'), path: "/stockship/admin/employees" },
    { icon: Store, label: t('mediation.traders.title'), path: "/stockship/admin/traders" },
    { icon: FolderTree, label: t('sidebar.categories') || 'Categories', path: "/stockship/admin/categories" },
    { icon: ImageIcon, label: t('sidebar.sliders') || 'Sliders', path: "/stockship/admin/sliders" },
    { icon: Video, label: t('sidebar.videoAds') || 'Video Ads', path: "/stockship/admin/video-ads" },
    { icon: Users, label: t('admin.users'), path: "/stockship/admin/users" },
    { icon: Gift, label: t('mediation.offers.title'), path: "/stockship/admin/offers" },
    { icon: ShoppingCart, label: t('mediation.deals.title'), path: "/stockship/admin/deals" },
    { icon: Truck, label: t('sidebar.shippingCompanies') || 'Shipping Companies', path: "/stockship/admin/shipping-companies" },
    { icon: MapPin, label: t('sidebar.shippingTracking') || 'Shipping Tracking', path: "/stockship/admin/shipping-tracking" },
    { icon: CreditCard, label: t('sidebar.wallet'), path: "/stockship/admin/payments" },
    { icon: MessageSquare, label: t('sidebar.support'), path: "/stockship/admin/support-tickets" },
    { icon: Download, label: t('sidebar.reports'), path: "/stockship/admin/reports" },
    { icon: FileText, label: t('sidebar.activityLogs') || 'Activity Logs', path: "/stockship/admin/activity-logs" },
    { icon: BarChart3, label: t('sidebar.analytics'), path: "/stockship/admin/analytics" },
    { icon: Shield, label: t('mediation.roles.title'), path: "/stockship/admin/roles-permissions" },
    { icon: Settings, label: t('common.settings'), path: "/stockship/admin/settings" },
  ];

  const handleLogout = () => {
    logoutMulti('admin');
    if (logout) logout(); // Legacy support
    navigate("/multi-login");
  };

  return (
    <div className={`flex h-screen bg-gray-50 overflow-hidden ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'} style={{ fontFamily: 'Tajawal, sans-serif' }}>
      {/* Glassmorphism Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } fixed inset-y-0 ${isRTL ? 'right-0' : 'left-0'} z-50 transition-all duration-300 flex flex-col ${
          mobileMenuOpen ? "translate-x-0" : `${isRTL ? 'translate-x-full' : '-translate-x-full'} md:translate-x-0`
        }`}
        style={{
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRight: isRTL ? 'none' : '1px solid rgba(229, 231, 235, 0.5)',
          borderLeft: isRTL ? '1px solid rgba(229, 231, 235, 0.5)' : 'none',
        }}
      >
        {/* Logo Section */}
        <div className={`h-16 flex items-center justify-between px-4 border-b border-gray-200/50 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {sidebarOpen && (
            <h1 className={`text-lg font-semibold text-gray-900 ${isRTL ? 'order-2' : ''}`}>Stockship</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-1.5 rounded-lg hover:bg-gray-100/60 transition-colors text-gray-600 ${isRTL ? 'order-1' : ''}`}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1" dir={isRTL ? 'rtl' : 'ltr'}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center ${isRTL ? 'flex-row-reverse justify-end' : 'flex-row'} gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? "bg-gray-100/80 text-gray-900 font-medium"
                    : "text-gray-600 hover:bg-gray-100/50 hover:text-gray-900"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={18} className={`shrink-0 ${isRTL ? 'order-2' : ''}`} />
                {sidebarOpen && <span className={`text-sm truncate ${isRTL ? 'text-right order-1' : 'text-left'}`}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-gray-200/50" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className={`flex items-center ${isRTL ? 'flex-row-reverse justify-end' : 'flex-row'} gap-3 mb-2 px-2`}>
            <div className={`w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 text-sm font-medium shrink-0 ${isRTL ? 'order-2' : ''}`}>
              {adminUser?.name?.charAt(0) || "A"}
            </div>
            {sidebarOpen && (
              <div className={`flex-1 min-w-0 ${isRTL ? 'order-1 text-right' : 'text-left'}`}>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {adminUser?.name || t('common.admin') || 'Admin'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {adminUser?.email || ''}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${isRTL ? 'flex-row-reverse justify-end' : 'flex-row'} gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100/60 text-gray-600 hover:text-gray-900 transition-colors text-sm`}
          >
            <LogOut size={18} className={`shrink-0 ${isRTL ? 'order-2' : ''}`} />
            {sidebarOpen && <span className={isRTL ? 'order-1 text-right' : 'text-left'}>{t('common.logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${sidebarOpen ? (isRTL ? 'md:mr-64' : 'md:ml-64') : (isRTL ? 'md:mr-20' : 'md:ml-20')}`}>
        {/* Glassmorphism Header */}
        <header 
          className="h-14 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between px-6 sticky top-0 z-40"
          style={{
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
        >
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-lg hover:bg-gray-100/60 text-gray-600 ${isRTL ? 'order-2' : ''}`}
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
            <h2 className={`text-base font-semibold text-gray-900 hidden sm:block ${isRTL ? 'order-1 text-right' : 'text-left'}`}>
              {menuItems.find(item => item.path === location.pathname)?.label || t('sidebar.dashboard')}
            </h2>
          </div>

          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <RoleSwitcher />
            <ProfileStatusBadge />
            <NotificationsDropdown />
            <LanguageToggle />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">{children}</main>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default StockshipAdminLayout;
