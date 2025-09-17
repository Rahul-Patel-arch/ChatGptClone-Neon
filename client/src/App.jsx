import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ChatApp from "./ChatApp";
import SharedChatView from "./pages/SharedChatView";
import LibraryView from "./pages/LibraryView";
import UpgradePlan from "./pages/UpgradePlan";
import MainLayout from "./layout/MainLayout.jsx";
import AnimatedAuthForm from "./component/AnimatedAuthForm";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const raw = localStorage.getItem('quantumchat_theme');
      return raw ? JSON.parse(raw) : false;
    } catch (e) {
      return false;
    }
  });

  // Enhanced session management with automatic restoration
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Check for persistent session first
        const persistentSession = localStorage.getItem('quantumchat_persistent_session');
        const sessionData = localStorage.getItem('quantumchat_current_session');
        
        if (persistentSession && sessionData) {
          const session = JSON.parse(sessionData);
          const persistentConfig = JSON.parse(persistentSession);
          
          // Check if session is still valid (7 days for persistent, 1 day for regular)
          const sessionAge = Date.now() - new Date(session.loginTime).getTime();
          const maxAge = persistentConfig.rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
          
          if (sessionAge < maxAge) {
            // Update last activity
            session.lastActivity = new Date().toISOString();
            localStorage.setItem('quantumchat_current_session', JSON.stringify(session));
            
            setCurrentUser(session.user);
            setLoggedIn(true);
            console.log('Session restored for user:', session.user.email);
          } else {
            // Session expired, clean up
            localStorage.removeItem('quantumchat_persistent_session');
            localStorage.removeItem('quantumchat_current_session');
            console.log('Session expired, user needs to log in again');
          }
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        // Clean up corrupted session data
        localStorage.removeItem('quantumchat_persistent_session');
        localStorage.removeItem('quantumchat_current_session');
      } finally {
        setIsLoadingAuth(false);
      }
    };

    restoreSession();
  }, []);

  // Activity tracking to extend session
  useEffect(() => {
    if (!loggedIn) return;

    const updateActivity = () => {
      const sessionData = localStorage.getItem('quantumchat_current_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        session.lastActivity = new Date().toISOString();
        localStorage.setItem('quantumchat_current_session', JSON.stringify(session));
      }
    };

    // Update activity on user interactions
    const events = ['click', 'keydown', 'scroll', 'mousemove'];
    let activityTimeout;

    const throttledUpdate = () => {
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(updateActivity, 30000); // Update every 30 seconds max
    };

    events.forEach(event => {
      document.addEventListener(event, throttledUpdate);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledUpdate);
      });
      clearTimeout(activityTimeout);
    };
  }, [loggedIn]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      try { localStorage.setItem('quantumchat_theme', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };

  const handleLogin = (user, rememberMe = false) => {
    // Enhanced login with robust session management
    const sessionData = {
      user: {
        ...user,
        loginTime: new Date().toISOString(),
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2)}`
      },
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    // Store session data
    localStorage.setItem('quantumchat_current_session', JSON.stringify(sessionData));
    
    // Store persistent session configuration if remember me is enabled
    if (rememberMe) {
      localStorage.setItem('quantumchat_persistent_session', JSON.stringify({
        rememberMe: true,
        createdAt: new Date().toISOString()
      }));
    }

    setCurrentUser(sessionData.user);
    setLoggedIn(true);
    
    console.log('User logged in successfully:', {
      email: user.email,
      rememberMe,
      sessionId: sessionData.user.sessionId
    });
  };

  const handleLogout = () => {
    // Enhanced logout with complete cleanup
    try {
      // Clear all session data
      localStorage.removeItem('quantumchat_current_session');
      localStorage.removeItem('quantumchat_persistent_session');
      localStorage.removeItem('chatapp_remember_user');
      
      // Clear any cached user data but preserve app preferences
      const chats = localStorage.getItem('quantumchat_chats');
      const theme = localStorage.getItem('quantumchat_theme');
      
      // You might want to keep user chats or clear them based on privacy preferences
      // For now, we'll keep chats but clear sensitive session data
      
      setCurrentUser(null);
      setLoggedIn(false);
      
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Show loading screen while checking authentication
  if (isLoadingAuth) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: darkMode ? '#1a1a1a' : '#ffffff'
      }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div style={{ color: darkMode ? '#ffffff' : '#000000' }}>
            Restoring your session...
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Auth pages (no sidebar) */}
        <Route 
          path="/login" 
          element={
            loggedIn ? 
            <Navigate to="/" replace /> : 
            <AnimatedAuthForm 
              darkMode={darkMode} 
              toggleDarkMode={toggleDarkMode} 
              onLogin={handleLogin} 
            />
          } 
        />
        <Route 
          path="/signup" 
          element={
            loggedIn ? 
            <Navigate to="/" replace /> : 
            <AnimatedAuthForm 
              darkMode={darkMode} 
              toggleDarkMode={toggleDarkMode} 
              signupMode={true} 
              onLogin={handleLogin} 
            />
          } 
        />

        {/* Main app pages (with sidebar) */}
        <Route
          path="/"
          element={loggedIn ? <MainLayout currentUser={currentUser} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        >
          <Route index element={<ChatApp />} />
          <Route path="update" element={<UpgradePlan />} />
          <Route path="library" element={<LibraryView />} />
          <Route path="shared-chat" element={<SharedChatView />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
