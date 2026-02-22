

# Fix Broken String Interpolation in Pass 2 System Prompt

## Problem
Line 102 in `generate-book-summary/index.ts` uses a regular string with curly quotation marks instead of a template literal with backticks. This means `${title}` and `${author}` are sent as literal text to the AI, not the actual values.

## Fix
Change line 102 from a regular string to a template literal (backticks), matching the style used everywhere else in the file:

```
// Before (broken — regular string, no interpolation):
{ role: "system", content: "Using Google Books, list the official table of contents for \u201C${title}\u201D by ${author}." },

// After (fixed — template literal, variables interpolated):
{ role: "system", content: `List the official table of contents for "${title}" by ${author}. Output one chapter per line, no commentary.` },
```

This is a one-line fix in `supabase/functions/generate-book-summary/index.ts`. The edge function will be redeployed after the change.

