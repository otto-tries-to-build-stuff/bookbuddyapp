
## Plan: Editable Book Summary with Regenerate and AI Disclaimer

### What will change

**1. Regenerate Summary Button**
- Add a "Regenerate" button (with a refresh icon) near the Summary heading
- Clicking it will call the existing `generate-book-summary` edge function with the book's title and author, then update the database with the new summary and key lessons
- A confirmation dialog will warn that this replaces the current summary
- Shows a loading spinner while regenerating

**2. Editable Summary and Key Lessons**
- **Summary section**: Add an "Edit" button next to the heading (same pattern as the existing "My Notes" section). Clicking it shows the summary in a textarea; save/cancel buttons appear below
- **Key Lessons section**: Add an "Edit" button next to the heading. In edit mode, each lesson's title becomes an input field and detail becomes a textarea. Users can also delete individual lessons or add new ones
- Both save to the database via new API functions (`updateBookSummary` and `updateBookKeyLearnings`)

**3. AI Disclaimer Info Box**
- Add an info alert box (using the existing Alert component with an `Info` icon) just above the Summary section
- Message: "AI-generated summaries may sometimes contain inaccuracies. You can regenerate the summary or edit any section manually."
- Styled subtly so it doesn't dominate the page

---

### Technical Details

**New API functions in `src/lib/api.ts`:**
- `updateBookSummary(id: string, summary: string)` -- updates the `summary` column
- `updateBookKeyLearnings(id: string, keyLearnings: KeyLesson[])` -- updates the `key_learnings` column
- `regenerateBookSummary(id: string, title: string, author: string)` -- calls the edge function and updates both `summary` and `key_learnings` in the database

**Changes to `src/pages/BookDetail.tsx`:**
- Add state for editing summary (`editingSummary`, `editingSummaryText`)
- Add state for editing key lessons (`editingLessons`, `editingLessonsData`)
- Add `regenerateMutation` using `useMutation` that calls `regenerateBookSummary`
- Add `summaryMutation` and `lessonsMutation` for saving edits
- Add the info Alert component above the summary
- Add edit/save/cancel UI for summary (textarea) and lessons (input + textarea per lesson, with add/delete controls)
- Add a "Regenerate" button with `RefreshCw` icon next to the summary heading, wrapped in an `AlertDialog` for confirmation

**No database changes needed** -- the existing `books` table already has `summary` (text) and `key_learnings` (jsonb) columns, and the RLS policies allow updates.
