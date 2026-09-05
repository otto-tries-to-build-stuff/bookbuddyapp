# Improve chat answer accuracy

## What's going wrong

Three things, confirmed by looking at the app and the saved data:

1. **The chat only sees short summaries, not the books.** Each book has roughly a one-page summary plus 10-12 lessons. Nothing in your library mentions "SIMI", so the assistant has no source for it and fills the gap with a guess instead of saying "that isn't in the summary".
2. **The chat is given every user's books, not just yours.** When no book is selected as context, the chat pulls the whole books table across all accounts (dozens of books). That's both a privacy problem and a big pile of irrelevant text that pushes the assistant off-topic.
3. **It runs on a small, fast model.** ChatGPT and Claude use much stronger models, so the same question gets a better answer there.

## Changes

### 1. Only your own books as context
Use the signed-in person's identity on the chat request and load only their books. Fixes both accuracy and the privacy leak.

### 2. Move to a stronger model
Switch the chat to `openai/gpt-5.6-sol` with reasoning enabled and streaming kept on, so the typewriter effect still works.

### 3. Teach it to admit what it doesn't know
Add prompt rules:
- Treat the summaries as the source of truth for what a book says.
- If an asked-about term, acronym or detail is not in the summaries, say so plainly, then offer general knowledge clearly labelled as "not from your summary".
- Never invent an expansion for an acronym or a quote.

### 4. Let it use general knowledge honestly
For a well-known book, general knowledge is welcome — but the answer must separate "from your library summary" and "general knowledge", so you always know which is which.

## Technical notes
- `supabase/functions/chat/index.ts`: read the caller's JWT, filter `books` by `user_id`; also filter the `bookIds` path by owner. Swap the gateway call from chat completions on `google/gemini-3-flash-preview` to `/v1/responses` with `openai/gpt-5.6-sol`, `stream: true`, `store: false`, medium reasoning effort.
- `src/lib/api.ts` `streamChat`: send the user's session token instead of the anon key, and parse the Responses SSE events (`response.output_text.delta`) — the existing typewriter buffer in `Chat.tsx` stays as is.
- Verify after deploy with a grounded question, an out-of-library acronym question, and a cross-account check that only the signed-in user's books appear.

## Not included (say the word if you want it)
Storing your own notes/highlights per book and feeding those to the chat would be the biggest further accuracy gain, since the assistant would then have real text from the book rather than a generated summary.
