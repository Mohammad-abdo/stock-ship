import { useEffect, useRef } from "react";
import { useMultiAuth } from "@/contexts/MultiAuthContext";
import { connectEmployeeProfileSocket } from "@/lib/employeeProfileSocket";

const FOCUS_DEBOUNCE_MS = 800;

/**
 * Keeps employee_user in sync: WebSocket push + refetch /auth/me on mount and window focus.
 */
export default function EmployeeSessionSync() {
  const { getAuth, mergeEmployeeUser, refreshEmployeeSession } = useMultiAuth();
  const { token, user } = getAuth("employee");
  const cleanupRef = useRef(null);
  const focusTimerRef = useRef(null);

  useEffect(() => {
    if (localStorage.getItem("employee_token")) {
      refreshEmployeeSession();
    }
  }, [refreshEmployeeSession]);

  useEffect(() => {
    if (!token || !user?.id) {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      return;
    }
    const disconnect = connectEmployeeProfileSocket(token, {
      onProfileUpdated: (payload) => {
        if (payload?.id) mergeEmployeeUser(payload);
      },
    });
    cleanupRef.current = disconnect;
    return () => {
      disconnect();
      cleanupRef.current = null;
    };
  }, [token, user?.id, mergeEmployeeUser]);

  useEffect(() => {
    const onFocus = () => {
      if (!localStorage.getItem("employee_token")) return;
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
      focusTimerRef.current = setTimeout(() => {
        focusTimerRef.current = null;
        refreshEmployeeSession();
      }, FOCUS_DEBOUNCE_MS);
    };
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    };
  }, [refreshEmployeeSession]);

  return null;
}
