import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sun, Moon, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
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
                    onClick={() => handleSocialLogin('Google')}
                    aria-label="Sign up with Google"
                  >
                    G
                  </button>
                  <button 
                    className="social-btn microsoft" 
                    onClick={() => handleSocialLogin('Microsoft')}
                    aria-label="Sign up with Microsoft"
                  >
                    M
                  </button>
                  <button 
                    className="social-btn apple" 
                    onClick={() => handleSocialLogin('Apple')}
                    aria-label="Sign up with Apple"
                  >
                    A
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
                      <span>Forgot password?</span>
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
                    onClick={() => handleSocialLogin('Google')}
                    aria-label="Sign in with Google"
                  >
                    G
                  </button>
                  <button 
                    className="social-btn microsoft" 
                    onClick={() => handleSocialLogin('Microsoft')}
                    aria-label="Sign in with Microsoft"
                  >
                    M
                  </button>
                  <button 
                    className="social-btn apple" 
                    onClick={() => handleSocialLogin('Apple')}
                    aria-label="Sign in with Apple"
                  >
                    A
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