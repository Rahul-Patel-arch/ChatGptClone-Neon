import { useState } from "react";

/**
 * useToast
 * Minimal toast state utility to display transient messages.
 */
export default function useToast(initial = { show: false, message: "" }) {
  const [toast, setToast] = useState(initial);
  const show = (message, ms = 3000) => {
    setToast({ show: true, message });
    window.clearTimeout(show._t);
    show._t = window.setTimeout(() => setToast({ show: false, message: "" }), ms);
  };
  const hide = () => setToast({ show: false, message: "" });
  return { toast, show, hide };
}
