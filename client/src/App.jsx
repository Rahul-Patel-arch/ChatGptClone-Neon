import React, { useEffect } from "react";
import useThemeMode from "./hooks/useThemeMode";
import useSession from "./hooks/useSession";
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { getRouterMode } from "./utils/urlHelpers";
import ChatApp from "./ChatApp";
import SharedChatView from "./pages/SharedChatView";
import LibraryView from "./pages/LibraryView";
import UpgradePlan from "./pages/UpgradePlan";
import Checkout from "./pages/Checkout";
import MainLayout from "./layout/MainLayout.jsx";
import AnimatedAuthForm from "./component/AnimatedAuthForm";
import ResetPasswordPage from "./pages/ResetPasswordPage";

function App() {
  // --- Session/Auth state (centralized via hook) ----------------------------
  const { currentUser, loggedIn, isLoadingAuth, login, logout } = useSession();

  // --- Theme state (centralized via hook) -----------------------------------
  const { themeMode, setThemeMode, effectiveDark, toggleDarkMode } = useThemeMode();

  // --- Helpers: per-user plan state -----------------------------------------
  // Fetch persisted plan map { [email]: 'free'|'pro' }
  const getUserPlans = () => {
    try {
      const raw = localStorage.getItem("quantumchat_user_plans");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };
  // setUserPlan utility is not used currently; can be re-enabled when plan changes are written here

  // Keep body.pro-mode synced with the logged-in user's plan
  useEffect(() => {
    const email = currentUser?.email?.toLowerCase();
    const plans = getUserPlans();
    const plan = email ? plans[email] : undefined;
    if (plan === "pro") {
      document.body.classList.add("pro-mode");
    } else {
      document.body.classList.remove("pro-mode");
    }
  }, [currentUser]);

  // Activity and upgrade listeners moved into useSession

  // toggleDarkMode and setThemeMode provided by hook

  /**
   * Log the user in and persist a robust session object.
   * Also syncs pro-mode body class based on per-user plan.
   */
  const handleLogin = (user, rememberMe = false) => {
    login(user, rememberMe);
    console.log("User logged in successfully:", {
      email: user.email,
      rememberMe,
    });
  };

  /**
   * Log out and clean up session-related storage and UI state.
   */
  const handleLogout = () => {
    logout();
    console.log("User logged out successfully");
  };

  // Show loading screen while checking authentication
  if (isLoadingAuth) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: effectiveDark ? "#1a1a1a" : "#ffffff",
        }}
      >
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div style={{ color: effectiveDark ? "#ffffff" : "#000000" }}>
            Restoring your session...
          </div>
        </div>
      </div>
    );
  }

  const RouterImpl = getRouterMode() === "hash" ? HashRouter : BrowserRouter;
  return (
    <RouterImpl>
      <Routes>
        {/* Auth pages (no sidebar) */}
        <Route
          path="/login"
          element={
            loggedIn ? (
              <Navigate to="/" replace />
            ) : (
              <AnimatedAuthForm
                darkMode={effectiveDark}
                toggleDarkMode={toggleDarkMode}
                onLogin={handleLogin}
              />
            )
          }
        />

        {/* Shared view: standalone when logged out */}
        {!loggedIn && <Route path="/shared-chat" element={<SharedChatView />} />}

        <Route
          path="/reset-password"
          element={
            loggedIn ? <Navigate to="/" replace /> : <ResetPasswordPage darkMode={effectiveDark} />
          }
        />
        <Route
          path="/signup"
          element={
            loggedIn ? (
              <Navigate to="/" replace />
            ) : (
              <AnimatedAuthForm
                darkMode={effectiveDark}
                toggleDarkMode={toggleDarkMode}
                signupMode={true}
                onLogin={handleLogin}
              />
            )
          }
        />

        {/* Main app pages (with sidebar) */}
        <Route
          path="/"
          element={
            loggedIn ? (
              <MainLayout
                currentUser={currentUser}
                onLogout={handleLogout}
                darkMode={effectiveDark}
                toggleDarkMode={toggleDarkMode}
                themeMode={themeMode}
                setThemeMode={setThemeMode}
              />
            ) : (
              // Preserve reset params if present when redirecting
              (() => {
                const params = new URLSearchParams(window.location.search);
                const email = params.get("email");
                const prt = params.get("prt");
                const legacy = params.get("reset_token");
                // New stateless flow: send directly to dedicated page
                if (email && prt) {
                  return (
                    <Navigate
                      to={`/reset-password?email=${encodeURIComponent(email)}&prt=${encodeURIComponent(prt)}`}
                      replace
                    />
                  );
                }
                // Legacy link support: convert old reset_token format into a friendly guidance page
                if (email && legacy) {
                  return (
                    <Navigate
                      to={`/reset-password?email=${encodeURIComponent(email)}&legacy=1`}
                      replace
                    />
                  );
                }
                return <Navigate to="/login" replace />;
              })()
            )
          }
        >
          <Route index element={<ChatApp />} />
          <Route path="update" element={<UpgradePlan />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="library" element={<LibraryView />} />
          {/* Shared view inside app shell when logged in */}
          {loggedIn && <Route path="shared-chat" element={<SharedChatView />} />}
        </Route>

        {/* Catch-all: redirect unknown paths */}
        <Route path="*" element={<Navigate to={loggedIn ? "/" : "/login"} replace />} />
      </Routes>
    </RouterImpl>
  );
}

export default App;
