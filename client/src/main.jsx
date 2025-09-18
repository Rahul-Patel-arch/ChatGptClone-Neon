import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
// Read client ID from env only; do not hardcode fallbacks to keep secrets out of code
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* Only initialize provider if a clientId is present via env */}
    <GoogleOAuthProvider clientId={googleClientId || ""}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);
