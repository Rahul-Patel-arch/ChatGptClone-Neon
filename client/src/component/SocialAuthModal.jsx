import React, { useState } from "react";

export default function SocialAuthModal({ provider, darkMode, onClose, onSuccess }) {
  const [email, setEmail] = useState("");

  // ✅ Correct provider configs
  const providerConfig = {
    google: {
      name: "Google",
      color: "#000",
      lightColor: "#fff",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 33.9 29.3 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l5.7-5.7C34.6 5.6 29.6 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.5-.4-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16.1 18.9 13 24 13c3.1 0 5.9 1.1 8.1 2.9l5.7-5.7C34.6 5.6 29.6 3 24 3 16.5 3 10.1 7.1 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 43c5.2 0 10.1-1.9 13.8-5.1l-6.4-5.4C29.2 34.9 26.7 36 24 36c-5.3 0-9.7-3.1-11.6-7.6l-6.6 5.1C10.1 40.9 16.5 43 24 43z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.3 3-3.7 5.3-6.7 6.6l.1.1 6.4 5.4C37.1 37.2 40 30.6 40 24c0-1.3-.1-2.5-.4-3.5z"/>
        </svg>
      )
    },
    microsoft: {
      name: "Microsoft",
      color: "#000",
      lightColor: "#fff",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">
          <path fill="#f25022" d="M1 1h10v10H1z"/>
          <path fill="#00a4ef" d="M13 1h10v10H13z"/>
          <path fill="#7fba00" d="M1 13h10v10H1z"/>
          <path fill="#ffb900" d="M13 13h10v10H13z"/>
        </svg>
      )
    },
    apple: {
      name: "Apple",
      color: "#fff",
      lightColor: "#000",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">
          <path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
      )
    }
  };

  const cfg = providerConfig[provider?.toLowerCase()] || providerConfig.google;

  const handleContinue = () => {
    const userEmail = email.trim() || `user@${cfg.name.toLowerCase()}.com`;
    const user = {
      id: Date.now(),
      email: userEmail,
      username: userEmail.split("@")[0] || `${cfg.name}User`,
      provider: cfg.name,
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
        {/* Close button only (header and logo removed) */}
        <button
          type="button"
          className={`btn-close ${darkMode ? "btn-close-white" : ""}`}
          aria-label="Close"
          onClick={onClose}
          style={{ position: "absolute", top: 8, right: 8 }}
        />

        {/* Body */}
        <div>
          <label htmlFor="email" style={{ fontSize: 13, fontWeight: 500 }}>
            Email address
          </label>
          <input
            id="email"
            type="email"
            className={`form-control mb-3 ${darkMode ? "bg-dark-subtle text-white border-secondary" : ""}`}
            placeholder={`you@${cfg.name.toLowerCase()}.com`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            className="btn w-100"
            style={{
              backgroundColor: cfg.lightColor,
              color: cfg.color,
              fontWeight: 600,
            }}
            onClick={handleContinue}
          >
            Sign in with {cfg.name}
          </button>
        </div>
      </div>
    </div>
  );
}
