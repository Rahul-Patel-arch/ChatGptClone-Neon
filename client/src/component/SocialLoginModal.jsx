import React, { useState } from "react";

export default function SocialLoginModal({ provider, darkMode, onClose, onSuccess }) {
  const [email, setEmail] = useState("");

  const providerConfig = {
    Google: { bg: "#fef4fc", domain: "gmail.com", icon: "G" },
    Microsoft: { bg: "#f4f2ff", domain: "microsoft.com", icon: "M" },
    Apple: { bg: "#fff7f3", domain: "icloud.com", icon: "" },
    Default: { bg: "#fffcf5", domain: "example.com", icon: "🔗" },
  };
  const cfg = providerConfig[provider] || providerConfig.Default;

  const handleContinue = () => {
    const userEmail = email.trim() || `user@${cfg.domain}`;
    const user = {
      id: Date.now(),
      email: userEmail,
      username: userEmail.split("@")[0] || `${provider}User`,
      provider,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      isActive: true,
      preferences: { theme: "system", language: "en", notifications: true },
    };
    onSuccess(user);
    onClose?.();
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1050, display: "grid", placeItems: "center" }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(2px)",
        }}
      />
      <div
        style={{
          width: "92%",
          maxWidth: 360,
          borderRadius: 12,
          background: darkMode ? "#111827" : "#ffffff",
          color: darkMode ? "#f9fafb" : "#111827",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          position: "relative",
          zIndex: 1,
          padding: 16,
        }}
      >
        <div className="d-flex justify-content-end pb-1">
          <button
            type="button"
            className={`btn-close ${darkMode ? "btn-close-white" : ""}`}
            onClick={onClose}
          />
        </div>
        <div className="px-2 py-1">
          {/* Header and logo removed */}
          <p className={`small ${darkMode ? "text-light" : "text-muted"} mb-2`} style={{ fontSize: 12 }}>
            Enter your email or continue with a demo account.
          </p>
          <input
            type="email"
            className={`form-control mb-2 ${darkMode ? "bg-dark-subtle text-white border-secondary" : ""}`}
            placeholder={`you@${cfg.domain}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="d-flex gap-2 justify-content-center">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleContinue}>
              Continue
            </button>
          </div>
          <div className="mt-2">
            <small className={`${darkMode ? "text-light" : "text-muted"}`} style={{ fontSize: 11 }}>
              Demo flow only. Replace with real {provider} OAuth in production.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
