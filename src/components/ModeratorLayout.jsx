import React from "react";
import LanguageToggle from "@/components/LanguageToggle";
import { Button } from "@/components/ui/button";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useMultiAuth } from "@/contexts/MultiAuthContext";
import { 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  BarChart2, 
  Bell 
} from "lucide-react";

export default function ModeratorLayout({ children }) {
  const { auths, logout } = useMultiAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const user = auths.moderator?.user;

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r shadow-sm z-30 hidden md:block">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
              M
            </div>
            <span className="text-xl font-bold text-gray-900">StokShip</span>
          </div>
          
          <nav className="space-y-1">
            <Button 
              variant={isActive('/stockship/moderator/dashboard') ? "secondary" : "ghost"}
              className={`w-full justify-start ${isActive('/stockship/moderator/dashboard') ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              onClick={() => navigate('/stockship/moderator/dashboard')}
            >
              <BarChart2 className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button 
              variant={isActive('/stockship/moderator/traders') ? "secondary" : "ghost"}
              className={`w-full justify-start ${isActive('/stockship/moderator/traders') ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              onClick={() => navigate('/stockship/moderator/traders')}
            >
              <Users className="mr-2 h-4 w-4" />
              Traders
            </Button>
            <Button 
              variant={isActive('/stockship/moderator/reports') ? "secondary" : "ghost"}
              className={`w-full justify-start ${isActive('/stockship/moderator/reports') ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              onClick={() => navigate('/stockship/moderator/reports')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Reports
            </Button>
            <Button 
              variant={isActive('/stockship/moderator/settings') ? "secondary" : "ghost"}
              className={`w-full justify-start ${isActive('/stockship/moderator/settings') ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              onClick={() => navigate('/stockship/moderator/settings')}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </nav>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => logout()}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-white border-b h-16 flex items-center justify-between px-8 sticky top-0 z-20">
            <div className="flex items-center gap-4 text-gray-500">
               <span className="text-sm">Page {location.pathname.replace('/stockship/moderator', '').replace('/', ' / ')}</span>
            </div>
            
            <div className="flex items-center gap-4">
               {/* Language Toggle */}
               <div className="flex items-center">
                  <LanguageToggle />
               </div>
               
               <div className="relative">
                  <Bell className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
               </div>
               <div className="h-8 w-px bg-gray-200 mx-2"></div>
               <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                     <p className="text-sm font-medium text-gray-900">Moderator Dashboard</p>
                     <p className="text-xs text-gray-500">Welcome back, <span className="font-semibold text-gray-900">{user?.name}</span></p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {user?.name?.charAt(0) || 'M'}
                  </div>
               </div>
            </div>
        </header>

        {children || <Outlet />}
      </div>
    </div>
  );
}
