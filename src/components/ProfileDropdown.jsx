import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { User, Settings, LogOut, HelpCircle, ChevronDown } from "lucide-react";

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    {
      icon: User,
      label: t("common.profile"),
      action: () => {
        navigate("/admin/profile");
        setIsOpen(false);
      },
    },
    {
      icon: Settings,
      label: t("common.settings"),
      action: () => {
        navigate("/admin/settings");
        setIsOpen(false);
      },
    },
    {
      icon: HelpCircle,
      label: t("sidebar.support"),
      action: () => {
        navigate("/admin/support");
        setIsOpen(false);
      },
    },
    {
      icon: LogOut,
      label: t("common.logout"),
      action: handleLogout,
      isDestructive: true,
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
          <User className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium">{user?.username || user?.email}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {user?.role || "Admin"}
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-56 bg-card border border rounded-lg shadow-lg z-50 overflow-hidden backdrop-blur-sm"
          >
            <div className="p-2 border-b border">
              <p className="text-sm font-semibold px-3 py-2">
                {user?.username || user?.email}
              </p>
              <p className="text-xs text-muted-foreground px-3 pb-2 capitalize">
                {user?.role || "Admin"}
              </p>
            </div>
            <div className="py-1">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={index}
                    onClick={item.action}
                    whileHover={{ x: 4 }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      item.isDestructive
                        ? "text-destructive hover:bg-destructive/10"
                        : "text-foreground hover:bg-accent"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

