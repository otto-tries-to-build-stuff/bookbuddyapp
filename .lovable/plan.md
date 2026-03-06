

Both pages currently use a single-column `max-w-lg` layout that looks the same on mobile and desktop. Here's what I'd suggest:

## Profile Page

**Desktop (md+): Two-column layout**
- **Left column**: Avatar, name, and email — displayed as a sticky sidebar/card
- **Right column**: Settings sections (name edit, password change, appearance, sign out)
- Widen from `max-w-lg` to `max-w-3xl`

**Mobile**: Keep the current single-column stacked layout as-is

## About Page

**Desktop (md+): Two-column layout**
- **Left column**: Hero section (icon, title, description) — sticky so it stays visible while scrolling
- **Right column**: Features, Getting Started, and FAQ sections side by side or stacked
- Alternatively, display Features as a **grid of cards** (2 columns) instead of an accordion on desktop, since there's more space
- Widen from `max-w-lg` to `max-w-3xl`

**Mobile**: Keep the current compact accordion layout

## Technical approach
- Use Tailwind responsive classes (`md:grid-cols-2`, `md:sticky`, etc.)
- No new components needed — just restructuring the existing JSX with responsive wrappers
- Both pages keep their current mobile design untouched

