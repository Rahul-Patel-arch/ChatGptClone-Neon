# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## QuantumChat Additions

### Chat Persistence
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

### Styling & Sidebar
The sidebar uses a unified scroll container so header, actions, navigation, chat list, archived section, and profile all scroll together. Archived chats are shown in a dedicated section when present.

