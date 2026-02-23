

## Switch Book Summary Model to Gemini 3 Flash Preview

A single-line change in the edge function to swap the model from `openai/gpt-5.2` to `google/gemini-3-flash-preview`, which should cut summary generation time by 2-4x with negligible quality difference for structured book summaries.

### Technical Details

**File: `supabase/functions/generate-book-summary/index.ts`**

Change line 30:
```
const model = "openai/gpt-5.2";
```
to:
```
const model = "google/gemini-3-flash-preview";
```

No other changes needed -- the rest of the function (tool calling, JSON parsing, error handling) is model-agnostic and works identically with Gemini.

