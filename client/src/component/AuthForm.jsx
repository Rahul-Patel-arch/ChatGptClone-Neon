import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Eye, EyeOff } from 'lucide-react';
import gptIcon from '../assets/gpt-clone-icon.png';
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
      <div className={`min-vh-100 d-flex align-items-center justify-content-center gradient-bg`}>
        <div className="container-fluid">
          <div className="row justify-content-center">
            {/* Branding Section */}
            <div className="col-lg-6 d-none d-lg-flex align-items-center justify-content-center">
              <div className="text-center p-5">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <img 
                    src={gptIcon} 
                    alt="ChatClone Logo" 
                    style={{width: '120px', height: '120px'}} 
                    className="mb-4"
                  />
                  <h1 className="display-4 fw-bold mb-3" style={{
                    color: '#64748b',
                    fontWeight: '700'
                  }}>ChatClone</h1>
                  <p className="lead mb-4" style={{
                    color: '#64748b',
                    fontWeight: '400'
                  }}>
                    Enterprise-grade AI platform delivering intelligent conversational experiences through cutting-edge language models
                  </p>
                  <div className="mt-4">
                    <div className="d-flex flex-column gap-3 text-start">
                      <div className="d-flex align-items-center gap-3">
                        <div className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{
                          width: '40px', 
                          height: '40px',
                          background: 'rgba(100, 116, 139, 0.15)',
                          border: '1px solid rgba(100, 116, 139, 0.2)'
                        }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="#64748b">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" opacity="0.8"/>
                            <path d="M2 17L12 22L22 17"/>
                            <path d="M2 12L12 17L22 12"/>
                          </svg>
                        </div>
                        <div>
                          <div className="fw-semibold" style={{
                            color: '#475569',
                            fontWeight: '600'
                          }}>Advanced AI Technology</div>
                          <small style={{
                            color: '#64748b',
                            fontWeight: '400'
                          }}>Next-generation language processing capabilities</small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <div className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{
                          width: '40px', 
                          height: '40px',
                          background: 'rgba(100, 116, 139, 0.15)',
                          border: '1px solid rgba(100, 116, 139, 0.2)'
                        }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="#64748b">
                            <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="fw-semibold" style={{
                            color: '#475569',
                            fontWeight: '600'
                          }}>Intelligent Conversations</div>
                          <small style={{
                            color: '#64748b',
                            fontWeight: '400'
                          }}>Context-aware dialogue with natural language understanding</small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <div className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{
                          width: '40px', 
                          height: '40px',
                          background: 'rgba(100, 116, 139, 0.15)',
                          border: '1px solid rgba(100, 116, 139, 0.2)'
                        }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="#64748b">
                            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/>
                            <path d="M9 12L11 14L15 10" stroke="#64748b" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div>
                          <div className="fw-semibold" style={{
                            color: '#475569',
                            fontWeight: '600'
                          }}>Enterprise Security</div>
                          <small style={{
                            color: '#64748b',
                            fontWeight: '400'
                          }}>End-to-end encryption with privacy-first architecture</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Form Section */}
            <div className="col-lg-6 col-md-8 col-sm-10">
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`p-5 shadow-lg rounded-4 ${
                  darkMode ? 'bg-dark text-white' : 'bg-white'
                }`}
                style={{ maxWidth: '500px', margin: '0 auto' }}
              >
                {/* Dark Mode Toggle */}
                <div className="text-end mb-3">
                  <button
                    onClick={toggleDarkMode}
                    className={`btn btn-sm rounded-3 ${
                      darkMode ? 'btn-outline-light' : 'btn-outline-secondary'
                    }`}
                  >
                    {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                  </button>
                </div>

                {/* Auth Tabs */}
                <div className="d-flex mb-4 rounded-3 p-1" style={{
                  backgroundColor: darkMode ? '#333' : '#f8f9fa'
                }}>
                  <button
                    className={`btn flex-fill rounded-3 fw-semibold ${
                      isLoginView 
                        ? 'btn-primary text-white' 
                        : (darkMode ? 'text-white' : 'text-dark')
                    }`}
                    style={{
                      background: isLoginView ? 'linear-gradient(to right, #3b82f6, #8b5cf6)' : 'none',
                      border: 'none'
                    }}
                    onClick={() => switchView('login')}
                  >
                    LOG IN
                  </button>
                  <button
                    className={`btn flex-fill rounded-3 fw-semibold ${
                      !isLoginView 
                        ? 'btn-primary text-white' 
                        : (darkMode ? 'text-white' : 'text-dark')
                    }`}
                    style={{
                      background: !isLoginView ? 'linear-gradient(to right, #3b82f6, #8b5cf6)' : 'none',
                      border: 'none'
                    }}
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
                      className="alert alert-danger rounded-3 mb-3"
                    >
                      {error}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="alert alert-success rounded-3 mb-3"
                    >
                      {success}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Auth Form */}
                <form onSubmit={isLoginView ? handleLogin : handleSignup}>
                  <div className="mb-3 position-relative">
                    <label htmlFor="email" className="form-label visually-hidden">Email</label>
                    <input
                      id="email"
                      type="email"
                      className={`form-control form-control-lg rounded-3 auth-input ${
                        darkMode ? 'bg-dark text-white border-secondary' : ''
                      } ${
                        emailValid === true ? 'is-valid' : 
                        emailValid === false ? 'is-invalid' : ''
                      }`}
                      style={{
                        '--bs-form-control-placeholder-color': darkMode ? '#adb5bd' : '#6c757d'
                      }}
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
                      <div className="invalid-feedback">
                        Please enter a valid email address.
                      </div>
                    )}
                    {emailValid === true && (
                      <div className="valid-feedback">
                        Email looks good!
                      </div>
                    )}
                  </div>

                  {!isLoginView && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-3"
                    >
                      <label htmlFor="username" className="form-label visually-hidden">Username</label>
                      <input
                        id="username"
                        type="text"
                        className={`form-control form-control-lg rounded-3 auth-input ${
                          darkMode ? 'bg-dark text-white border-secondary' : ''
                        } ${
                          usernameValid === true ? 'is-valid' : 
                          usernameValid === false ? 'is-invalid' : ''
                        }`}
                        style={{
                          '--bs-form-control-placeholder-color': darkMode ? '#adb5bd' : '#6c757d'
                        }}
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
                        <div className="invalid-feedback">
                          Username must be at least 3 characters and contain only letters, numbers, and underscores.
                        </div>
                      )}
                      {usernameValid === true && (
                        <div className="valid-feedback">
                          Username is available!
                        </div>
                      )}
                    </motion.div>
                  )}

                  <div className="mb-3 position-relative">
                    <label htmlFor="password" className="form-label visually-hidden">Password</label>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className={`form-control form-control-lg rounded-3 auth-input ${
                        darkMode ? 'bg-dark text-white border-secondary' : ''
                      }`}
                      style={{
                        '--bs-form-control-placeholder-color': darkMode ? '#adb5bd' : '#6c757d'
                      }}
                      placeholder={isLoginView ? "Enter your password" : "Create a secure password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="btn position-absolute top-50 end-0 translate-middle-y me-2"
                      style={{ border: 'none', background: 'none' }}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    
                    {/* Password Strength Indicator for Signup */}
                    {!isLoginView && password && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2"
                      >
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <small className={darkMode ? 'text-light' : 'text-muted'}>
                            Password Strength:
                          </small>
                          <small style={{ color: passwordStrength.color, fontWeight: 'bold' }}>
                            {passwordStrength.label}
                          </small>
                        </div>
                        <div className="progress" style={{ height: '4px' }}>
                          <div
                            className="progress-bar"
                            style={{
                              width: `${(passwordStrength.score / 6) * 100}%`,
                              backgroundColor: passwordStrength.color,
                              transition: 'all 0.3s ease'
                            }}
                          />
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
                        <label className="form-check-label small" htmlFor="rememberMe">
                          Remember Me
                        </label>
                      </div>
                      <a href="#forgot" className="small text-decoration-none">
                        Forgot Password?
                      </a>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="agreeTerms"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          required
                        />
                        <label className="form-check-label small" htmlFor="agreeTerms">
                          I agree to the <a href="#terms" className="text-decoration-none">Terms & Conditions</a>
                        </label>
                      </div>
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="btn text-white w-100 py-3 fw-bold rounded-3 mb-3"
                    style={{
                      background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                      border: 'none'
                    }}
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
                <div className="text-center mb-3">
                  <span className={`px-3 ${darkMode ? 'text-light' : 'text-muted'}`}
                    style={{ backgroundColor: darkMode ? '#212529' : 'white' }}>
                    or
                  </span>
                  <hr className="mt-n2" />
                </div>

                {/* Social Login */}
                <div className="d-flex justify-content-center gap-3 mb-4">
                  <button
                    className={`btn rounded-circle ${
                      darkMode ? 'btn-outline-light' : 'btn-outline-secondary'
                    }`}
                    style={{ width: '50px', height: '50px' }}
                    onClick={() => handleSocialLogin('Google')}
                    title="Continue with Google"
                  >
                    G
                  </button>
                  <button
                    className={`btn rounded-circle ${
                      darkMode ? 'btn-outline-light' : 'btn-outline-secondary'
                    }`}
                    style={{ width: '50px', height: '50px' }}
                    onClick={() => handleSocialLogin('Microsoft')}
                    title="Continue with Microsoft"
                  >
                    M
                  </button>
                  <button
                    className={`btn rounded-circle ${
                      darkMode ? 'btn-outline-light' : 'btn-outline-secondary'
                    }`}
                    style={{ width: '50px', height: '50px' }}
                    onClick={() => handleSocialLogin('Apple')}
                    title="Continue with Apple"
                  >
                    🍎
                  </button>
                </div>

                {/* Switch Auth */}
                <div className="text-center">
                  <span className="small">
                    {isLoginView ? "Don't have an account? " : "Already have an account? "}
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none"
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
