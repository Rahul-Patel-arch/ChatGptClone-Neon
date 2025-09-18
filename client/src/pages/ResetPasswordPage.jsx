import React, { useEffect, useState } from "react";
import ResetPasswordModal from "../component/ResetPasswordModal";
import { createStatelessResetToken, PASSWORD_RESET_TTL_MINUTES } from "../utils/passwordReset";
import emailjs from "@emailjs/browser";

// A standalone page that only shows the reset password experience.
// It reads email & prt (stateless token) from the URL and passes them to the existing modal logic.
// After success it redirects back to /login where a success banner is shown (sessionStorage flag already set in modal).
export default function ResetPasswordPage({ darkMode }) {
  const [params, setParams] = useState({ email: "", prt: "", legacy: false });
  const [show, setShow] = useState(true);
  const [legacyNotice, setLegacyNotice] = useState("");

  useEffect(() => {
    const url = new URL(window.location.href);
    const email = url.searchParams.get("email") || "";
    const prt = url.searchParams.get("prt") || "";
    const legacy = url.searchParams.get("legacy") === "1";
    setParams({ email, prt, legacy });
    if (legacy && !prt) {
      setLegacyNotice(
        "This password reset link format is outdated. Please request a new reset link to continue."
      );
    }
  }, []);

  const handleClose = () => {
    setShow(false);
    // Navigate back to login without params
    const url = new URL(window.location.origin + "/login");
    window.location.replace(url.toString());
  };

  const handleSuccess = () => {
    // The modal already sets the sessionStorage flag; just redirect.
    handleClose();
  };

  const [resendState, setResendState] = useState({
    sending: false,
    link: "",
    copied: false,
    sent: false,
    error: "",
  });

  const handleResend = async () => {
    if (!params.email) return;
    setResendState((s) => ({ ...s, sending: true, error: "", copied: false }));
    try {
      const token = await createStatelessResetToken(params.email);
      const link = `${window.location.origin}/reset-password?email=${encodeURIComponent(params.email)}&prt=${encodeURIComponent(token)}`;
      // Attempt email send if configured
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_FORGOT_PASSWORD_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
      if (serviceId && templateId && publicKey) {
        const username = params.email.split("@")[0];
        await emailjs.send(
          serviceId,
          templateId,
          { to_email: params.email, username, reset_link: link, stateless_token: token },
          publicKey
        );
      } else {
        console.warn("EmailJS not configured; presenting link locally");
      }
      setResendState((s) => ({ ...s, sending: false, link, sent: true }));
    } catch (e) {
      console.error("Resend failed", e);
      setResendState((s) => ({ ...s, sending: false, error: "Failed to generate new link." }));
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resendState.link);
      setResendState((s) => ({ ...s, copied: true }));
      setTimeout(() => setResendState((s) => ({ ...s, copied: false })), 2500);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    }
  };

  if (params.legacy && !params.prt) {
    return (
      <div
        className={`d-flex flex-column gap-4 align-items-center justify-content-center text-center px-3 ${darkMode ? "bg-dark text-light" : "bg-light"} `}
        style={{ minHeight: "100vh" }}
      >
        <div
          className="shadow rounded-3 p-4 w-100"
          style={{ maxWidth: 520, background: darkMode ? "#222" : "#fff" }}
        >
          <h3 className="mb-2">Password Reset Link Expired</h3>
          <p className="small text-muted mb-3">{legacyNotice}</p>
          <p className="small mb-4">
            Click the button below and we'll generate a fresh secure link (valid for{" "}
            {PASSWORD_RESET_TTL_MINUTES} minutes).
          </p>
          {resendState.error && (
            <div className="alert alert-danger py-2 small">{resendState.error}</div>
          )}
          {!resendState.sent && (
            <button
              className="btn btn-primary w-100 mb-3"
              disabled={resendState.sending}
              onClick={handleResend}
            >
              {resendState.sending ? "Generating…" : "Send New Reset Link"}
            </button>
          )}
          {resendState.sent && (
            <div className="text-start small">
              <div className="alert alert-success py-2 small">
                A new link was generated
                {import.meta.env.VITE_EMAILJS_SERVICE_ID ? " and emailed to you." : "."}
              </div>
              <label className="form-label mb-1">Direct link:</label>
              <div className="input-group mb-2">
                <input
                  readOnly
                  value={resendState.link}
                  className={`form-control form-control-sm ${darkMode ? "bg-dark-subtle text-white border-secondary" : ""}`}
                />
                <button className="btn btn-outline-secondary btn-sm" onClick={handleCopy}>
                  {resendState.copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <button
                className="btn btn-success w-100 btn-sm"
                onClick={() => window.location.replace(resendState.link)}
              >
                Open Link Now
              </button>
            </div>
          )}
          <button
            className="btn btn-link btn-sm mt-3"
            onClick={() => window.location.replace("/login")}
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`d-flex align-items-center justify-content-center ${darkMode ? "bg-dark text-light" : "bg-light"} `}
      style={{ minHeight: "100vh" }}
    >
      {show && (
        <ResetPasswordModal
          darkMode={darkMode}
          email={params.email}
          token={params.prt}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
