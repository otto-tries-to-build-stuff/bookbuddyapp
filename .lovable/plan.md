

## Redesign Book Search: Single Search Bar + Manual Entry

### Overview
Replace the current dialog with a two-mode "Add Book" experience:
1. **Search mode** (default): A single search bar using `q=` (general search across title, author, etc.) that returns up to 50 results with client-side relevance sorting
2. **Manual entry mode**: A simple title + author form for when the book can't be found

### User Flow

1. User clicks the "+" button, dialog opens showing one search bar
2. As they type, a scrollable dropdown shows up to 50 results (with covers, authors, years)
3. They click a result to select it, then confirm with "Add Book"
4. If the book isn't found, they click a "Can't find it? Add manually" link
5. This switches the dialog to show separate Title and Author fields
6. A "Back to search" link takes them back to search mode

### Technical Changes

**File: `src/lib/openLibrary.ts`**
- Change the API URL from `title=` to `q=` so the single search bar matches across all fields (title, author, subject)
- Increase `limit=30` to `limit=60` to fetch a larger pool
- Keep the existing relevance scoring (exact match, starts-with, word boundary)
- Increase the final slice from 20 to 50 results

**File: `src/components/BookSearchInput.tsx`**
- Increase dropdown max height from `max-h-60` to `max-h-80` to show more results at once in the scrollable area
- No other changes needed -- this component handles search display

**File: `src/pages/Index.tsx`**
- Add a `manualMode` state boolean (default `false`)
- When `manualMode` is false: show just the `BookSearchInput` component followed by the author field (read-only, auto-filled on selection) and the Add Book button
- Add a "Can't find it? Add manually" text button below the search input
- When `manualMode` is true: show separate Title and Author text inputs (the current manual fields) and a "Back to search" link
- Reset `manualMode` to false when the dialog closes

