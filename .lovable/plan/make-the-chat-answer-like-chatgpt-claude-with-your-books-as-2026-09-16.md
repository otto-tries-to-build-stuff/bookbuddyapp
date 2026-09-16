# Make the chat answer like ChatGPT/Claude, with your books as reference

## What's going wrong today

- The chat is only ever given the short generated summary and lessons for each book, and is told to answer from them. Nothing in your library mentions "SIMI", so it has no source and guesses.
- It has no way to look anything up — no internet access at all.
- It runs on a small, fast model, so it is weaker than ChatGPT or Claude at the same question.
- It is also handed every user's books, not just yours, when no book is selected — a privacy leak and a pile of irrelevant text.

## What we'll build

### 1. Selected books become a reference point, not the answer
The chosen book (title and author) is passed as "this is what we're talking about". The summary is included only as light background, explicitly labelled as an app-generated aid that may be incomplete — never as the source of truth.

### 2. The chat can search the web
Give the assistant a web-search capability so questions like "what does SIMI mean in this book?" are looked up and answered from real sources, exactly like ChatGPT or Claude do. It decides when a lookup is needed rather than searching every message.

### 3. A stronger model
Move the chat to `openai/gpt-5.6-sol` with reasoning on, keeping streaming so the typewriter effect still works.

### 4. Honest sourcing
Answers say where information came from: your library, the model's own knowledge, or a web source (with links). If something genuinely can't be found, it says so instead of inventing an answer — no made-up acronym expansions or quotes.

### 5. Only your own books
Load books for the signed-in person only.

Existing guardrails stay: it stays on books and applying their ideas to your life, and still declines unrelated topics.

## Technical notes
- `supabase/functions/chat/index.ts`: switch from chat completions to `/v1/responses` with `openai/gpt-5.6-sol`, `stream: true`, `store: false`, `reasoning: { effort: "medium", summary: "auto" }`, and the hosted `web_search` tool. Confirm the gateway serves the hosted web-search tool for this model on a real request first; if it isn't available, fall back to a `web_search` function tool backed by a search API (needs an API key) and note that before implementing.
- Read the caller's JWT in the function and filter `books` by `user_id`; the `bookIds` path is filtered by owner too.
- Rewrite the system prompt: books are reference context, summaries are labelled as possibly incomplete, search before answering factual/terminology questions, cite sources, admit gaps.
- `src/lib/api.ts` `streamChat`: send the user's session token, and parse Responses SSE events (`response.output_text.delta`); surface search-in-progress events as a small "searching…" state. The typewriter buffer in `Chat.tsx` is unchanged apart from that.
- Verify after deploy: the SIMI question, a summary-grounded question, and a cross-account check.

## Trade-offs
Answers will be slower (reasoning plus lookups) and cost more credits per message than today.
