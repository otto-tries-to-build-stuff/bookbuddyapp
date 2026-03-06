

# Library Search/Filter

## How it works

A search input appears at the top of the book list on the home screen. As the user types, books are filtered instantly (client-side) by matching the query against both title and author (case-insensitive). No API calls — it filters the already-fetched `books` array.

## UX

- The search bar only appears when the library has at least 1 book (no point showing it on an empty library)
- Compact input with a `Search` icon, placed between the heading and the book grid
- Filtering is instant as the user types — no submit button needed
- The subtitle updates contextually: "3 of 12 books" when filtering, "12 books" when not
- If no books match, a small inline empty state says "No books match your search" instead of the full empty-library state
- Clearing the input (or the × button) restores the full list

## Changes

**`src/pages/Index.tsx`** only:
1. Add `searchQuery` state
2. Derive `filteredBooks` from `books` using a case-insensitive match on `title` and `author`
3. Add a search `Input` with `Search` icon between the heading and grid (conditionally rendered when `books.length > 0`)
4. Render `filteredBooks` instead of `books` in the grid
5. Update the subtitle to show filtered count vs total when a search is active
6. Add a "no matches" state distinct from the "empty library" state

No other files need changes — this is entirely contained in the Index page.

