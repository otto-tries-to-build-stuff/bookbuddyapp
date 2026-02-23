

## Improve Book Search Relevance

**Problem:** Searching for "Transformed" doesn't surface the right book because the API only fetches 8 results sorted by popularity/age, and newer or less popular titles get pushed out.

**Solution:** Fetch more results from the API and re-sort them by relevance on the client side, showing up to 20 results in the dropdown.

### Technical Details

**File: `src/lib/openLibrary.ts`**

1. Change `limit=8` to `limit=30` in the API URL (fetch a larger pool for sorting)
2. Add a client-side relevance scoring function after mapping results:
   - Score 0 (best): title matches the query exactly (case-insensitive)
   - Score 1: title starts with the query
   - Score 2: title contains the query as a standalone word
   - Score 3: everything else
3. Sort by score ascending, then slice to 20 results

**File: `src/components/BookSearchInput.tsx`**

No changes needed -- the dropdown already uses `max-h-60 overflow-y-auto`, so 20 results will be scrollable.

