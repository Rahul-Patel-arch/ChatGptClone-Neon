import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sun, Moon, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import emailjs from '@emailjs/browser';
import quantumIcon from '../assets/quantum-chat-icon.png';
import SocialLoginModal from './SocialLoginModal';
import '../styles/animatedAuth.css';

const AnimatedAuthForm = ({ darkMode, toggleDarkMode, onLogin }) => {
  const navigate = useNavigate();
  const [isSignIn, setIsSignIn] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Initialize container after a slight delay for animation
  useEffect(() => {
    const timer = setTimeout(() => {
      const container = document.getElementById('auth-container');
      if (container) {
        container.classList.add('sign-in');
      }
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);

  // Toggle between sign-in and sign-up with improved transitions
  const toggle = () => {
    setError('');
    setSuccess('');
    const container = document.getElementById('auth-container');
    if (container) {
      // Apply transition class to indicate animation in progress
      container.classList.add('transitioning');
      
      // Clear all form fields when toggling
      if (isSignIn) {
        // When switching to sign-up, clear only password
        setPassword('');
        setConfirmPassword('');
      } else {
        // When switching to sign-in, clear only password
        setPassword('');
      }
      
      // Use timeout to allow CSS transitions to complete
      setTimeout(() => {
        container.classList.toggle('sign-in');
        container.classList.toggle('sign-up');
        setIsSignIn(!isSignIn);
        
        // Remove transition class after animation completes
        setTimeout(() => {
          container.classList.remove('transitioning');
        }, 1000);
      }, 300);
    }
  };

  // Handle sign-in
  const handleSignIn = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    // Demo login - in a real app this would validate against a backend
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('chatapp_users')) || [];
      const foundUser = users.find(user => user.email === email && user.password === password);

      if (foundUser) {
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          onLogin({
            email: foundUser.email,
            name: foundUser.username || 'User',
            id: foundUser.id,
            preferences: foundUser.preferences || {}
          });
          // navigate to root so App mounts protected routes
          try { navigate('/', { replace: true }); } catch (e) { /* noop if navigate unavailable */ }
        }, 1000);
      } else {
        setError('Invalid credentials. Please try again.');
      }
      setIsLoading(false);
    }, 1500);
  };

  // Handle sign-up
  const handleSignUp = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    // Password validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Terms validation
    if (!agreeTerms) {
      setError('Please agree to the Terms of Service');
      setIsLoading(false);
      return;
    }

    // Demo registration - in a real app this would register with a backend
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('chatapp_users')) || [];
      
      // Check if user already exists
      if (users.some(user => user.email === email)) {
        setError('An account with this email already exists');
        setIsLoading(false);
        return;
      }

      // Create new user
      const newUser = {
        id: Date.now(),
        email,
        username,
        password,
        createdAt: new Date().toISOString(),
        preferences: {
          theme: darkMode ? 'dark' : 'light',
          language: 'en',
          notifications: true
        }
      };

      users.push(newUser);
      localStorage.setItem('chatapp_users', JSON.stringify(users));

      setSuccess('Account created successfully!');
      
      // Auto switch to login
      setTimeout(() => {
        toggle();
        setEmail(email);
        setPassword('');
        setSuccess('Please sign in with your new account');
      }, 1500);
      
      setIsLoading(false);
    }, 1500);
  };

  // Demo credentials removed: this app no longer auto-fills demo login info
  
  // Social login handlers
  const handleSocialLogin = (provider) => {
    setActiveProvider(provider);
    setIsModalOpen(true);
    setError('');
    setSuccess('');
  };

  const handleSocialLoginSuccess = (provider) => {
    setIsModalOpen(false);
    setSuccess(`Successfully authenticated with ${provider}!`);
    
    // Create or update social login user
    const socialUser = {
      id: Date.now(),
      email: `user@${provider.toLowerCase()}.com`,
      username: `${provider} User`,
      provider: provider,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      isActive: true,
      preferences: {
        theme: 'system',
        language: 'en',
        notifications: true
      }
    };

    // Store social user info
    const users = JSON.parse(localStorage.getItem('chatapp_users')) || [];
    const existingSocialUser = users.find(user => user.provider === provider);
    
    if (!existingSocialUser) {
      users.push(socialUser);
      localStorage.setItem('chatapp_users', JSON.stringify(users));
    }
    
    setTimeout(() => {
      onLogin({
        email: socialUser.email,
        name: socialUser.username,
        id: socialUser.id,
        provider: provider,
        preferences: socialUser.preferences,
        lastLogin: socialUser.lastLogin
      });
      try { navigate('/', { replace: true }); } catch (e) {}
    }, 1500);
  };

  // Google OAuth using react-oauth hook with COOP handling
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        setError('');
        setSuccess('Authenticating with Google...');

        // Fetch user info from Google
        const res = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const profile = res.data;

        // Create or update local user record
        const users = JSON.parse(localStorage.getItem('chatapp_users')) || [];
        let existing = users.find(u => u.email === profile.email);
        let userToLogin;
        
        if (!existing) {
          const newUser = {
            id: profile.sub || Date.now(),
            email: profile.email,
            username: profile.name || profile.email.split('@')[0],
            provider: 'Google',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            isActive: true,
            preferences: { theme: 'system', language: 'en', notifications: true }
          };
          users.push(newUser);
          localStorage.setItem('chatapp_users', JSON.stringify(users));
          userToLogin = newUser;
        } else {
          existing.lastLogin = new Date().toISOString();
          localStorage.setItem('chatapp_users', JSON.stringify(users.map(u => u.id === existing.id ? existing : u)));
          userToLogin = existing;
        }

        setTimeout(() => {
          onLogin({ email: userToLogin.email, name: userToLogin.username || userToLogin.name || 'User', id: userToLogin.id, preferences: userToLogin.preferences || {} });
          try { navigate('/', { replace: true }); } catch (e) {}
        }, 800);
      } catch (err) {
        console.error('Google login failed', err);
        setError('Google login failed. Please try again.');
        setSuccess('');
        setIsLoading(false);
      }
    },
    onError: (err) => {
      console.error('Google OAuth error', err);
      setError('Google login failed. Please try again.');
      setIsLoading(false);
    },
    // Configuration to handle COOP issues
    ux_mode: 'popup',
    select_account: true,
    // Additional configuration for COOP handling
    hosted_domain: undefined,
    use_fedcm_for_prompt: false,
  });

  // Forgot password / Reset modals implemented inline to avoid creating new files
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!email) { setError('Please enter your email'); return; }
    const users = JSON.parse(localStorage.getItem('chatapp_users')) || [];
    const found = users.find(u => u.email === email);
    // Always show a generic message to avoid user enumeration
    setSuccess('If an account with that email exists, a reset link has been sent.');
    setTimeout(() => setShowForgotPassword(false), 1800);

    if (found) {
      // Save a simple reset token in localStorage (demo only)
      const token = Math.random().toString(36).slice(2, 12);
      const resetStore = JSON.parse(localStorage.getItem('chatapp_password_resets') || '{}');
      resetStore[found.email] = { token, createdAt: Date.now() };
      localStorage.setItem('chatapp_password_resets', JSON.stringify(resetStore));
      // open reset modal to simulate link click
      setResetEmail(found.email);
      // Send forgot-password email via EmailJS (demo template)
      try {
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_FORGOT_PASSWORD_TEMPLATE_ID;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
        if (serviceId && templateId && publicKey) {
          const resetLink = `${window.location.origin}${window.location.pathname}?email=${encodeURIComponent(found.email)}&reset_token=${token}`;
          emailjs.send(serviceId, templateId, { username: found.username || found.email.split('@')[0], to_email: found.email, reset_link: resetLink }, publicKey)
            .then(() => console.log('Forgot password email queued'))
            .catch(err => console.error('Forgot email failed', err));
        }
      } catch (e) {
        console.error('EmailJS error', e);
      }
      setTimeout(() => setShowResetModal(true), 500);
    }
  };

  const handleResetComplete = () => {
    setShowResetModal(false);
    setSuccess('Password reset complete. Please sign in.');
  };

  return (
    <div className={`auth-page ${darkMode ? 'dark' : 'light'}`}>
      {/* Theme toggle button */}
      <div className="theme-toggle">
        <button
          className="theme-toggle-btn"
          onClick={toggleDarkMode}
          aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Main container */}
      <div id="auth-container" className="container">
        {/* FORM SECTION */}
        <div className="row">
          {/* SIGN UP */}
          <div className="col align-items-center flex-col sign-up">
            <div className="form-wrapper align-items-center">
              <div className="form sign-up">
                {/* Logo for mobile */}
                <div className="logo-mobile">
                  <img src={quantumIcon} alt="QuantumChat Logo" className="highlighted-icon" />
                  <h3>QuantumChat</h3>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <form onSubmit={handleSignUp}>
                  <div className="input-group">
                    <User size={18} />
                    <input 
                      type="text" 
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <Mail size={18} />
                    <input 
                      type="email" 
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <Lock size={18} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button 
                      type="button" 
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="input-group">
                    <Lock size={18} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  <div className="terms-checkbox">
                    <input
                      type="checkbox"
                      id="agreeTerms"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                    />
                    <label htmlFor="agreeTerms">
                      I agree to the Terms of Service
                    </label>
                  </div>
                  <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Sign up'}
                  </button>
                </form>
                <p>
                  <span>Already have an account?</span>
                  <b onClick={toggle} className="pointer">
                    Sign in here
                  </b>
                </p>
                
                {/* Social Login Options */}
                <div className="social-login-divider">
                  <span>or sign up with</span>
                </div>
                <div className="social-login-buttons">
                  <button 
                    className="social-btn google" 
                    onClick={() => googleLogin()}
                    aria-label="Sign up with Google"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </button>
                  <button 
                    className="social-btn microsoft" 
                    onClick={() => handleSocialLogin('Microsoft')}
                    aria-label="Sign up with Microsoft"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path fill="#f25022" d="M1 1h10v10H1z"/>
                      <path fill="#00a4ef" d="M13 1h10v10H13z"/>
                      <path fill="#7fba00" d="M1 13h10v10H1z"/>
                      <path fill="#ffb900" d="M13 13h10v10H13z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* END SIGN UP */}
          
          {/* SIGN IN */}
          <div className="col align-items-center flex-col sign-in">
            <div className="form-wrapper align-items-center">
              <div className="form sign-in">
                {/* Logo for mobile */}
                <div className="logo-mobile">
                  <img src={quantumIcon} alt="QuantumChat Logo" className="highlighted-icon" />
                  <h3>QuantumChat</h3>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <form onSubmit={handleSignIn}>
                  <div className="input-group">
                    <Mail size={18} />
                    <input 
                      type="email" 
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <Lock size={18} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button 
                      type="button" 
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="extra-options">
                    <div className="remember-me">
                      <input
                        type="checkbox"
                        id="rememberMe"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <label htmlFor="rememberMe">Remember Me</label>
                    </div>
                    <div className="forgot-password">
                        <button type="button" className="btn btn-link p-0" onClick={() => setShowForgotPassword(true)}>Forgot password?</button>
                    </div>
                  </div>
                  <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign in'}
                  </button>
                </form>
                <p>
                  <span>Don't have an account?</span>
                  <b onClick={toggle} className="pointer">
                    Sign up here
                  </b>
                </p>
                {/* demo credentials button removed for production UX */}
                
                {/* Social Login Options */}
                <div className="social-login-divider">
                  <span>or continue with</span>
                </div>
                <div className="social-login-buttons">
                  <button 
                    className="social-btn google" 
                    onClick={() => googleLogin()}
                    aria-label="Sign in with Google"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </button>
                  <button 
                    className="social-btn microsoft" 
                    onClick={() => handleSocialLogin('Microsoft')}
                    aria-label="Sign in with Microsoft"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path fill="#f25022" d="M1 1h10v10H1z"/>
                      <path fill="#00a4ef" d="M13 1h10v10H13z"/>
                      <path fill="#7fba00" d="M1 13h10v10H1z"/>
                      <path fill="#ffb900" d="M13 13h10v10H13z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* END SIGN IN */}
        </div>
        {/* END FORM SECTION */}
        
        {/* CONTENT SECTION */}
        <div className="row content-row">
          {/* SIGN IN CONTENT - Only visible when in sign-in mode */}
          <div className="col align-items-center flex-col">
            <div className="text sign-in">
              <h2>QuantumChat</h2>
              <p>Experience AI-powered conversations at quantum speed</p>
            </div>
            <div className="img sign-in">
              {/* Unified icon style: removed highlighted-icon so both modes share same base look */}
              <img src={quantumIcon} alt="QuantumChat Logo" className="content-icon" />
            </div>
          </div>
          
          {/* Hidden on mobile to avoid duplicate icons */}
          <div className="col align-items-center flex-col mobile-hidden">
            <div className="img sign-up">
              {/* Reverted to non-highlighted icon so only sign-in stays blue */}
              <img src={quantumIcon} alt="QuantumChat Logo" className="content-icon" />
            </div>
            <div className="text sign-up">
              <h2>Join QuantumChat</h2>
              <p>Unlock the future of AI-powered conversations</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Forgot Password Modal (inline) */}
      {showForgotPassword && (
        <div className="modal-overlay" onClick={() => setShowForgotPassword(false)}>
          <div className={`modal-content-wrapper ${darkMode ? 'bg-dark text-light' : 'bg-white text-dark'}`} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="p-4">
              <h5 className="fw-bold">Forgot Password</h5>
              <p className="small text-muted">Enter your email and we'll send a reset link (demo).</p>
              <form onSubmit={handleForgotSubmit}>
                <div className="mb-3">
                  <input type="email" className={`form-control ${darkMode ? 'bg-dark-subtle text-white border-secondary' : ''}`} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary">Send Reset Link</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForgotPassword(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal (inline) */}
      {showResetModal && (
        <ResetPasswordModal darkMode={darkMode} email={resetEmail} onComplete={handleResetComplete} />
      )}

      {/* Social Login Modal */}
      {isModalOpen && (
        <SocialLoginModal
          provider={activeProvider}
          darkMode={darkMode}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSocialLoginSuccess}
        />
      )}
    </div>
  );
};

