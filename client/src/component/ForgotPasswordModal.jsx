import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X as CloseIcon, Mail } from 'lucide-react';
import emailjs from '@emailjs/browser';

export default function ForgotPasswordModal({ darkMode, onClose }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!email) { setError('Please enter your email address.'); return; }
    setIsLoading(true);

    const users = JSON.parse(localStorage.getItem('chatapp_users')) || [];
    const foundUser = users.find(u => u.email === email);

    // Always show generic message to avoid user enumeration
    const showGeneric = () => {
      setSuccess('If an account with that email exists, a password reset link has been sent.');
      setIsLoading(false);
    };

    if (!foundUser) {
      // simulate network delay
      setTimeout(showGeneric, 1200);
      return;
    }

    // Build reset token (demo-only) and store in localStorage
    const token = Math.random().toString(36).slice(2, 12);
    const resets = JSON.parse(localStorage.getItem('chatapp_password_resets') || '[]');
    resets.push({ email: foundUser.email, token, createdAt: new Date().toISOString() });
    localStorage.setItem('chatapp_password_resets', JSON.stringify(resets));

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_FORGOT_PASSWORD_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      console.warn('EmailJS not configured; skipping real email send.');
      setTimeout(showGeneric, 800);
      return;
    }

    const templateParams = { to_email: foundUser.email, username: foundUser.username || foundUser.email.split('@')[0], reset_token: token, reset_link: `${window.location.origin}?email=${encodeURIComponent(foundUser.email)}&reset_token=${token}` };

    emailjs.send(serviceId, templateId, templateParams, publicKey)
      .then(() => { showGeneric(); })
      .catch((err) => { console.error('EmailJS error', err); showGeneric(); });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }} transition={{ duration: 0.25 }} className={`modal-content-wrapper ${darkMode ? 'bg-dark text-light' : 'bg-white text-dark'}`} style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className={`modal-close-btn ${darkMode ? 'text-light' : 'text-dark'}`}><CloseIcon size={20} /></button>
        <div className="p-4 text-center">
          <Mail size={40} className="mb-2 text-primary" />
          <h5 className="fw-bold">Forgot Password?</h5>
          <p className="text-muted small mb-3">Enter your email and we'll send a link to reset your password.</p>
          {error && <div className="alert alert-danger small p-2 mb-2">{error}</div>}
          {success && <div className="alert alert-success small p-2 mb-2">{success}</div>}
          {!success && (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <input type="email" className={`form-control ${darkMode ? 'bg-dark-subtle text-white border-secondary' : ''}`} placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary w-100 py-2" disabled={isLoading} style={{ background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', border: 'none' }}>{isLoading ? <span className="spinner-border spinner-border-sm"></span> : 'Send Reset Link'}</button>
            </form>
          )}
          <button onClick={onClose} className="btn btn-link btn-sm mt-3">Back to Login</button>
        </div>
      </motion.div>
    </div>
  );
}
