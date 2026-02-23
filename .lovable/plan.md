
## Add Tooltips for Chat Titles and Widen Mobile Sidebar

### What Changes

**Desktop**: Hovering over any chat title shows the full name in a tooltip. No more hard 20-character JS truncation -- CSS handles the ellipsis naturally.

**Mobile/Tablet**: The sidebar sheet widens from `w-72` (288px) to `w-80` (320px), giving titles more breathing room alongside the CSS-based truncation.

### Technical Details

**File: `src/components/ChatSidebar.tsx`**

1. Add import for Tooltip components:
   ```
   import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
   ```

2. Wrap the `ScrollArea` content in a `<TooltipProvider delayDuration={300}>` to prevent tooltip flicker during scrolling.

3. In the `ChatItem` component, replace the title `<span>` (line 220-222) with a Tooltip wrapper:
   - Remove the JS `.slice(0, 20)` truncation
   - Keep the CSS `truncate` class so the browser handles ellipsis based on available width
   - Wrap in `Tooltip` + `TooltipTrigger` + `TooltipContent` showing `chat.title`
   - Radix Tooltips gracefully do nothing on touch devices, so no accidental popups on mobile

**File: `src/pages/Chat.tsx`**

4. Widen the mobile Sheet from `w-72` to `w-80` (line ~147):
   ```
   <SheetContent side="left" className="w-80 p-0 ...">
   ```

**Summary:**
- Two files modified: `ChatSidebar.tsx` and `Chat.tsx`
- No new dependencies (Radix Tooltip already installed)
- No database or backend changes
