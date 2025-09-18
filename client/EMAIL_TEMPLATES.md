# Email Templates Configuration

This document describes the email template system used by QuantumChat for welcome, login, and password reset emails.

## Overview

The application uses EmailJS for sending emails with customizable templates. All email logic is centralized in `src/utils/emailTemplates.js`.

## Required Environment Variables

Add these to your `.env` file:

```env
# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key

# Template IDs (one for each email type)
VITE_EMAILJS_WELCOME_TEMPLATE_ID=template_welcome
VITE_EMAILJS_LOGIN_TEMPLATE_ID=template_login
VITE_EMAILJS_RESET_TEMPLATE_ID=template_reset

# Optional: Support email address displayed in templates
VITE_SUPPORT_EMAIL=support@yourapp.com
```

### Legacy Environment Variables (Fallback Support)

The system also supports older variable names for backward compatibility:

```env
# Legacy fallbacks (will be used if new variables are not set)
VITE_EMAILJS_TEMPLATE_ID=fallback_template
VITE_EMAILJS_FORGOT_PASSWORD_TEMPLATE_ID=fallback_reset_template
```

## Email Template Variables

All templates receive a common set of variables that you can use in your EmailJS templates:

### Core Variables

- `username` - User's display name
- `email` - User's email address
- `site_name` - Application name ("QuantumChat")
- `site_url` - Application base URL
- `support_email` - Support contact email

### Email-Specific Variables

#### Welcome Email (`VITE_EMAILJS_WELCOME_TEMPLATE_ID`)

- `event_type` - Always "welcome"
- `login_url` - Direct link to login page
- `reset_token` - Static value "WELCOME_NEW_USER" (legacy compatibility)
- `reset_link` - Application home URL

#### Login Email (`VITE_EMAILJS_LOGIN_TEMPLATE_ID`)

- `event_type` - Always "login"
- `login_url` - Direct link to login page
- `reset_token` - Static value "WELCOME_BACK" (legacy compatibility)
- `reset_link` - Application home URL

#### Password Reset Email (`VITE_EMAILJS_RESET_TEMPLATE_ID`)

- `event_type` - Always "reset"
- `reset_link` - Direct link to reset password page with token
- `expires_minutes` - Token expiration time (30)
- `reset_token` - The stateless reset token (for legacy templates)

## Template Examples

### Welcome Email Template

**Subject:** Welcome to QuantumChat, {{username}}!

**Body:**

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Welcome to {{site_name}}, {{username}}!</h2>
  <p>Thank you for joining {{site_name}}. Your account has been successfully created.</p>
  <p>You can start chatting by visiting: <a href="{{login_url}}">{{site_name}}</a></p>
  <p>If you have any questions, contact us at {{support_email}}</p>
  <hr />
  <small>This email was sent to {{email}}</small>
</div>
```

### Login Email Template

**Subject:** Login notification for {{username}}

**Body:**

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Login Detected</h2>
  <p>Hello {{username}},</p>
  <p>We detected a login to your {{site_name}} account at {{email}}.</p>
  <p>If this wasn't you, please contact us immediately at {{support_email}}</p>
  <p><a href="{{login_url}}">Go to {{site_name}}</a></p>
  <hr />
  <small>This email was sent to {{email}}</small>
</div>
```

### Password Reset Email Template

**Subject:** Reset your {{site_name}} password

**Body:**

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Password Reset Request</h2>
  <p>Hello {{username}},</p>
  <p>You requested a password reset for your {{site_name}} account.</p>
  <p>
    <strong
      ><a
        href="{{reset_link}}"
        style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;"
        >Reset Your Password</a
      ></strong
    >
  </p>
  <p>This link will expire in {{expires_minutes}} minutes.</p>
  <p>If you didn't request this reset, you can safely ignore this email.</p>
  <p>Questions? Contact us at {{support_email}}</p>
  <hr />
  <small>This email was sent to {{email}}</small>
</div>
```

## Migration Notes

### From Legacy Reset Tokens

If you have existing templates that use `reset_token` parameter, they will continue to work:

- **Legacy**: Link contained `?reset_token=abc123`
- **Current**: Link contains `?prt=stateless_token_string`

Both parameters are now included in reset emails for backward compatibility.

### Security Considerations

- The `reset_token` is now a cryptographically signed, stateless token
- Tokens expire after 30 minutes
- Tokens are single-use (tracked via localStorage)
- Frontend-generated tokens are suitable for demo/development but not production

## Debugging Email Issues

1. **Check environment variables**: Use `summarizeEmailConfig()` in browser console
2. **Check EmailJS dashboard**: Verify template IDs and service status
3. **Check browser console**: Look for email sending logs and errors
4. **Test templates**: Use EmailJS's template testing feature

## API Reference

### `sendTemplatedEmail(type, params)`

Sends an email using the configured template for the given type.

**Parameters:**

- `type` (string): 'welcome', 'login', or 'reset'
- `params` (object): Variables to inject into template

**Returns:** Promise with sending result

**Example:**

```javascript
import { sendTemplatedEmail, buildCommonParams } from "./utils/emailTemplates";

const params = buildCommonParams({ email: "user@example.com", username: "John" });
const result = await sendTemplatedEmail("welcome", params);
```

### `buildCommonParams({ email, username })`

Creates the standard parameter object with site metadata.

### `summarizeEmailConfig()`

Returns current configuration summary for debugging.
