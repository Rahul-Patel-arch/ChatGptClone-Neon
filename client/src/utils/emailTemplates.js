// Centralized EmailJS template handling (client-side demo only)
// Provides a small abstraction so components don't each replicate fallback logic.

import emailjs from "@emailjs/browser";

// Environment variable helpers (Vite exposes import.meta.env)
const env = import.meta.env;

export function getEmailTemplateConfig() {
  return {
    serviceId: env.VITE_EMAILJS_SERVICE_ID || "",
    publicKey: env.VITE_EMAILJS_PUBLIC_KEY || "",
    // New explicit template IDs (preferred)
    welcomeTemplateId: env.VITE_EMAILJS_WELCOME_TEMPLATE_ID || "",
    loginTemplateId: env.VITE_EMAILJS_LOGIN_TEMPLATE_ID || "",
    resetTemplateId:
      env.VITE_EMAILJS_RESET_TEMPLATE_ID || env.VITE_EMAILJS_FORGOT_PASSWORD_TEMPLATE_ID || "",
    // Backward compatibility (legacy single template id)
    legacyGeneralTemplateId: env.VITE_EMAILJS_TEMPLATE_ID || "",
  };
}

export function summarizeEmailConfig() {
  const cfg = getEmailTemplateConfig();
  return Object.fromEntries(Object.entries(cfg).map(([k, v]) => [k, v ? "SET" : "MISSING"]));
}

/**
 * Sends an email with robust logging and timing. Returns { ok, status?, error? }.
 * type: 'welcome' | 'login' | 'reset'
 */
export async function sendTemplatedEmail(type, params) {
  const cfg = getEmailTemplateConfig();
  if (!cfg.serviceId || !cfg.publicKey) {
    console.warn("[EmailTemplates] Missing service/public key; skipping email send for", type);
    return { ok: false, skipped: true, reason: "config" };
  }
  let templateId = "";
  if (type === "welcome")
    templateId = cfg.welcomeTemplateId || cfg.legacyGeneralTemplateId || cfg.resetTemplateId;
  else if (type === "login") templateId = cfg.loginTemplateId || cfg.legacyGeneralTemplateId;
  else if (type === "reset") templateId = cfg.resetTemplateId || cfg.legacyGeneralTemplateId;

  if (!templateId) {
    console.warn("[EmailTemplates] No template id resolved for type", type);
    return { ok: false, skipped: true, reason: "no_template" };
  }

  const start = performance.now();
  try {
    const res = await emailjs.send(cfg.serviceId, templateId, params, cfg.publicKey);
    const ms = Math.round(performance.now() - start);
    console.info(`[EmailTemplates] ${type} email sent`, {
      status: res.status,
      timeMs: ms,
      templateId,
    });
    return { ok: true, status: res.status, templateId, timeMs: ms };
  } catch (err) {
    const ms = Math.round(performance.now() - start);
    console.error(`[EmailTemplates] ${type} email failed`, { templateId, timeMs: ms, error: err });
    return { ok: false, error: err, templateId, timeMs: ms };
  }
}

// Helper to build consistent base params
export function buildCommonParams({ email, username }) {
  return {
    email, // if new templates use {{email}}
    to_email: email, // backward compat if template uses {{to_email}}
    username,
    name: username,
    site_name: "QuantumChat",
    login_url: window.location.origin + "/login",
    app_origin: window.location.origin,
    support_email: import.meta.env.VITE_SUPPORT_EMAIL || "support@quantumchat.local",
  };
}
