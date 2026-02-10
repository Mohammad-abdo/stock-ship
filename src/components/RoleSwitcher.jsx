/**
 * Role Switcher Component
 * Allows switching between multiple logged-in roles in the same browser
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMultiAuth } from "@/contexts/MultiAuthContext";
import { User, Briefcase, Building2, ChevronDown } from "lucide-react";

export default function RoleSwitcher() {
  const { getActiveRoles, getAuth, isLoggedIn, setActiveRole } = useMultiAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const activeRoles = getActiveRoles();
  
  // Always show if there are multiple roles, or if current user has linked profiles
  const currentAuth = getAuth('client') || getAuth('trader') || getAuth('admin') || getAuth('employee');
  const hasLinkedProfiles = currentAuth?.user?.linkedProfiles?.length > 0;
  
  // Combine active roles with linked profiles
  const allAvailableRoles = [...new Set([
    ...activeRoles,
    ...(currentAuth?.user?.linkedProfiles?.map(p => p.userType?.toLowerCase()) || [])
  ])];
  
  if (allAvailableRoles.length <= 1 && !hasLinkedProfiles) {
    return null; // Don't show if only one role is logged in and no linked profiles
  }

  const roleInfo = {
    admin: { label: 'Admin', icon: User, path: '/stockship/admin/dashboard', color: 'text-blue-600' },
    employee: { label: 'Employee', icon: Briefcase, path: '/stockship/employee/dashboard', color: 'text-green-600' },
    trader: { label: 'Trader', icon: Building2, path: '/stockship/trader/dashboard', color: 'text-purple-600' },
    client: { label: 'Client', icon: User, path: '/', color: 'text-gray-600' }
  };

  const handleSwitchRole = (role) => {
    setIsOpen(false);
    // Set active role in context and localStorage
    setActiveRole(role);
    localStorage.setItem('active_role', role);
    
    const info = roleInfo[role];
    if (info) {
      navigate(info.path);
    }
  };

  // Get current role from path
  const currentPath = window.location.pathname;
  let currentRole = 'admin';
  if (currentPath.includes('/employee')) currentRole = 'employee';
  else if (currentPath.includes('/trader')) currentRole = 'trader';
  else if (currentPath.includes('/client')) currentRole = 'client';

  const currentInfo = roleInfo[currentRole] || roleInfo.admin;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/60 hover:bg-white/80 backdrop-blur-sm border border-gray-200/50 transition-colors text-sm font-medium text-gray-700"
        style={{
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        {currentInfo.icon && <currentInfo.icon className={`w-4 h-4 ${currentInfo.color}`} />}
        <span className="hidden sm:inline">{currentInfo.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="absolute top-full right-0 mt-2 w-48 rounded-lg z-20 border border-gray-200/50"
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div className="p-2">
              <p className="text-xs font-semibold text-gray-500 px-2 py-1.5 mb-1">
                Switch Role
              </p>
              {(allAvailableRoles.length > 0 ? allAvailableRoles : activeRoles).map((role) => {
                const roleKey = role.toLowerCase();
                const info = roleInfo[roleKey];
                if (!info) return null;
                const Icon = info.icon;
                const isActive = roleKey === currentRole;
                
                // Check if this is a linked profile
                const isLinkedProfile = currentAuth?.user?.linkedProfiles?.some(
                  p => p.userType?.toLowerCase() === roleKey
                );
                
                return (
                  <button
                    key={roleKey}
                    onClick={() => handleSwitchRole(roleKey)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-gray-100/80 text-gray-900 font-medium'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? '' : info.color}`} />
                    <span className="flex-1 text-left">{info.label}</span>
                    {isLinkedProfile && (
                      <span className="text-xs text-blue-500" title="Linked Profile">🔗</span>
                    )}
                    {isActive && (
                      <span className="text-xs text-gray-500">●</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

