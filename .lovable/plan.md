

## Add Chapter Summaries to Books

### What changes
When a book is added, the AI will now also generate a summary for each chapter (title and brief summary). These chapters will be stored in the database and displayed as expandable dropdowns on the book detail page.

### Steps

**1. Database: Add `chapters` column to `books` table**

Add a new JSONB column `chapters` to the `books` table with a default of `'[]'`. Each entry will be an object like:
```text
{ "number": 1, "title": "Chapter Title", "summary": "Brief summary..." }
```

**2. Update the AI summary edge function**

Modify `supabase/functions/generate-book-summary/index.ts` to also request chapter-by-chapter summaries from the AI. The tool schema will be extended to include a `chapters` array with `number`, `title`, and `summary` fields for each chapter.

**3. Update the API layer**

- Update the `Book` interface in `src/lib/api.ts` to include a `chapters` field (array of `{ number: number; title: string; summary: string }`).
- Update `addBook` to save the returned `chapters` data alongside `summary` and `key_learnings`.

**4. Update the Book Detail page**

Modify `src/pages/BookDetail.tsx` to display chapters as an accordion (expandable dropdowns) below the main summary section, using the existing Radix UI Accordion component. Each item shows the chapter number and title as the trigger, with the chapter summary revealed on click.

**5. Update the chat system prompt**

Update `supabase/functions/chat/index.ts` to include chapter data in the book context passed to the AI, and update the anti-hallucination instructions so the AI can now reference real chapter names.

---

### Technical Details

- **Migration SQL**: `ALTER TABLE public.books ADD COLUMN chapters jsonb DEFAULT '[]'::jsonb;`
- **Existing books** will have an empty `chapters` array and will continue to display normally. Only newly added books will get chapter data.
- The Accordion component from `src/components/ui/accordion.tsx` is already installed and will be reused.
- The `types.ts` file will auto-update after the migration.
