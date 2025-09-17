import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Star, Crown } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import "./UpgradePlan.css";

const UpgradePlan = ({ darkMode, onClose }) => {
  const navigate = useNavigate();
  const handleClose = () => {
    if (onClose) return onClose();
    // If opened via route, navigate back to main chat
    navigate('/');
  };

  return (
    <AnimatePresence>
      <motion.div
        className="upgrade-overlay"
        onClick={handleClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="upgrade-container"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="upgrade-header">
            <div className="header-content">
              <h1 className="upgrade-title">Upgrade Plan</h1>
              <p className="upgrade-subtitle">
                Choose a plan that works best for you. Upgrade anytime.
              </p>
            </div>
            <button className="close-button" onClick={handleClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="upgrade-body">
            <div className="plans-grid">
              {/* Free Plan */}
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="plan-card free-plan"
              >
                <div className="plan-header">
                  <h3 className="plan-title">Free</h3>
                  <p className="plan-description">For casual use</p>
                </div>
                
                <div className="plan-features">
                  <div className="feature-item">
                    <Check size={18} className="feature-icon" />
                    <span>Access to GPT-3.5</span>
                  </div>
                  <div className="feature-item">
                    <Check size={18} className="feature-icon" />
                    <span>Standard response speed</span>
                  </div>
                  <div className="feature-item">
                    <Check size={18} className="feature-icon" />
                    <span>Limited features</span>
                  </div>
                </div>

                <div className="plan-footer">
                  <div className="plan-price">
                    <span className="price-amount">₹0</span>
                    <span className="price-period">/month</span>
                  </div>
                  <button className="plan-button current-plan" disabled>
                    Current Plan
                  </button>
                </div>
              </motion.div>

              {/* Pro Plan */}
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="plan-card pro-plan"
              >
                <div className="plan-header">
                  <h3 className="plan-title">
                    <Crown size={20} className="plan-icon" />
                    Pro
                  </h3>
                  <p className="plan-description">For power users & professionals</p>
                </div>
                
                <div className="plan-features">
                  <div className="feature-item">
                    <Check size={18} className="feature-icon" />
                    <span>Access to GPT-4</span>
                  </div>
                  <div className="feature-item">
                    <Check size={18} className="feature-icon" />
                    <span>Faster response speed</span>
                  </div>
                  <div className="feature-item">
                    <Check size={18} className="feature-icon" />
                    <span>Priority support</span>
                  </div>
                  <div className="feature-item">
                    <Check size={18} className="feature-icon" />
                    <span>Advanced features</span>
                  </div>
                  <div className="feature-item">
                    <Check size={18} className="feature-icon" />
                    <span>Custom AI models</span>
                  </div>
                </div>

                <div className="plan-footer">
                  <div className="plan-price">
                    <span className="price-amount">₹1,299</span>
                    <span className="price-period">/month</span>
                  </div>
                  <button className="plan-button upgrade-button">
                    Upgrade Now
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Footer Info */}
            <div className="upgrade-footer">
              <p className="footer-text">
                All plans include a 7-day free trial. Cancel anytime.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpgradePlan;
