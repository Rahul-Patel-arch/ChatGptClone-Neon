import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Eye, EyeOff } from 'lucide-react';
import gptIcon from '../assets/quantum-chat-icon.png';
import SocialLoginModal from './SocialLoginModal';

export default function AuthForm({ darkMode, toggleDarkMode, onLogin }) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState('');
  
  // Form validation states
  const [emailValid, setEmailValid] = useState(null);
  const [usernameValid, setUsernameValid] = useState(null);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    // Enhanced validation
    if (!email || !username || !password) {
      setError('❌ All fields are required.');
      setIsLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('❌ Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    // Username validation
    if (username.length < 3) {
      setError('❌ Username must be at least 3 characters long.');
      setIsLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('❌ Username can only contain letters, numbers, and underscores.');
      setIsLoading(false);
      return;
    }

    if (!agreeTerms) {
      setError('❌ Please agree to the Terms & Conditions.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('❌ Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      setError('❌ Password must contain at least one uppercase letter, one lowercase letter, and one number.');
      setIsLoading(false);
      return;
    }

    // Check if user already exists
    const users = JSON.parse(localStorage.getItem('chatapp_users')) || [];
    if (users.some(user => user.email === email)) {
      setError('❌ An account with this email already exists.');
      setIsLoading(false);
      return;
    }

    // Create new user with enhanced data structure
    const newUser = {
      id: Date.now(),
      email,
      username,
      password,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      isActive: true,
      preferences: {
        theme: 'system',
        language: 'en',
        notifications: true
      }
    };

    users.push(newUser);
    localStorage.setItem('chatapp_users', JSON.stringify(users));

    setSuccess('🎉 Account created successfully! Redirecting to login...');
    setEmail('');
    setUsername('');
    setPassword('');
    setAgreeTerms(false);
    setIsLoading(false);
    
    // Auto switch to login after 2.5 seconds with better UX
    setTimeout(() => {
      setIsLoginView(true);
      setSuccess('Welcome! Please log in with your new account.');
      // Auto-fill email for convenience
      setEmail(email);
      setTimeout(() => setSuccess(''), 3000);
    }, 2500);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    // Enhanced login validation
    if (!email || !password) {
      setError('❌ Email and password are required.');
      setIsLoading(false);
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('❌ Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    // Find user and update login timestamp
    const users = JSON.parse(localStorage.getItem('chatapp_users')) || [];
    const foundUser = users.find(user => user.email === email && user.password === password);

    if (foundUser) {
      // Update last login timestamp
      foundUser.lastLogin = new Date().toISOString();
      foundUser.isActive = true;
      
      // Update users array
      const updatedUsers = users.map(user => 
        user.id === foundUser.id ? foundUser : user
      );
      localStorage.setItem('chatapp_users', JSON.stringify(updatedUsers));

      if (rememberMe) {
        localStorage.setItem('chatapp_remember_user', JSON.stringify({
          email: foundUser.email,
          username: foundUser.username,
          id: foundUser.id
        }));
      } else {
        localStorage.removeItem('chatapp_remember_user');
      }
      
      setSuccess('✅ Login successful! Welcome back!');
      setTimeout(() => {
        onLogin({
          email: foundUser.email,
          name: foundUser.username,
          id: foundUser.id,
          preferences: foundUser.preferences || {},
          lastLogin: foundUser.lastLogin
        });
      }, 1500);
    } else {
      setError('❌ Invalid email or password. Please check your credentials.');
    }
    
    setIsLoading(false);
  };

  const handleSocialLogin = (provider) => {
    setActiveProvider(provider);
    setIsModalOpen(true);
    setError('');
    setSuccess('');
  };

  const handleSocialLoginSuccess = (provider) => {
    setIsModalOpen(false);
    setSuccess(`🎉 Successfully authenticated with ${provider}!`);
    
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
    }, 1500);
  };

  const switchView = (view) => {
    setIsLoginView(view === 'login');
    setError('');
    setSuccess('');
    setEmail('');
    setUsername('');
    setPassword('');
    setAgreeTerms(false);
    setRememberMe(false);
    setEmailValid(null);
    setUsernameValid(null);
  };

  // Real-time validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    setEmailValid(email ? isValid : null);
    return isValid;
  };

  const validateUsername = (username) => {
    const isValid = username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
    setUsernameValid(username ? isValid : null);
    return isValid;
  };

  // Auto-fill remembered user
  React.useEffect(() => {
    const rememberedUser = localStorage.getItem('chatapp_remember_user');
    if (rememberedUser && isLoginView) {
      const user = JSON.parse(rememberedUser);
      setEmail(user.email);
      setRememberMe(true);
    }
  }, [isLoginView]);

  // Password strength calculation
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

    if (score < 3) return { score, label: 'Weak', color: '#dc3545' };
    if (score < 5) return { score, label: 'Medium', color: '#ffc107' };
    return { score, label: 'Strong', color: '#28a745' };
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <>
      <div className="auth-container">
        <div className="container-fluid p-0">
          <div className="row g-0 justify-content-center">
            {/* App Logo for Mobile - Only visible on mobile */}
            <div className="col-12 d-flex d-lg-none align-items-center justify-content-center mb-3">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <img 
                    src={gptIcon} 
                    alt="QuantumChat Logo" 
                    style={{width: '60px', height: '60px'}} 
                    className="mb-1"
                  />
                  <h2 className="fw-bold mb-0">QuantumChat</h2>
                </motion.div>
              </div>
            </div>
            
            {/* Branding Section - Hidden on mobile */}
            <div className="col-lg-6 d-none d-lg-flex align-items-center justify-content-center">
              <div className="text-center p-4">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <img 
                    src={gptIcon} 
                    alt="QuantumChat Logo" 
                    style={{width: '100px', height: '100px'}} 
                    className="mb-3"
                  />
                  <h1 className="display-5 fw-bold mb-2">QuantumChat</h1>
                  <p className="lead mb-3">
                    Enterprise-grade AI platform delivering intelligent conversational experiences
                  </p>
                  <div className="mt-3">
                    <div className="d-flex flex-column gap-2 text-start">
                      <div className="auth-branding-feature">
                        <div className="auth-feature-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent)">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" opacity="0.8"/>
                            <path d="M2 17L12 22L22 17"/>
                            <path d="M2 12L12 17L22 12"/>
                          </svg>
                        </div>
                        <div>
                          <div className="fw-semibold">Advanced AI Technology</div>
                          <small className="text-muted">Next-generation language processing</small>
                        </div>
                      </div>
                      <div className="auth-branding-feature">
                        <div className="auth-feature-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent)">
                            <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="fw-semibold">Intelligent Conversations</div>
                          <small className="text-muted">Context-aware dialogue with natural language</small>
                        </div>
                      </div>
                      <div className="auth-branding-feature">
                        <div className="auth-feature-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent)">
                            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/>
                            <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div>
                          <div className="fw-semibold">Enterprise Security</div>
                          <small className="text-muted">End-to-end encryption with privacy-first design</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Form Section */}
            <div className="col-lg-6 col-md-10 col-sm-12">
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="auth-form"
              >
                {/* Dark Mode Toggle */}
                <div className="text-end mb-2">
                  <button
                    onClick={toggleDarkMode}
                    className="btn ghost"
                    aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                  </button>
                </div>

                {/* Auth Tabs */}
                <div className="auth-tabs">
                  <button
                    className={`auth-tab ${isLoginView ? 'active' : ''}`}
                    onClick={() => switchView('login')}
                  >
                    LOG IN
                  </button>
                  <button
                    className={`auth-tab ${!isLoginView ? 'active' : ''}`}
                    onClick={() => switchView('signup')}
                  >
                    SIGN UP
                  </button>
                </div>

                {/* Success/Error Messages */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="alert alert-danger rounded-3 mb-2 py-2"
                    >
                      {error}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="alert alert-success rounded-3 mb-2 py-2"
                    >
                      {success}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Auth Form */}
                <form onSubmit={isLoginView ? handleLogin : handleSignup}>
                  <div className="mb-2 position-relative">
                    <label htmlFor="email" className="form-label small mb-1">Email</label>
                    <input
                      id="email"
                      type="email"
                      className={`input ${
                        emailValid === true ? 'is-valid' : 
                        emailValid === false ? 'is-invalid' : ''
                      }`}
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (e.target.value) validateEmail(e.target.value);
                      }}
                      onBlur={(e) => validateEmail(e.target.value)}
                      required
                    />
                    {emailValid === false && (
                      <div className="invalid-feedback small">
                        Please enter a valid email address.
                      </div>
                    )}
                  </div>

                  {!isLoginView && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-2"
                    >
                      <label htmlFor="username" className="form-label small mb-1">Username</label>
                      <input
                        id="username"
                        type="text"
                        className={`input ${
                          usernameValid === true ? 'is-valid' : 
                          usernameValid === false ? 'is-invalid' : ''
                        }`}
                        placeholder="Choose a unique username"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          if (e.target.value) validateUsername(e.target.value);
                        }}
                        onBlur={(e) => validateUsername(e.target.value)}
                        required={!isLoginView}
                      />
                      {usernameValid === false && (
                        <div className="invalid-feedback small">
                          Username must be at least 3 characters (letters, numbers, underscores).
                        </div>
                      )}
                    </motion.div>
                  )}

                  <div className="mb-2 position-relative">
                    <label htmlFor="password" className="form-label small mb-1">Password</label>
                    <div className="position-relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        className="input"
                        placeholder={isLoginView ? "Enter your password" : "Create a secure password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="btn ghost position-absolute top-50 end-0 translate-middle-y"
                        style={{ padding: '6px' }}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    
                    {/* Password Strength Indicator for Signup - More compact */}
                    {!isLoginView && password && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-1"
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted" style={{fontSize: '11px'}}>
                            Strength: <span style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                          </small>
                          <div className="progress" style={{ height: '4px', width: '60%' }}>
                            <div
                              className="progress-bar"
                              style={{
                                width: `${(passwordStrength.score / 6) * 100}%`,
                                backgroundColor: passwordStrength.color,
                                transition: 'all 0.3s ease'
                              }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Auth Options */}
                  {isLoginView ? (
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="rememberMe"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <label className="form-check-label small" htmlFor="rememberMe" style={{fontSize: '12px'}}>
                          Remember Me
                        </label>
                      </div>
                      <a href="#forgot" className="small text-decoration-none" style={{fontSize: '12px'}}>
                        Forgot Password?
                      </a>
                    </div>
                  ) : (
                    <div className="mb-2">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="agreeTerms"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          required
                        />
                        <label className="form-check-label" htmlFor="agreeTerms" style={{fontSize: '12px'}}>
                          I agree to the <a href="#terms" className="text-decoration-none">Terms & Conditions</a>
                        </label>
                      </div>
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="btn primary w-100 py-2 fw-bold mb-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : null}
                    {isLoginView ? 'SECURE LOGIN' : 'CREATE ACCOUNT'}
                  </motion.button>
                </form>

                {/* Divider */}
                <div className="text-center mb-2">
                  <span className="px-3 text-muted small">or</span>
                  <hr className="mt-n2 mb-2" />
                </div>

                {/* Social Login */}
                <div className="d-flex flex-wrap justify-content-center gap-2 mb-3">
                  <button
                    className="social-button"
                    onClick={() => handleSocialLogin('Google')}
                    title="Continue with Google"
                  >
                    G
                  </button>
                  <button
                    className="social-button"
                    onClick={() => handleSocialLogin('Microsoft')}
                    title="Continue with Microsoft"
                  >
                    M
                  </button>
                  <button
                    className="social-button"
                    onClick={() => handleSocialLogin('Apple')}
                    title="Continue with Apple"
                  >
                    A
                  </button>
                </div>

                {/* Switch Auth */}
                <div className="text-center">
                  <span className={`small ${darkMode ? 'text-light' : 'text-dark'}`} style={{fontSize: '12px'}}>
                    {isLoginView ? "Don't have an account? " : "Already have an account? "}
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none"
                      style={{
                        color: darkMode ? '#a593ff' : '#6c5ce7',
                        fontWeight: '600',
                        fontSize: '12px'
                      }}
                      onClick={() => switchView(isLoginView ? 'signup' : 'login')}
                    >
                      {isLoginView ? 'Sign Up' : 'Log In'}
                    </button>
                  </span>
                </div>
              </motion.div>
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
    </>
  );
}
