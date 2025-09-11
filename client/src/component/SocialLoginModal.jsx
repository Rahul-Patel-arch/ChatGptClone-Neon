import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader } from 'lucide-react';

export default function SocialLoginModal({ provider, darkMode, onClose, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

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
    setIsLoading(true);
    setProgress(0);
  };

  const getProviderColor = () => {
    switch (provider) {
      case 'Google': return '#db4437';
      case 'Microsoft': return '#0078d4';
      case 'Apple': return '#000';
      default: return '#6c757d';
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
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)'
          }}
        />
        
        <div className="modal-dialog modal-dialog-centered">
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

            <div className="modal-body text-center px-5 py-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring" }}
                className="mb-4"
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                  style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: getProviderColor(),
                    fontSize: '2rem'
                  }}
                >
                  {isLoading ? (
                    <Loader className="text-white" size={32} style={{
                      animation: 'spin 1s linear infinite'
                    }} />
                  ) : (
                    <span style={{ filter: 'grayscale(0)' }}>
                      {getProviderIcon()}
                    </span>
                  )}
                </div>
              </motion.div>

              <h5 className="mb-3">
                Continue with {provider}
              </h5>

              {!isLoading ? (
                <div>
                  <p className={`small mb-4 ${darkMode ? 'text-light' : 'text-muted'}`}>
                    You'll be redirected to {provider} to complete your login securely.
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn text-white px-5 py-2 rounded-pill fw-semibold mb-3"
                    style={{
                      backgroundColor: getProviderColor(),
                      border: 'none',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                    }}
                    onClick={handleLogin}
                  >
                    Continue with {provider}
                  </motion.button>

                  <div>
                    <small className={`${darkMode ? 'text-light' : 'text-muted'}`}>
                      By continuing, you agree to our Terms of Service and Privacy Policy
                    </small>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="mb-3">
                    Connecting to {provider}...
                  </p>

                  <div className="mb-3">
                    <div 
                      className={`progress ${darkMode ? 'bg-secondary' : ''}`}
                      style={{ height: '8px', borderRadius: '10px' }}
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

                  <small className={`${darkMode ? 'text-light' : 'text-muted'}`}>
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
