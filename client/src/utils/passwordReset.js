// Password reset token utility (stateless, client-side demo only)
// Uses cryptographic signatures with localStorage for single-use enforcement

const PASSWORD_RESET_TTL_MINUTES = 30; // token expiry window
export { PASSWORD_RESET_TTL_MINUTES };

// ---------------- Stateless Token (Demo) -----------------
// Insecure (secret is client-exposed) but works across browsers for demo.
// Format (base64url): version.timestamp.emailHash.random.signature
// signature = SHA-256(version|timestamp|emailHash|random|SECRET).slice(0,32)

const SECRET = "DEMO_RESET_SECRET_v1"; // DO NOT use in production
const VERSION = "v1";

function toBase64Url(str) {
  return btoa(str).replace(/=+/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function fromBase64Url(str) {
  try {
    const pad = str.length % 4 === 2 ? "==" : str.length % 4 === 3 ? "=" : "";
    return atob(str.replace(/-/g, "+").replace(/_/g, "/") + pad);
  } catch {
    return null;
  }
}

async function sha256Hex(input) {
  const enc = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createStatelessResetToken(email) {
  const ts = Date.now().toString();
  const emailHash = (await sha256Hex(email + "|" + SECRET)).slice(0, 24);
  const random = Math.random().toString(36).slice(2, 14);
  const base = [VERSION, ts, emailHash, random].join("|");
  const sig = (await sha256Hex(base + "|" + SECRET)).slice(0, 32);
  const packed = toBase64Url(base) + "." + sig;
  return packed;
}

export async function validateStatelessResetToken(email, packedToken) {
  if (!packedToken || !email) return { valid: false, reason: "missing" };
  const parts = packedToken.split(".");
  if (parts.length !== 2) return { valid: false, reason: "format" };
  const [encoded, sig] = parts;
  const decoded = fromBase64Url(encoded);
  if (!decoded) return { valid: false, reason: "decode" };
  const [ver, ts, emailHash, random] = decoded.split("|");
  if (!ver || !ts || !emailHash || !random) return { valid: false, reason: "parts" };
  if (ver !== VERSION) return { valid: false, reason: "version" };
  const expectedEmailHash = (await sha256Hex(email + "|" + SECRET)).slice(0, 24);
  if (expectedEmailHash !== emailHash) return { valid: false, reason: "email_mismatch" };
  const base = [ver, ts, emailHash, random].join("|");
  const expectedSig = (await sha256Hex(base + "|" + SECRET)).slice(0, 32);
  if (expectedSig !== sig) return { valid: false, reason: "signature" };
  const age = Date.now() - Number(ts);
  if (isNaN(age) || age < 0) return { valid: false, reason: "timestamp" };
  if (age > PASSWORD_RESET_TTL_MINUTES * 60 * 1000) return { valid: false, reason: "expired" };
  // Basic single-use mitigation (local only)
  try {
    const usedRaw = localStorage.getItem("chatapp_used_stateless_tokens");
    const used = usedRaw ? JSON.parse(usedRaw) : [];
    if (used.includes(sig)) return { valid: false, reason: "consumed" };
  } catch (err) {
    console.warn("Failed to check used tokens:", err);
  }
  return { valid: true, meta: { issuedAt: Number(ts), sig } };
}

export function consumeStatelessTokenSignature(sig) {
  if (!sig) return;
  try {
    const usedRaw = localStorage.getItem("chatapp_used_stateless_tokens");
    const used = usedRaw ? JSON.parse(usedRaw) : [];
    if (!used.includes(sig)) {
      used.push(sig);
      localStorage.setItem("chatapp_used_stateless_tokens", JSON.stringify(used.slice(-200)));
    }
  } catch (err) {
    console.warn("Failed to store used token signature:", err);
  }
}
