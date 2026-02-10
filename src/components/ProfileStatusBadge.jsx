/**
 * Profile Status Badge Component
 * Shows indicator when user has multiple linked profiles (Client/Trader)
 */

import { useEffect, useState } from "react";
import { useMultiAuth } from "@/contexts/MultiAuthContext";
import { User, Building2, Link2 } from "lucide-react";
import api from "@/lib/api";

export default function ProfileStatusBadge() {
  const { getAuth, isLoggedIn } = useMultiAuth();
  const [hasMultipleProfiles, setHasMultipleProfiles] = useState(false);
  const [profileInfo, setProfileInfo] = useState(null);

  useEffect(() => {
    const checkProfiles = async () => {
      const clientAuth = getAuth('client');
      const traderAuth = getAuth('trader');
      
      // Check if user has both client and trader profiles logged in
      if (isLoggedIn('client') && isLoggedIn('trader')) {
        setHasMultipleProfiles(true);
        setProfileInfo({
          client: clientAuth?.user,
          trader: traderAuth?.user
        });
        return;
      }

      // Check if client has linked trader profile
      if (isLoggedIn('client') && clientAuth?.user?.linkedProfiles?.length > 0) {
        setHasMultipleProfiles(true);
        setProfileInfo({
          client: clientAuth?.user,
          linkedProfiles: clientAuth?.user?.linkedProfiles
        });
        return;
      }

      // Check if trader has linked client profile
      if (isLoggedIn('trader') && traderAuth?.user?.clientId) {
        setHasMultipleProfiles(true);
        setProfileInfo({
          trader: traderAuth?.user,
          hasLinkedClient: true
        });
        return;
      }

      setHasMultipleProfiles(false);
    };

    checkProfiles();
  }, [getAuth, isLoggedIn]);

  if (!hasMultipleProfiles) {
    return null;
  }

  return (
    <div 
      className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium"
      title="You have multiple profiles (Client & Trader). Use the role switcher to switch between them."
    >
      <Link2 className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Multiple Profiles</span>
    </div>
  );
}

