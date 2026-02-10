import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Pill,
  Users,
  UserCog,
  FileText,
  Calendar,
  FlaskConical,
  ShoppingCart,
  Menu,
  X,
  LogOut,
  User,
  Heart,
  AlertTriangle,
  ClipboardList,
  Folder,
  UserCheck,
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Pill, label: "Products", path: "/dashboard/medicines" },
  { icon: Folder, label: "Categories", path: "/dashboard/medicine-categories" },
  { icon: UserCheck, label: "Users", path: "/dashboard/users" },
  { icon: ShoppingCart, label: "Orders", path: "/dashboard/orders" },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-64 bg-card border-r border z-50 lg:hidden"
            >
              <SidebarContent
                location={location}
                user={user}
                onLogout={handleLogout}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex">
        <aside className="hidden lg:flex lg:flex-shrink-0">
          <div className="w-64 bg-card border-r border">
            <SidebarContent
              location={location}
              user={user}
              onLogout={handleLogout}
            />
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-sm border-b border">
            <div className="flex items-center justify-between h-16 px-4 lg:px-6">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-4 ml-auto">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="hidden sm:block text-sm">
                    <p className="font-medium">
                      {user?.username || user?.email}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {user?.role}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-accent transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarContent({ location, user, onLogout, onClose }) {
  return (
    <div className="flex flex-col h-full shadow border">
      <div className="h-16 flex items-center justify-center border-b border">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="flex items-center gap-2"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-primary-foreground"
            >
              <path
                d="M6 10C6 9.44772 6.44772 9 7 9H9C9.55228 9 10 9.44772 10 10V14C10 14.5523 9.55228 15 9 15H7C6.44772 15 6 14.5523 6 14V10Z"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M10 10C10 9.44772 10.4477 9 11 9H13C13.5523 9 14 9.44772 14 10V14C14 14.5523 13.5523 15 13 15H11C10.4477 15 10 14.5523 10 14V10Z"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M14 10C14 9.44772 14.4477 9 15 9H17C17.5523 9 18 9.44772 18 10V14C18 14.5523 17.5523 15 17 15H15C14.4477 15 14 14.5523 14 14V10Z"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
              <line
                x1="12"
                y1="10"
                x2="12"
                y2="14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Green RX
          </span>
        </motion.div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1 shdow border">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="p-4 border-t border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.username || user?.email}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {user?.role}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
}
