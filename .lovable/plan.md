

# Switch Book Summary Model to OpenAI GPT-5.2

## What Changes

Update the `generate-book-summary` edge function to use `openai/gpt-5.2` instead of the current Gemini models. This model has enhanced reasoning capabilities which should help with accurately identifying and listing all chapters.

## Technical Details

**File: `supabase/functions/generate-book-summary/index.ts`**

- Change the model selection (lines ~88-90) from:
  - `google/gemini-3-flash-preview` (when real chapters exist) -> `openai/gpt-5.2`
  - `google/gemini-2.5-pro` (fallback/no chapters) -> `openai/gpt-5.2`
- Use `openai/gpt-5.2` for both cases since its stronger reasoning should handle both scenarios well

This is a one-line change -- no other files need updating.

