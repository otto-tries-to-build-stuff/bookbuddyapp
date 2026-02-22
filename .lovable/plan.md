

# Improve Chapter Accuracy with Open Library Data

## Problem
The AI sometimes skips or misnames chapters when generating book summaries. In your example, "Nine Lies About Work" is missing Lie #4 entirely.

## Solution: Hybrid Approach
Use Open Library's real chapter data as the primary source, with AI as a fallback.

Open Library editions often include a `table_of_contents` field with actual chapter titles. When a user selects a book from search, we'll fetch this data and pass it to the AI so it only needs to write summaries for real chapters -- not guess at chapter names.

## How It Works

1. **Capture the edition key** -- When the user picks a book from search results, we'll also grab the Open Library edition key (e.g., `OL12345M`) that the search API provides.

2. **Fetch real chapters** -- Before calling the AI, we'll hit Open Library's Edition API (`/books/OL12345M.json`) to get the `table_of_contents` field.

3. **Pass real chapters to AI** -- If chapters are found, the AI prompt changes from "generate chapters" to "write a 2-3 sentence summary for each of these chapters" with the real titles provided. This prevents skipping or hallucinating chapter names.

4. **Fallback to AI** -- If Open Library doesn't have chapter data for that edition, the AI generates them as it does today (with a slightly improved prompt for better accuracy).

## Technical Details

### Files to modify

**`src/lib/openLibrary.ts`**
- Add `edition_key` to the search API fields and `OpenLibraryBook` interface
- Add a new `fetchEditionTOC(editionKey)` function that calls `/books/{key}.json` and extracts `table_of_contents`

**`src/components/BookSearchInput.tsx`**
- Pass the new `editionKey` field through when a book is selected

**`src/pages/Index.tsx`**
- Capture `editionKey` state from book selection
- Pass it to the `addBook` function

**`src/lib/api.ts`**
- Update `addBook()` to accept an optional `editionKey` parameter
- Pass it to the edge function

**`supabase/functions/generate-book-summary/index.ts`**
- Accept optional `editionKey` in the request body
- If provided, fetch the edition's table of contents from Open Library
- If TOC exists: modify the AI prompt to say "Here are the real chapters, write summaries for each"
- If no TOC: use improved fallback prompt with stronger instructions ("list ALL chapters, do not skip any")
- Use the more capable `gemini-2.5-pro` model for better accuracy in the fallback case

### Data flow

```text
User selects book
      |
      v
Search result includes edition_key
      |
      v
Edge function receives edition_key
      |
      v
Fetch /books/{edition_key}.json from Open Library
      |
      +-- TOC found --> AI prompt: "Summarize these chapters: [real titles]"
      |
      +-- No TOC ----> AI prompt: "Generate ALL chapters (improved prompt)"
      |
      v
Return accurate chapters + summaries
```

No database changes are needed -- the `chapters` column already stores the right shape of data.
