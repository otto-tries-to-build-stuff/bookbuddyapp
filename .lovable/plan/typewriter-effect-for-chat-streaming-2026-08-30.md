# Typewriter Effect for Chat Streaming

## What changes

The chat already streams responses (text arrives chunk by chunk), but chunks appear in blocks. This plan adds a smooth character-by-character reveal on top.

## Changes

### `src/pages/Chat.tsx` — add a typewriter buffer

Replace the current `upsert` logic in `send()` with a two-part system:

1. **Incoming buffer** — `streamChat`'s `onDelta` appends raw chunks into a ref (`pendingRef`) instead of directly updating state.
2. **Reveal loop** — a `setInterval` (or `requestAnimationFrame` loop, ~15-25 chars per tick at ~30fps) drains `pendingRef` character-by-character into the visible `messages` state. This makes text appear at a steady typing pace regardless of how chunky the network delivery is.
3. **Stream end handling** — when `onDone` fires, the interval flushes any remaining buffered text immediately (so no text is lost), saves the final message to the database, and stops the loop.
4. **Auto-scroll** — the existing `scrollRef.scrollIntoView` effect already runs on every `messages` update, so scrolling will follow the typewriter automatically; adjust to `behavior: "auto"` during streaming if smooth scrolling lags behind fast reveals.
5. **Guard against overlapping sends** — the existing `isLoading` flag already prevents this; the interval is cleaned up on unmount via `useEffect` return.

## Technical details

- No backend changes — `streamChat` in `src/lib/api.ts` and the `chat` edge function already stream SSE correctly.
- Reveal rate tuned so a typical response finishes shortly after the stream ends (adaptive: reveal faster if the buffer grows large, e.g. reveal `max(2, bufferLength/10)` chars per tick).
- All existing behavior (title generation, message saving, book context) is unchanged.

## Verification

- Send a message in the preview chat and confirm text appears gradually and smoothly, auto-scrolls, and the full response is saved.
