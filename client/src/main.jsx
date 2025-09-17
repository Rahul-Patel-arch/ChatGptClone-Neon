import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'

// Prefer environment config, fallback to embedded client id if not provided
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '154897483545-bn7qpad3h8n2bsmouhug6ibnvs4pjluo.apps.googleusercontent.com';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
