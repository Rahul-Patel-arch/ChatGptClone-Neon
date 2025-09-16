import React, { useState, useEffect } from 'react';
import ChatApp from './ChatApp';
import AuthForm from './component/AuthForm';
function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const handleLogin = (user) => {
    setCurrentUser(user);
    setLoggedIn(true);
    const userTheme = user.preferences?.theme || 'system';
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDarkMode(userTheme === 'dark' || (userTheme === 'system' && systemPrefersDark));
  };
  const handleLogout = () => {
    setCurrentUser(null);
    setLoggedIn(false);

    setDarkMode(false);
    localStorage.removeItem('chatapp_remember_user');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  useEffect(() => {
    document.body.className = darkMode ? 'bg-dark text-white' : 'bg-light text-dark';
  }, [darkMode]);
  return (
    <>
      {loggedIn ? (
        <ChatApp user={currentUser} onLogout={handleLogout} />
      ) : (

        <AuthForm
          onLogin={handleLogin}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
        />
      )}
    </>
  );
}
export default App;