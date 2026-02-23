

## Remove Markdown Formatting from Book Summaries

**Problem:** The AI model wraps book titles in asterisks (e.g., `*Atomic Habits*`) within the summary text. Since the summary is rendered as plain text, the asterisks show up literally.

**Solution:** Add an instruction to the system prompt telling the model not to use any markdown formatting in its output. This is the cleanest fix since the summary is displayed as plain text.

### Changes

**File: `supabase/functions/generate-book-summary/index.ts`**
- Add "Do not use any markdown formatting (no asterisks, bold, italics, etc.) in your response." to the system prompt

This is a one-line addition to the prompt. The edge function will be redeployed automatically.

**Note:** Existing book summaries that already contain asterisks will remain unchanged. You would need to delete and re-add those books to get clean summaries.

