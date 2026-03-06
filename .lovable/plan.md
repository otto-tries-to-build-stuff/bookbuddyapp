

# Plan: Add Learning Comments to All Code Files

## Will this cause any issues?

**No performance impact whatsoever.** Comments are completely stripped out during the build process (by Vite and the TypeScript compiler). The final JavaScript that runs in the user's browser will be identical -- comments only exist in the source code for your benefit.

The only minor consideration is that source files become longer to scroll through, but that's a worthwhile trade-off for understanding.

## What will be commented

I'll add clear, beginner-friendly comments to every custom file in the project (not the auto-generated UI component library files in `src/components/ui/`, since those are standard library code). Here's the scope:

### Core app files (4 files)
- **`src/main.tsx`** -- App entry point
- **`src/App.tsx`** -- Route definitions and global providers
- **`src/hooks/useAuth.tsx`** -- Authentication logic
- **`src/lib/api.ts`** -- All database and API calls

### Page components (8 files)
- **`src/pages/Index.tsx`** -- Home/library screen
- **`src/pages/BookDetail.tsx`** -- Individual book view
- **`src/pages/Chat.tsx`** -- AI chat interface
- **`src/pages/Profile.tsx`** -- User profile & settings
- **`src/pages/Auth.tsx`** -- Sign in / sign up
- **`src/pages/ResetPassword.tsx`** -- Password reset
- **`src/pages/About.tsx`** -- About page
- **`src/pages/NotFound.tsx`** -- 404 page

### Custom components (4 files)
- **`src/components/ProtectedRoute.tsx`** -- Auth guard
- **`src/components/BookSearchInput.tsx`** -- Book search autocomplete
- **`src/components/ChatSidebar.tsx`** -- Chat history sidebar
- **`src/components/NavLink.tsx`** -- Navigation link wrapper

### Utility/helper files (3 files)
- **`src/lib/openLibrary.ts`** -- Open Library API integration
- **`src/lib/utils.ts`** -- Tailwind class merging utility
- **`src/hooks/use-debounce.ts`** -- Debounce hook

### Backend functions (3 files)
- **`supabase/functions/chat/index.ts`** -- AI chat endpoint
- **`supabase/functions/generate-book-summary/index.ts`** -- Book summary generation
- **`supabase/functions/generate-chat-title/index.ts`** -- Auto chat title generation

## Comment style

Each file will get:
1. A **file-level comment** at the top explaining what the file does and why it exists
2. **Inline comments** on key sections explaining concepts like: what React hooks do, how data flows, what API calls accomplish, why certain patterns are used (e.g. mutations, queries, state)

Comments will use plain English, avoiding jargon where possible, and will explain *why* not just *what*.

## Total: ~22 files to comment

