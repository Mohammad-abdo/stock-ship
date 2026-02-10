import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMultiAuth } from "@/contexts/MultiAuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import RoleSwitcher from "./RoleSwitcher";
import ProfileStatusBadge from "./ProfileStatusBadge";
import NotificationsDropdown from "./NotificationsDropdown";
import LanguageToggle from "./LanguageToggle";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  BarChart2,
} from "lucide-react";

export default function StockshipModeratorLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { getAuth, logout } = useMultiAuth();
  const { t, language, toggleLanguage, isRTL } = useLanguage();
  const { user } = getAuth('moderator');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Force light mode
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }, []);

  const handleLogout = () => {
    logout('moderator');
    navigate('/multi-login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: t('sidebar.dashboard'), path: "/stockship/moderator/dashboard" },
    { icon: Users, label: t('mediation.moderator.traders.title') || 'Traders', path: "/stockship/moderator/traders" },
    { icon: BarChart2, label: t('mediation.moderator.reports.title') || 'Reports', path: "/stockship/moderator/reports" },
    { icon: Settings, label: t('common.settings'), path: "/stockship/moderator/settings" },
  ];

  return (
    <div 
      className="flex h-screen bg-gray-50 overflow-hidden"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ fontFamily: 'Tajawal, sans-serif' }}
    >
      {/* Glassmorphism Sidebar */}
      <aside
        className={`${
          mobileMenuOpen ? "translate-x-0" : isRTL ? "translate-x-full" : "-translate-x-full"
        } lg:translate-x-0 fixed inset-y-0 ${isRTL ? 'right-0' : 'left-0'} z-50 w-64 transition-transform duration-300 ease-in-out flex flex-col`}
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
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h2 className="text-lg font-semibold text-gray-900">Stockship</h2>
            <p className="text-xs text-gray-500 mt-0.5">{t('mediation.moderator.portal') || 'Moderator Portal'}</p>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100/60 text-gray-600"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Info */}
        <div className="px-4 py-3 border-b border-gray-200/50">
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-gray-600" />
            </div>
            <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name || t('mediation.moderator.moderator') || 'Moderator'}</p>
              <p className="text-xs text-gray-500 truncate">
                {t('mediation.moderator.role') || 'Moderator'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            // Check if current path matches or starts with the menu item path
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? "bg-gray-100/80 text-gray-900 font-medium"
                    : "text-gray-600 hover:bg-gray-100/50 hover:text-gray-900"
                } ${isRTL ? 'flex-row-reverse justify-end' : ''}`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-200/50">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100/60 text-gray-600 hover:text-gray-900 w-full transition-colors text-sm ${isRTL ? 'flex-row-reverse justify-end' : ''}`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className={`font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{t('common.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${isRTL ? 'lg:mr-64' : 'lg:ml-64'}`}>
        {/* Glassmorphism Header */}
        <header 
          className="h-14 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between px-6 sticky top-0 z-30"
          style={{
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
        >
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100/60 text-gray-600"
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
            <h1 className={`text-base font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
              {menuItems.find(item => item.path === location.pathname || location.pathname.startsWith(item.path + '/'))?.label || t('mediation.moderator.portal') || 'Moderator Portal'}
            </h1>
          </div>
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
             <RoleSwitcher />
             <ProfileStatusBadge />
             <NotificationsDropdown />
             <LanguageToggle />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
