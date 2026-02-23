

## Make Key Lessons Count Dynamic

**Problem:** The prompt currently says "5-7 key lessons," which causes the model to consistently output exactly 7. This feels formulaic regardless of the book.

**Solution:** Update the system prompt to let the model decide the appropriate number of lessons based on the book's content.

### Changes

**File: `supabase/functions/generate-book-summary/index.ts`** (line 19)
- Change `"5-7 key lessons from the book."` to something like `"The most important key lessons from the book (as many as appropriate based on the book's content and depth)."`
- This removes the fixed range and lets the model use its judgment

This is a single line change in the prompt. The edge function will be redeployed automatically.

**Note:** Existing books will keep their current lessons. You'd need to delete and re-add a book (or use a future "regenerate" feature) to see the new dynamic count.

