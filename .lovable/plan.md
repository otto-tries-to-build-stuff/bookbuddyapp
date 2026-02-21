

# Improve Chat Response Formatting

The markdown rendered in chat responses currently uses `prose prose-sm` which makes text small and compact. The fix involves updating the Tailwind prose classes and adding custom CSS to style the markdown output with better spacing, larger headings using the app's serif font, and improved readability.

## Changes

### 1. Update prose classes in `src/pages/Chat.tsx` (line ~155)

Change `prose prose-sm` to `prose prose-base` for larger base text size, and remove `max-w-none` constraints.

### 2. Add custom markdown styles in `src/index.css`

Add targeted styles for the chat prose content:
- Headings (h1-h4): Use `Instrument Serif` font, increase size, add more vertical margin
- Paragraphs: Increase line-height and bottom margin for better spacing
- Bold text: Slightly heavier weight for better visibility
- Lists: More spacing between items
- Italicized references (chapter citations): Subtle muted color to distinguish from body text
- Numbered list items: Better spacing and visual hierarchy

### Technical Details

The styling will target `.prose` inside the assistant message bubble using standard Tailwind `@apply` directives and regular CSS within the existing `@layer base` block in `index.css`. This keeps all theme customization centralized.

Key CSS additions:
- `h1, h2, h3, h4` in prose: `font-family: 'Instrument Serif', serif; margin-top: 1.5em; margin-bottom: 0.5em`
- `h2` size ~1.35rem, `h3` size ~1.15rem for clear hierarchy
- `p` elements: `margin-bottom: 0.75em; line-height: 1.75`
- `li` elements: `margin-bottom: 0.4em`
- `em` (italic references): `color: hsl(var(--muted-foreground))`

