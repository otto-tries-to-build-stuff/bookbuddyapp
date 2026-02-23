

## Fix "5-7 Key Lessons" Reference in Tool Schema

**Problem:** While the system prompt was updated to allow a dynamic number of lessons, the tool calling schema still contains `"description": "5-7 key lessons from the book"` on line 56. The model treats the tool schema as a strong constraint, so it continues producing exactly 7 lessons.

**Solution:** Update the `description` field of the `key_learnings` property in the tool schema to match the updated prompt.

### Changes

**File: `supabase/functions/generate-book-summary/index.ts`** (line 56)
- Change: `"5-7 key lessons from the book"`
- To: `"The most important key lessons from the book, as many as appropriate"`

This is a single string change. The edge function will be redeployed automatically.

**Note:** Existing books will keep their current 7 lessons. You would need to delete and re-add a book to see the dynamic count in action.
