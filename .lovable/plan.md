

## Visual Makeover - Modern Mobile-Friendly UX

### What's Changing

Inspired by the reference image, I'll restyle the app to feel more like a polished mobile reading app: clean whitespace, horizontal book list items with cover thumbnails, softer card styling, and a friendlier greeting-style header.

### Approach to Minimise Risk

I'll keep all existing logic, state management, and data flows completely untouched. The changes are purely CSS/layout adjustments within the same components -- no new routes, no API changes, no database changes.

**Pages affected:**
1. **Index.tsx** -- Header + book list layout
2. **BookDetail.tsx** -- Detail page polish
3. **index.css** -- Minor global tweaks

**Pages NOT touched:** Chat, API layer, edge functions, database.

### Detailed Changes

**1. Index page (Home / Library)**
- Replace the grid of vertical cards with a horizontal list layout (cover thumbnail on the left, title + author + summary snippet on the right) matching the reference style
- Simplify the header: smaller top bar with hamburger-style icon and a friendly greeting line ("What are you reading?")
- Add subtle rounded corners and soft shadows to list items
- Improve mobile padding and spacing
- Keep the Add Book dialog and delete functionality exactly as-is

**2. BookDetail page**
- Give the cover image more prominence with a larger, centered display and rounded corners with shadow
- Add more breathing room between sections
- Improve mobile padding so content doesn't feel cramped on small screens
- All existing sections (Summary, Key Takeaways, Chapters, My Notes) remain identical in functionality

**3. Global CSS (index.css)**
- Slightly soften the background warmth to match the reference's near-white tone
- Add a subtle transition for interactive elements

### What Stays the Same
- All data fetching, mutations, and React Query logic
- The Add Book dialog with autocomplete search
- The delete confirmation flow
- The Chat page (untouched)
- The notes editing feature
- All database tables and edge functions
- All routing

