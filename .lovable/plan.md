

## Add Copy Icon Below AI Messages

A small copy icon will appear below each assistant message bubble, always visible (not hover-dependent), matching the pattern shown in the reference screenshot.

### Design
- A subtle copy icon button sits directly below the left edge of each assistant message bubble
- Always visible (not hidden behind hover)
- Clicking copies the raw markdown text to clipboard
- Icon transitions from `Copy` to `Check` for 2 seconds as confirmation
- Only on assistant messages, not user messages

### Technical Details

**Single file change: `src/pages/Chat.tsx`**

1. Import `Copy` icon from lucide-react (already have `Check`)
2. Create a small `CopyButton` component inside the file:
   - Takes `content: string` prop
   - Manages `copied` state with 2-second timeout
   - Uses `navigator.clipboard.writeText(content)`
   - Renders as a ghost button with muted icon styling (`text-muted-foreground`, small size)
3. Update the message rendering loop: for assistant messages, wrap the bubble and copy button in a container div, placing `<CopyButton>` below the bubble
4. Style: `h-7 w-7` icon button, `text-muted-foreground hover:text-foreground` for subtle appearance

### Layout structure per assistant message:
```text
+---------------------------+
|  AI response bubble       |
+---------------------------+
[copy icon]
```

No new dependencies or backend changes needed.

