import { useEffect, useState } from "react";

/**
 * useSession
 * Centralizes login/logout, session restoration, and plan sync.
 * Keeps App.jsx declarative and easy to follow.
 */
export default function useSession() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Restore session on mount
  useEffect(() => {
    try {
      const sessionData = localStorage.getItem("quantumchat_current_session");
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (session?.user?.email) {
          session.lastActivity = new Date().toISOString();
          localStorage.setItem("quantumchat_current_session", JSON.stringify(session));
          setCurrentUser(session.user);
          setLoggedIn(true);
        } else {
          localStorage.removeItem("quantumchat_current_session");
        }
      }
    } catch (e) {
      console.warn("Error restoring session:", e);
      localStorage.removeItem("quantumchat_current_session");
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  // Keep body.pro-mode synced with the logged-in user's plan
  useEffect(() => {
    try {
      const email = currentUser?.email?.toLowerCase();
      const plans = JSON.parse(localStorage.getItem("quantumchat_user_plans") || "{}");
      const plan = email ? plans[email] : undefined;
      if (plan === "pro") document.body.classList.add("pro-mode");
      else document.body.classList.remove("pro-mode");
  } catch { /* ignore plan sync issues */ }
  }, [currentUser]);

  // Listen for external plan/session changes
  useEffect(() => {
    const refreshFromSession = () => {
      try {
        const sessionData = localStorage.getItem("quantumchat_current_session");
        if (sessionData) {
          const session = JSON.parse(sessionData);
          if (session?.user) setCurrentUser(session.user);
        }
      } catch (e) {
        console.warn("Failed to refresh from session:", e);
      }
    };
    const onUpgraded = () => refreshFromSession();
    const onStorage = (e) => {
      if (e.key === "quantumchat_user_plans" || e.key === "quantumchat_current_session") {
        refreshFromSession();
      }
    };
    window.addEventListener("qc:pro-upgraded", onUpgraded);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("qc:pro-upgraded", onUpgraded);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Activity heartbeat
  useEffect(() => {
    if (!loggedIn) return;
    const updateActivity = () => {
      const sessionData = localStorage.getItem("quantumchat_current_session");
      if (sessionData) {
        const session = JSON.parse(sessionData);
        session.lastActivity = new Date().toISOString();
        localStorage.setItem("quantumchat_current_session", JSON.stringify(session));
      }
    };
    const events = ["click", "keydown", "scroll", "mousemove"]; 
    let timeout;
    const throttled = () => { clearTimeout(timeout); timeout = setTimeout(updateActivity, 30000); };
    events.forEach((ev) => document.addEventListener(ev, throttled));
    return () => { events.forEach((ev) => document.removeEventListener(ev, throttled)); clearTimeout(timeout); };
  }, [loggedIn]);

  const login = (user, rememberMe = false) => {
    const sessionData = {
      user: {
        ...user,
        loginTime: new Date().toISOString(),
        sessionId: `session_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      },
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };
    localStorage.setItem("quantumchat_current_session", JSON.stringify(sessionData));
    if (rememberMe) {
      localStorage.setItem("quantumchat_persistent_session", JSON.stringify({ rememberMe: true, createdAt: new Date().toISOString() }));
    }
    setCurrentUser(sessionData.user);
    setLoggedIn(true);
    try {
      const plans = JSON.parse(localStorage.getItem("quantumchat_user_plans") || "{}");
      const plan = plans[user.email?.toLowerCase?.()] || "free";
      if (plan === "pro") document.body.classList.add("pro-mode");
      else document.body.classList.remove("pro-mode");
    } catch (e) {
      console.warn("Failed to sync pro-mode after login:", e);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem("quantumchat_current_session");
      localStorage.removeItem("chatapp_remember_user");
      setCurrentUser(null);
      setLoggedIn(false);
      document.body.classList.remove("pro-mode");
    } catch (e) {
      console.error("Error during logout:", e);
    }
  };

  return { currentUser, loggedIn, isLoadingAuth, login, logout };
}