export default AnimatedAuthForm;

// Inline ResetPasswordModal to avoid extra files. This updates localStorage directly (demo only).
function ResetPasswordModal({ darkMode, email, onComplete }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!password || password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setIsLoading(true);
    const users = JSON.parse(localStorage.getItem('chatapp_users')) || [];
    const idx = users.findIndex(u => u.email === email);
    if (idx === -1) { setError('User not found'); setIsLoading(false); return; }
    const updated = { ...users[idx], password };
    const updatedList = users.map(u => u.email === email ? updated : u);
    localStorage.setItem('chatapp_users', JSON.stringify(updatedList));
    setTimeout(() => { setIsLoading(false); onComplete(); }, 800);
  };

  return (
    <div className="modal-overlay" onClick={onComplete}>
      <div className={`modal-content-wrapper ${darkMode ? 'bg-dark text-light' : 'bg-white text-dark'}`} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="p-4">
          <h5 className="fw-bold">Reset Password</h5>
          <p className="small text-muted">Create a new password for <strong>{email}</strong></p>
          {error && <div className="alert alert-danger small">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3 position-relative">
              <input type={showPassword ? 'text' : 'password'} className={`form-control ${darkMode ? 'bg-dark-subtle text-white border-secondary' : ''}`} placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" className="btn position-absolute top-50 end-0 translate-middle-y" style={{ border: 'none', background: 'transparent' }} onClick={() => setShowPassword(s => !s)}>{showPassword ? 'Hide' : 'Show'}</button>
            </div>
            <div className="mb-3">
              <input type={showPassword ? 'text' : 'password'} className={`form-control ${darkMode ? 'bg-dark-subtle text-white border-secondary' : ''}`} placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Saving...' : 'Reset Password'}</button>
              <button type="button" className="btn btn-secondary" onClick={onComplete}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}