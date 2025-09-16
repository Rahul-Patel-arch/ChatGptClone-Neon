import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ChatApp from "./ChatApp";
import SharedChatView from "./pages/SharedChatView";
import LibraryView from "./pages/LibraryView";
import UpgradePlan from "./pages/UpgradePlan";
import AIToolsView from "./pages/AIToolsView";
import MainLayout from "./layout/MainLayout.jsx";
import AnimatedAuthForm from "./component/AnimatedAuthForm";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const raw = localStorage.getItem('quantumchat_theme');
      return raw ? JSON.parse(raw) : false;
    } catch (e) {
      return false;
    }
  });

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      try { localStorage.setItem('quantumchat_theme', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    setLoggedIn(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoggedIn(false);
  };

  return (
    <Router>
      <Routes>
        {/* Auth pages (no sidebar) */}
  <Route path="/login" element={<AnimatedAuthForm darkMode={darkMode} toggleDarkMode={toggleDarkMode} onLogin={handleLogin} />} />
  <Route path="/signup" element={<AnimatedAuthForm darkMode={darkMode} toggleDarkMode={toggleDarkMode} signupMode={true} onLogin={handleLogin} />} />

        {/* Main app pages (with sidebar) */}
        <Route
          path="/"
          element={loggedIn ? <MainLayout currentUser={currentUser} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        >
          <Route index element={<ChatApp />} />
          <Route path="update" element={<UpgradePlan />} />
          <Route path="aitools" element={<AIToolsView />} />
          <Route path="library" element={<LibraryView />} />
          <Route path="shared-chat" element={<SharedChatView />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
