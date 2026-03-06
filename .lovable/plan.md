

# Rename BookMind to BookBuddy + Update README

## Two things to do

### 1. Fix "BookMind" references (3 places)

- **`supabase/functions/chat/index.ts`** line 70 -- Change `"You are BookMind"` to `"You are BookBuddy"` in the AI system prompt
- **`src/pages/Index.tsx`** line 16 -- The import `bookmind-logo.png` stays as-is (it's just a filename, not user-facing), but if there's any visible "BookMind" text rendered from it, that would need updating. Since it's an image asset, the filename is fine.
- **`index.html`** -- Update the page title from "Lovable App" to "BookBuddy" and update the meta description/og tags

### 2. Rewrite README.md

Replace the boilerplate with a proper project README:

- **Header** -- "BookBuddy" with tagline "Stop forgetting what you've learnt"
- **Features** -- Personal book library, AI summaries & key learnings, AI chat assistant, library search/filter, user profiles with avatars, chat history (pin/archive/auto-title), dark/light mode
- **Tech stack** -- React, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, TanStack React Query, Lovable Cloud (backend, auth, storage, edge functions)
- **Project structure** -- Brief folder overview
- **Getting started** -- Local dev setup instructions (kept from existing README)

### Files changed
- `README.md` -- full rewrite
- `supabase/functions/chat/index.ts` -- one line (BookMind → BookBuddy)
- `index.html` -- title and meta tags

