# 📚 BookBuddy

**Stop forgetting what you've learnt.**

BookBuddy is an AI-powered personal book library and reading companion. Add books you've read, get AI-generated summaries and key learnings, and chat with an AI assistant that knows your entire library.

---

## ✨ Features

- **Personal Book Library** — Search and add books via the Open Library API. Your library is saved to the cloud and accessible from any device.
- **AI-Generated Summaries** — Get concise summaries of each book, powered by AI.
- **Key Learnings** — Extract and review the most important lessons from every book.
- **Chat With Your Books** — Ask questions, compare ideas across books, and deepen your understanding with an AI assistant that has full context of your library.
- **Chat History** — Conversations are saved automatically with auto-generated titles. Pin important chats or archive old ones.
- **User Profiles** — Sign up, log in, upload an avatar, and manage your account.
- **Dark / Light Mode** — Toggle between themes to suit your preference.
- **Library Filtering** — Filter your library by title or author to quickly find what you need.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React, TypeScript, Vite |
| **Styling** | Tailwind CSS, shadcn/ui |
| **Routing** | React Router |
| **Data Fetching** | TanStack React Query |
| **Backend** | Lovable Cloud (database, auth, storage, edge functions) |
| **AI** | Lovable AI (Google Gemini) via edge functions |
| **Book Data** | Open Library API |

---

## 📁 Project Structure

```
src/
├── pages/           # Route-level page components (Index, Chat, BookDetail, Auth, etc.)
├── components/      # Reusable components (BookSearchInput, ChatSidebar, NavLink, etc.)
│   └── ui/          # shadcn/ui component library (button, dialog, card, etc.)
├── hooks/           # Custom React hooks (useAuth, useDebounce, etc.)
├── lib/             # Utility functions and API helpers (api.ts, openLibrary.ts)
├── integrations/    # Auto-generated backend client and types
└── assets/          # Images and static assets

supabase/
└── functions/       # Edge functions (chat, generate-book-summary, generate-chat-title)
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js & npm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Local Development

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm i

# Start the development server
npm run dev
```

---

## 📄 License

This project was built with [Lovable](https://lovable.dev).
