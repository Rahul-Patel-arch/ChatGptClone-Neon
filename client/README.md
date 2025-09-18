# QuantumChat - AI Chat Application

A modern React-based chat application with AI integration, featuring secure authentication and email notifications.

Built with:

- React + Vite for fast development
- Framer Motion for smooth animations
- EmailJS for email notifications
- Local storage for data persistence

## Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env` and fill in your EmailJS credentials:

   ```env
   VITE_EMAILJS_SERVICE_ID=your_service_id
   VITE_EMAILJS_PUBLIC_KEY=your_public_key
   VITE_EMAILJS_WELCOME_TEMPLATE_ID=template_welcome
   VITE_EMAILJS_LOGIN_TEMPLATE_ID=template_login
   VITE_EMAILJS_RESET_TEMPLATE_ID=template_reset
   VITE_SUPPORT_EMAIL=support@yourapp.com
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

## Features
## Hooks Overview

This project centralizes state and cross-cutting behavior into small, documented hooks:

- useSession (`src/hooks/useSession.js`)
  - Purpose: Centralize auth/session lifecycle (restore, login, logout) and plan sync.
  - Exposes: `{ currentUser, loggedIn, isLoadingAuth, login, logout }`.
  - Behavior: Restores session from storage, listens for upgrade events, toggles `body.pro-mode`.

- useChats (`src/hooks/useChats.js`)
  - Purpose: Manage chats per-user with robust localStorage persistence.
  - Exposes: `{ chats, activeChatId, setChats, setActiveChatId, onNewChat, onSelectChat, onArchive, onRestoreChat, onPermanentlyDeleteChat, onRename, onDelete }`.
  - Behavior: Hydrates from namespaced keys, filters empty chats, persists chats and active chat id.

- useThemeMode (`src/hooks/useThemeMode.js`)
  - Purpose: Provide `themeMode` ('light' | 'dark' | 'system') and derived `darkMode`.
  - Exposes: `{ themeMode, setThemeMode, darkMode }`.
  - Behavior: Syncs with localStorage and media query, applies CSS variables.

- useResponsiveSidebar (`src/hooks/useResponsiveSidebar.js`)
  - Purpose: Encapsulate mobile/collapsed logic and computed sidebar width.
  - Exposes: `{ isMobile, sidebarCollapsed, toggleSidebar, sidebarWidth }`.

- useToast (`src/hooks/useToast.js`)
  - Purpose: Lightweight toast notifications with auto-hide.
  - Exposes: `{ toast, show, hide }`.

These hooks are used in `App.jsx`, `layout/MainLayout.jsx`, and `ChatApp.jsx` to keep components simple and predictable. See each file for inline comments describing usage and edge cases.


### 🔐 Secure Authentication

- Email/password registration and login
- Google OAuth integration
- Secure password reset via email
- Session persistence with automatic logout

### 📧 Email Notifications

- Welcome emails for new users
- Login notifications
- Password reset with secure stateless tokens
- Customizable EmailJS templates

### 💬 Chat Management

- Persistent chat history
- Archive/restore conversations
- Search functionality
- Auto-generated chat titles

### 🎨 Modern UI

- Dark/light theme toggle
- Responsive design
- Smooth animations
- Accessible components

## Password Reset Flow

The application implements a secure, stateless password reset system:

1. **Request Reset**: User enters email, receives reset link
2. **Secure Token**: Cryptographically signed, time-limited (30 min)
3. **Single Use**: Tokens can only be used once
4. **Cross-Browser**: Works across different browsers/devices
5. **Fallback**: Legacy token detection with upgrade prompts

For detailed configuration, see [EMAIL_TEMPLATES.md](./EMAIL_TEMPLATES.md).

## Data Persistence

### Chat Storage

Chats (their metadata: id, title, createdAt, archived flags) are persisted to `localStorage` under the key:

```
quantumchat_chats_v1
```

Behavior:

1. On app load, chats are loaded if the key exists (no seed defaults).
2. Clicking New Chat prepends a new chat object and immediately persists it.
3. Archive / restore / delete operations mutate the array and persist automatically.
4. The Search modal always reflects the current in-memory chats array (which mirrors storage).

Schema example:

```json
[
  {
    "id": "1726416275123",
    "title": "New Chat",
    "createdAt": "2025-09-15T10:04:35.123Z",
    "archived": false
  }
]
```

Notes / Future Improvements:

- Per-chat message history could be persisted separately (e.g., `quantumchat_messages_<chatId>`).
- Automatic title generation can overwrite the placeholder title and persist.
- A migration strategy can be implemented by bumping the key suffix (`_v2`, etc.).

## Data Persistence

### Chat Storage

Chats (their metadata: id, title, createdAt, archived flags) are persisted to `localStorage` under the key:

```
quantumchat_chats_v1
```

Behavior:

1. On app load, chats are loaded if the key exists (no seed defaults).
2. Clicking New Chat prepends a new chat object and immediately persists it.
3. Archive / restore / delete operations mutate the array and persist automatically.
4. The Search modal always reflects the current in-memory chats array (which mirrors storage).

Schema example:

```json
[
  {
    "id": "1726416275123",
    "title": "New Chat",
    "createdAt": "2025-09-15T10:04:35.123Z",
    "archived": false
  }
]
```

### User Authentication

- User accounts: `localStorage` key `chatapp_users`
- Session data: `localStorage` key `chatapp_session`
- Reset tokens: `localStorage` key `chatapp_used_stateless_tokens`

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AuthForm.jsx    # Authentication forms
│   ├── ChatArea.jsx    # Main chat interface
│   ├── sidebar/        # Sidebar components
│   └── ...
├── pages/              # Route-level components
├── services/           # External API integrations
├── styles/             # CSS modules and themes
└── utils/              # Helper functions and utilities
```

### Email Template Setup

1. **Create EmailJS account** at [emailjs.com](https://emailjs.com)
2. **Create email service** (Gmail, Outlook, etc.)
3. **Create three templates**: welcome, login, reset
4. **Copy template IDs** to your `.env` file
5. **Test templates** using EmailJS dashboard

For detailed template variables and examples, see [EMAIL_TEMPLATES.md](./EMAIL_TEMPLATES.md).

## Production Deployment

⚠️ **Security Note**: The current password reset implementation uses client-side token generation for demo purposes. For production use:

1. Move token generation to a secure backend
2. Implement server-side token validation
3. Use environment-specific secrets
4. Add rate limiting for password reset requests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational/demo purposes.

## Development Tooling & Scripts

We use Prettier and ESLint for a consistent code style and fast feedback.

- Format all files: `npm run format`
- Check formatting only: `npm run format:check`
- Lint all files: `npm run lint`
- Auto-fix lint issues where possible: `npm run lint:fix`

Notes:

- ESLint integrates eslint-config-prettier to avoid rule conflicts with Prettier.
- A root `.editorconfig` ensures consistent editor settings across contributors.

## Cleanup and Legacy Code

- Legacy, unused components are moved to `/_legacy` to keep the bundle lean while preserving history. For example:
  - `src/component/sidebar-monolithic.jsx` → `_legacy/components/sidebar-monolithic.jsx` (stub remains in place exporting `null`)
  - `src/component/ProUpgradeModal.jsx` is now a stub; the flow is replaced by the `/checkout` page
- If you need old implementations, retrieve them from Git history or the `_legacy` folder.
