import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
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
          className={`upgrade-container`}
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="upgrade-header d-flex justify-content-between align-items-center">
            <h2 className="fw-bold mb-0">Upgrade Plan</h2>
            <button className="btn-close" onClick={handleClose} aria-label="Close">×</button>
          </div>

          {/* Content */}
          <div className="upgrade-body no-scroll">
            <p className="text-muted mb-4">
              Choose a plan that works best for you. Upgrade anytime.
            </p>

            <div className="plans-grid">
              {/* Free Plan */}
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                className="plan-card free-plan border rounded-4 p-4"
              >
                <h4>Free</h4>
                <p className="text-black">For casual use</p>
                <ul className="list-unstyled">
                  <li><Check size={16} className="me-2 text-success" /> Access to GPT-3.5</li>
                  <li><Check size={16} className="me-2 text-success" /> Standard response speed</li>
                  <li><Check size={16} className="me-2 text-success" /> Limited features</li>
                </ul>
                <button className="btn btn-outline-primary w-100 mt-3" disabled>
                  Current Plan
                </button>
              </motion.div>

              {/* Pro Plan */}
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                className="plan-card pro-plan border rounded-4 p-4"
              >
                <h4>
                  Pro <span className="badge popular-badge ms-2">Popular</span>
                </h4>
                <p className="text-light">For power users & professionals</p>
                <ul className="list-unstyled">
                  <li><Check size={16} className="me-2 text-light" /> Access GPT-4</li>
                  <li><Check size={16} className="me-2 text-light" /> Faster response speed</li>
                  <li><Check size={16} className="me-2 text-light" /> Priority support</li>
                </ul>
                <div className="d-flex align-items-center justify-content-between mt-3">
                  <h3 className="fw-bold mb-0"> ₹1,299 <small className="text-light">/month</small></h3>
                  <button className="btn upgrade-btn">Upgrade</button>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpgradePlan;
