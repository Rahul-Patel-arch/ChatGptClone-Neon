import React, { useMemo, useState } from "react";
import { useNavigate, useLocation, useOutletContext } from "react-router-dom";
import "./Checkout.css";

export default function Checkout() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const outlet = useOutletContext?.() || {};
  const darkMode = outlet.darkMode || false;
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const price = params.get("price") || "599";
  const currency = params.get("currency") || "₹";

  const [isProcessing, setIsProcessing] = useState(false);
  const [card, setCard] = useState({ name: "", number: "", expiry: "", cvc: "" });

  const formatCardNumber = (v) =>
    v
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  const formatExpiry = (v) =>
    v
      .replace(/\D/g, "")
      .slice(0, 4)
      .replace(/^(\d{0,2})(\d{0,2}).*$/, (m, a, b) => (b ? `${a}/${b}` : a));
  const formatCVC = (v) => v.replace(/\D/g, "").slice(0, 4);
  const onChange = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (name === "number") v = formatCardNumber(v);
    if (name === "expiry") v = formatExpiry(v);
    if (name === "cvc") v = formatCVC(v);
    setCard((prev) => ({ ...prev, [name]: v }));
  };
  const valid = () => {
    const digits = card.number.replace(/\s/g, "");
    if (digits.length < 15) return false;
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) return false;
    if (!(card.cvc.length >= 3 && card.cvc.length <= 4)) return false;
    if (!card.name.trim()) return false;
    return true;
  };

  const pay = async () => {
    if (!valid()) return;
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 1600));
    try {
      const sessionRaw = localStorage.getItem("quantumchat_current_session");
      const session = sessionRaw ? JSON.parse(sessionRaw) : null;
      const email = session?.user?.email?.toLowerCase?.();
      if (email) {
        const plans = JSON.parse(localStorage.getItem("quantumchat_user_plans") || "{}");
        plans[email] = "pro";
        localStorage.setItem("quantumchat_user_plans", JSON.stringify(plans));
        // mirror on session for quick checks
        session.user.pro = true;
        localStorage.setItem("quantumchat_current_session", JSON.stringify(session));
      }
    } catch {
      /* noop */
    }
    window.dispatchEvent(new CustomEvent("qc:pro-upgraded"));
    navigate("/");
  };

  const fillTestCard = () => {
    setCard({
      name: outlet?.currentUser?.name || "Test User",
      number: "4242 4242 4242 4242",
      expiry: "12/34",
      cvc: "123",
    });
  };

  return (
    <div className="checkout-wrapper">
      <div className="checkout-container" style={{ position: "relative" }}>
        {/* Close button to return to home */}
        <button
          type="button"
          onClick={() => navigate("/")}
          aria-label="Close checkout"
          title="Close"
          className={`btn-close ${darkMode ? "btn-close-white" : ""}`}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 10,
            width: 28,
            height: 28,
            backgroundSize: "16px 16px",
            opacity: 0.9,
          }}
        />
        <div className="checkout-title">
          <h2 className="m-0">QuantumChat Pro</h2>
          <div className="checkout-price">
            {currency}
            {price} / month
          </div>
        </div>

        <div className="checkout-card">
          <div className="checkout-card-body">
            <form
              className="checkout-form"
              onSubmit={(e) => {
                e.preventDefault();
                pay();
              }}
            >
              <div className="mb-3">
                <label className="form-label">Cardholder Name</label>
                <input
                  name="name"
                  className="form-control"
                  placeholder="John Doe"
                  value={card.name}
                  onChange={onChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Card Number</label>
                <input
                  name="number"
                  inputMode="numeric"
                  className="form-control"
                  placeholder="1234 5678 9012 3456"
                  value={card.number}
                  onChange={onChange}
                  required
                />
              </div>
              <div className="row">
                <div className="col-12 col-md-6 mb-3">
                  <label className="form-label">Expiry (MM/YY)</label>
                  <input
                    name="expiry"
                    inputMode="numeric"
                    className="form-control"
                    placeholder="MM/YY"
                    value={card.expiry}
                    onChange={onChange}
                    required
                  />
                </div>
                <div className="col-12 col-md-6 mb-3">
                  <label className="form-label">CVC</label>
                  <input
                    name="cvc"
                    inputMode="numeric"
                    className="form-control"
                    placeholder="123"
                    value={card.cvc}
                    onChange={onChange}
                    required
                  />
                </div>
              </div>

              <div className="d-grid checkout-actions" style={{ gap: 8 }}>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={fillTestCard}
                  disabled={isProcessing}
                  title="Autofill test card details"
                >
                  Use Test Card
                </button>
                <button
                  type="submit"
                  className="btn checkout-submit btn-lg"
                  disabled={!valid() || isProcessing}
                >
                  {isProcessing ? "Processing…" : `Pay ${currency}${price}`}
                </button>
              </div>
              <div className="form-text" style={{ marginTop: 6, color: "var(--muted-text)" }}>
                Tip: For demo, use 4242 4242 4242 4242 • Exp 12/34 • CVC 123
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
