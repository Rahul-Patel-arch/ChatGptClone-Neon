import React, { useState } from "react";
import * as FramerMotion from "framer-motion";
import { X as CloseIcon, Mail } from "lucide-react";
import emailjs from "@emailjs/browser";
import { createStatelessResetToken, PASSWORD_RESET_TTL_MINUTES } from "../utils/passwordReset";

export default function ForgotPasswordModal({ darkMode, onClose }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setIsLoading(true);

    const users = JSON.parse(localStorage.getItem("chatapp_users")) || [];
    const foundUser = users.find((u) => u.email === email);

    const genericDone = () => {
      setSuccess(
        `If an account exists, a reset link (valid ${PASSWORD_RESET_TTL_MINUTES} mins) has been sent. You can open it in any browser.`
      );
      setIsLoading(false);
    };

    if (!foundUser) {
      // Delay to prevent timing attacks / enumeration
      setTimeout(genericDone, 1000 + Math.random() * 400);
      return;
    }

    // Create stateless token only
    const statelessToken = await createStatelessResetToken(foundUser.email);

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_FORGOT_PASSWORD_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    // Send user to dedicated reset password page
  const { buildResetPasswordUrl } = await import("../utils/urlHelpers");
  const resetLink = buildResetPasswordUrl(foundUser.email, statelessToken);

    if (!serviceId || !templateId || !publicKey) {
      console.warn("EmailJS not configured; simulated reset link:", resetLink);
      setTimeout(genericDone, 600);
      return;
    }

    const templateParams = {
      to_email: foundUser.email,
      username: foundUser.username || foundUser.email.split("@")[0],
      stateless_token: statelessToken,
      reset_link: resetLink,
    };

    emailjs
      .send(serviceId, templateId, templateParams, publicKey)
      .then(() => genericDone())
      .catch((err) => {
        console.error("EmailJS error", err);
        genericDone();
      });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <FramerMotion.motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -40, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className={`modal-content-wrapper ${darkMode ? "bg-dark text-light" : "bg-white text-dark"}`}
        style={{ maxWidth: 480 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className={`modal-close-btn ${darkMode ? "text-light" : "text-dark"}`}
        >
          <CloseIcon size={20} />
        </button>
        <div className="p-4 text-center">
          <Mail size={40} className="mb-2 text-primary" />
          <h5 className="fw-bold">Forgot Password?</h5>
          <p className="text-muted small mb-3">
            Enter your email and we'll send a link to reset your password. For security, you can
            only change it via the link in your inbox.
          </p>
          {error && <div className="alert alert-danger small p-2 mb-2">{error}</div>}
          {success && <div className="alert alert-success small p-2 mb-2">{success}</div>}
          {!success && (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <input
                  type="email"
                  className={`form-control ${darkMode ? "bg-dark-subtle text-white border-secondary" : ""}`}
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={isLoading}
                style={{
                  background: "linear-gradient(to right, #3b82f6, #8b5cf6)",
                  border: "none",
                  padding: "8px 16px",
                  height: "38px",
                  fontSize: "14px",
                }}
              >
                {isLoading ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>
          )}
          <button
            onClick={onClose}
            className="btn btn-link btn-sm mt-3"
            style={{
              padding: "4px 8px",
              height: "32px",
              fontSize: "14px",
            }}
          >
            Back to Login
          </button>
        </div>
      </FramerMotion.motion.div>
    </div>
  );
}
