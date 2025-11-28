import { useEffect } from "react";
import { toast } from "react-hot-toast";
import useAuthStore from "../store/authStore";
import { authAPI } from "../services/api";

const POLL_INTERVAL_MS = 30000; // 30s

const AuthLoader = () => {
  const { setUser, logout, token, isAuthenticated } = useAuthStore();

  useEffect(() => {
    let mounted = true;
    let intervalId;

    const fetchCurrentUser = async () => {
      try {
        // If there's no token stored or user is not authenticated, stop polling and ensure logged out
        const stored = localStorage.getItem("auth-storage");
        if (!stored) {
          logout();
          // don't redirect here if already on login page
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
          return;
        }

        // Parse and check if there's an actual token
        let hasValidToken = false;
        try {
          const authData = JSON.parse(stored);
          hasValidToken = !!(authData.state?.token && authData.state?.isAuthenticated);
        } catch (e) {
          console.error("Error parsing auth-storage:", e);
        }

        // If no valid token or not authenticated, don't call the API
        if (!hasValidToken || !isAuthenticated) {
          logout();
          return;
        }

        const resp = await authAPI.getCurrentUser();
        const user = resp.data;
        if (!mounted) return;

        // If account suspended, force logout and show message once
        if (user && user.isActive === false) {
          toast.error("Your account has been suspended. You have been signed out.");
          logout();
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
          return;
        }

        setUser(user);
      } catch (error) {
        const status = error?.response?.status;
        const code = error?.response?.data?.code;

        // If authentication error or suspension, log out and redirect once
        if (status === 401 || (status === 403 && code === "ACCOUNT_SUSPENDED")) {
          if (code === "ACCOUNT_SUSPENDED") {
            toast.error(error.response.data.message || "Account suspended");
          }
          logout();
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
          return;
        }

        // Other errors: stop polling to avoid repeated failures
        console.error("AuthLoader fetchCurrentUser error:", error);
      }
    };

    // Initial fetch
    fetchCurrentUser();

    // Poll for account changes (suspension/approval)
    intervalId = setInterval(fetchCurrentUser, POLL_INTERVAL_MS);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [setUser, logout, token, isAuthenticated]);

  return null;
};

export default AuthLoader;
