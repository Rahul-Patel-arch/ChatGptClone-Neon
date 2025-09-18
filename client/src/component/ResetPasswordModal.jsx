import React, { useState } from "react";
import * as FramerMotion from "framer-motion";
import { X } from "lucide-react";
import {
  validateStatelessResetToken,
  consumeStatelessTokenSignature,
} from "../utils/passwordReset";

export default function ResetPasswordModal({ darkMode, email, token, onClose, onSuccess }) {
  // token prop unused now (kept for interface compatibility)
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [status, setStatus] = useState({ checking: true, valid: false, reason: "init" });
  const [statelessMeta, setStatelessMeta] = useState(null);
  const [_softMode] = useState(false); // legacy removal
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      // Stateless token (?prt=)
      try {
        const url = new URL(window.location.href);
        const prt = url.searchParams.get("prt");
        console.info(
          "[ResetPasswordModal] Debug query:",
          window.location.search,
          "prt present?",
          !!prt
        );
        if (prt) {
          const res = await validateStatelessResetToken(email, prt);
          if (!mounted) return;
          if (res.valid) {
            setStatus({ checking: false, valid: true, reason: "ok" });
            setStatelessMeta(res.meta);
            console.info("[ResetPasswordModal] Stateless token valid", {
              email,
              sig: res.meta.sig.slice(0, 8) + "...",
            });
            return;
          } else {
            console.warn("[ResetPasswordModal] Stateless token invalid", { reason: res.reason });
          }
        }
        // Fallback to legacy token prop
        setStatus({ checking: false, valid: false, reason: "missing" });
      } catch (e) {
        if (mounted) setStatus({ checking: false, valid: false, reason: "error" });
        console.error("Reset validation error", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [email, token]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const closeAndCleanup = () => {
    if (onClose) onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!status.valid) {
      setError("Reset link is not valid.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    // optional stronger rules
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNum = /\d/.test(password);
    if (!(hasUpper && hasLower && hasNum)) {
      setError("Include upper, lower case letters and a number.");
      return;
    }
    setIsLoading(true);
    const users = JSON.parse(localStorage.getItem("chatapp_users")) || [];
    const idx = users.findIndex((u) => u.email === email);
    if (idx === -1) {
      setError("User not found.");
      setIsLoading(false);
      return;
    }
    users[idx] = { ...users[idx], password };
    localStorage.setItem("chatapp_users", JSON.stringify(users));
    if (status.valid && statelessMeta?.sig) consumeStatelessTokenSignature(statelessMeta.sig);
    setTimeout(() => {
      setIsLoading(false);
      setSuccess("Password updated successfully. You can now log in.");
      setStatus({ valid: false, reason: "consumed" });
      // Persist a short-lived flag so login screen can show a message even if state resets
      try {
        sessionStorage.setItem("reset_password_success", "1");
      } catch (error) {
        console.error("Error setting session storage:", error);
      }
      setTimeout(() => {
        if (onSuccess) onSuccess();
        closeAndCleanup();
      }, 1200);
    }, 600);
  };

  let invalidReason = null;
  if (!status.checking && !status.valid) {
    const map = {
      expired: "This reset link has expired.",
      consumed: "This reset link was already used.",
      signature: "Signature check failed (token altered).",
      email_mismatch: "Token does not match this email.",
      format: "Token format invalid.",
      parts: "Token parts missing.",
      decode: "Could not decode token.",
      version: "Token version unsupported.",
      timestamp: "Token timestamp invalid.",
      not_found: "No matching token found.",
      missing: "Token missing.",
      error: "Unexpected validation error.",
    };
    const friendly = map[status.reason] || "This reset link is invalid.";
    invalidReason = friendly + ` (code: ${status.reason})`;
  }

  // Soft fallback: if token not found but user likely opened link in new browser that lost localStorage token
  // Demo ONLY: Allows proceeding after user clicks a confirm button. DO NOT use in production.
  // soft fallback removed in stateless-only mode

  return (
    <div
      className="modal-overlay"
      onClick={closeAndCleanup}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        backgroundColor: "rgba(2,6,23,0.65)",
      }}
    >
      <FramerMotion.motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        className={`modal-content-wrapper ${darkMode ? "bg-dark text-light" : "bg-white text-dark"}`}
        style={{
          maxWidth: "420px",
          width: "90%",
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <button
          className={`modal-close-btn ${darkMode ? "text-light" : "text-dark"}`}
          onClick={closeAndCleanup}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            zIndex: 1,
          }}
        >
          <X size={20} />
        </button>
        <div style={{ padding: "24px" }}>
          <h5
            style={{
              fontWeight: "bold",
              margin: "0 0 8px 0",
              fontSize: "18px",
            }}
          >
            Reset Your Password
          </h5>
          <p
            style={{
              fontSize: "14px",
              color: darkMode ? "#999" : "#666",
              margin: "0 0 20px 0",
              lineHeight: "1.4",
            }}
          >
            {status.checking
              ? "Validating link…"
              : status.valid
                ? `Setting a new password for ${email}`
                : "Unable to proceed"}
          </p>
          {invalidReason && !status.checking && (
            <div
              style={{
                backgroundColor: darkMode ? "#2d1b1b" : "#f8d7da",
                color: darkMode ? "#f5c6cb" : "#721c24",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "14px",
                margin: "0 0 16px 0",
              }}
            >
              {invalidReason}
            </div>
          )}
          {error && (
            <div
              style={{
                backgroundColor: darkMode ? "#2d1b1b" : "#f8d7da",
                color: darkMode ? "#f5c6cb" : "#721c24",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "14px",
                margin: "0 0 16px 0",
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              style={{
                backgroundColor: darkMode ? "#1b2d1b" : "#d4edda",
                color: darkMode ? "#c3e6cb" : "#155724",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "14px",
                margin: "0 0 16px 0",
              }}
            >
              {success}
            </div>
          )}
          {!status.checking && status.valid && !success && (
            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <input
                type={showPwd ? "text" : "password"}
                className={`form-control ${darkMode ? "bg-dark-subtle text-white border-secondary" : ""}`}
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                style={{
                  height: "40px",
                  fontSize: "14px",
                  padding: "8px 12px",
                  margin: "0",
                }}
              />
              <input
                type={showPwd ? "text" : "password"}
                className={`form-control ${darkMode ? "bg-dark-subtle text-white border-secondary" : ""}`}
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
                style={{
                  height: "40px",
                  fontSize: "14px",
                  padding: "8px 12px",
                  margin: "0",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "13px",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showPwd}
                    onChange={(e) => setShowPwd(e.target.checked)}
                    style={{ margin: "0" }}
                  />
                  Show passwords
                </label>
                <span style={{ color: darkMode ? "#999" : "#666" }}>
                  Min 6 chars, include upper, lower & number
                </span>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
                style={{
                  height: "40px",
                  fontSize: "14px",
                  fontWeight: "500",
                  margin: "0",
                }}
              >
                {isLoading ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}
          {!status.valid && !success && (
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <button
                className="btn btn-outline-secondary"
                onClick={closeAndCleanup}
                style={{
                  height: "36px",
                  fontSize: "14px",
                  padding: "8px 16px",
                }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </FramerMotion.motion.div>
    </div>
  );
}
