import React from "react";
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from "framer-motion";
import { Check, X, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./UpgradePlan.css";

const UpgradePlan = ({ onClose }) => {
  const navigate = useNavigate();
  const handleClose = () => {
    if (onClose) return onClose();
    // If opened via route, navigate back to main chat
    navigate("/");
  };

  const goToCheckout = () => {
    // Navigate to dedicated checkout page with plan details
    navigate("/checkout?plan=pro&price=599&currency=₹");
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
                  <h3 className="plan-title">QuantumChat Free</h3>
                  <p className="plan-description">Perfect for getting started</p>
                </div>

                <div className="plan-features">
                  <div className="feature-item">
                    <Check size={18} className="feature-icon" />
                    <span>Basic AI conversations</span>
                  </div>
                  <div className="feature-item">
                    <Check size={18} className="feature-icon" />
                    <span>10 messages per day</span>
                  </div>
                  <div className="feature-item">
                    <Check size={18} className="feature-icon" />
                    <span>Standard response time</span>
                  </div>
                  <div className="feature-item">
                    <Check size={18} className="feature-icon" />
                    <span>Basic chat export</span>
                  </div>
                  <div className="feature-item">
                    <Check size={18} className="feature-icon" />
                    <span>Light & Dark themes</span>
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
                    QuantumChat Pro
                  </h3>
                  <p className="plan-description">Unlock the full QuantumChat experience</p>
                </div>

                <div className="plan-features">
                  <div className="feature-item">
                    <Check size={18} className="feature-icon" />
                    <span>Unlimited conversations</span>
                  </div>
                  <div className="feature-item">
                    <Check size={18} className="feature-icon" />
                    <span>Advanced AI models</span>
                  </div>
                  <div className="feature-item">
                    <Check size={18} className="feature-icon" />
                    <span>Priority response speed</span>
                  </div>
                  <div className="feature-item">
                    <Check size={18} className="feature-icon" />
                    <span>Enhanced PDF export</span>
                  </div>
                  <div className="feature-item">
                    <Check size={18} className="feature-icon" />
                    <span>Custom instructions</span>
                  </div>
                  <div className="feature-item">
                    <Check size={18} className="feature-icon" />
                    <span>File attachments</span>
                  </div>
                  <div className="feature-item">
                    <Check size={18} className="feature-icon" />
                    <span>Advanced search & archive</span>
                  </div>
                  <div className="feature-item">
                    <Check size={18} className="feature-icon" />
                    <span>24/7 priority support</span>
                  </div>
                </div>

                <div className="plan-footer">
                  <div className="plan-price">
                    <span className="price-amount">₹599</span>
                    <span className="price-period">/month</span>
                  </div>
                  <button className="plan-button upgrade-button" onClick={goToCheckout}>
                    Upgrade to Pro
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Footer Info */}
            <div className="upgrade-footer">
              <p className="footer-text">
                ✨ Start your QuantumChat Pro journey today. Cancel anytime with just one click.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpgradePlan;
