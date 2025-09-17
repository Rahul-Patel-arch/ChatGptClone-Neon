import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader } from 'lucide-react';

export default function SocialLoginModal({ provider, darkMode, onClose, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              onSuccess(provider);
            }, 500);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [isLoading, provider, onSuccess]);

  const handleLogin = () => {
    // For Google we allow an inline email capture flow (no external popup)
    if (provider === 'Google') {
      setIsLoading(true);
      setProgress(0);
      // simulate creation then call onSuccess with a small user object
      setTimeout(() => {
        const user = { id: Date.now(), email: email || `user@google.com`, username: username || (email ? email.split('@')[0] : 'GoogleUser'), provider: 'Google', createdAt: new Date().toISOString(), lastLogin: new Date().toISOString(), isActive: true, preferences: { theme: 'system', language: 'en', notifications: true } };
        onSuccess(provider, user);
      }, 900);
      return;
    }

    setIsLoading(true);
    setProgress(0);
  };

  const getProviderColor = () => {
    switch (provider) {
      case 'Google': return '#fef4fc';
      case 'Microsoft': return '#f4f2ff';
      case 'Apple': return '#fff7f3';
      default: return '#fffcf5';
    }
  };

  const getProviderIcon = () => {
    switch (provider) {
      case 'Google': return '🟡';
      case 'Microsoft': return '🟦';
      case 'Apple': return '🍎';
      default: return '🔗';
    }
  };

  return (
    <AnimatePresence>
      <div className="modal show d-block" tabIndex="-1" style={{zIndex: 1050}}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-backdrop show"
          onClick={onClose}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)'
          }}
        />
        
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className={`modal-content border-0 shadow-lg ${
              darkMode ? 'bg-dark text-white' : 'bg-white'
            }`}
            style={{ borderRadius: '20px' }}
          >
            <div className="modal-header border-0 pb-0">
              <button
                type="button"
                className={`btn-close ${darkMode ? 'btn-close-white' : ''}`}
                onClick={onClose}
                disabled={isLoading}
              />
            </div>

            <div className="modal-body text-center px-4 py-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring" }}
                className="mb-3"
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2"
                  style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: getProviderColor(),
                    fontSize: '1.8rem'
                  }}
                >
                  {isLoading ? (
                    <Loader className="text-white" size={28} style={{
                      animation: 'spin 1s linear infinite'
                    }} />
                  ) : (
                    <span style={{ filter: 'grayscale(0)' }}>
                      {getProviderIcon()}
                    </span>
                  )}
                </div>
              </motion.div>

              <h5 className="mb-2">
                Continue with {provider}
              </h5>

              {!isLoading ? (
                <div>
                  {provider === 'Google' ? (
                    <div>
                      <p className={`small mb-2 ${darkMode ? 'text-light' : 'text-muted'}`} style={{fontSize: '12px'}}>Sign in with your Google email (demo inline flow)</p>
                      <div className="mb-2">
                        <input type="email" className={`form-control mb-2 ${darkMode ? 'bg-dark-subtle text-white border-secondary' : ''}`} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        <input type="text" className={`form-control ${darkMode ? 'bg-dark-subtle text-white border-secondary' : ''}`} placeholder="Username (optional)" value={username} onChange={(e) => setUsername(e.target.value)} />
                      </div>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn text-white px-4 py-2 rounded-pill fw-semibold mb-2" style={{ backgroundColor: getProviderColor(), border: 'none' }} onClick={handleLogin}>Continue</motion.button>
                      <div><small className={`${darkMode ? 'text-light' : 'text-muted'}`} style={{fontSize: '11px'}}>This is a demo inline flow. Real Google OAuth should use Google popups or server-side auth.</small></div>
                    </div>
                  ) : (
                    <>
                      <p className={`small mb-3 ${darkMode ? 'text-light' : 'text-muted'}`} style={{fontSize: '12px'}}>You'll be redirected to {provider} to complete your login.</p>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn text-white px-4 py-2 rounded-pill fw-semibold mb-2" style={{ backgroundColor: getProviderColor(), border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }} onClick={handleLogin}>Continue</motion.button>
                      <div><small className={`${darkMode ? 'text-light' : 'text-muted'}`} style={{fontSize: '11px'}}>By continuing, you agree to our Terms of Service</small></div>
                    </>
                  )}
                </div>
              ) : (
                <div>
                  <p className="mb-2" style={{fontSize: '14px'}}>
                    Connecting to {provider}...
                  </p>

                  <div className="mb-2">
                    <div 
                      className={`progress ${darkMode ? 'bg-secondary' : ''}`}
                      style={{ height: '6px', borderRadius: '10px' }}
                    >
                      <motion.div
                        className="progress-bar"
                        style={{
                          backgroundColor: getProviderColor(),
                          borderRadius: '10px'
                        }}
                        initial={{ width: '0%' }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>

                  <small className={`${darkMode ? 'text-light' : 'text-muted'}`} style={{fontSize: '12px'}}>
                    {progress < 50 ? 'Redirecting...' : 
                     progress < 80 ? 'Authenticating...' : 
                     'Almost done...'}
                  </small>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
