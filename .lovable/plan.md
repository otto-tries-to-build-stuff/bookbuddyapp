

## Fix Chat Title Truncation, 3-Dot Menu, and Tooltip Positioning

### Root Causes

1. **No truncation**: The Radix `TooltipTrigger` with `asChild` merges onto the `<span>`, but it needs explicit `overflow-hidden` constraints. The `min-w-0 flex-1 truncate` classes on the span should work, but the Tooltip wrapper div may be breaking the flex layout.

2. **3-dot menu disappearing**: Because the title text isn't truncating, it overflows past the `pr-8` reserved space, visually covering/pushing the absolutely-positioned menu button.

3. **Tooltip too far away**: `side="right"` positions the tooltip to the right edge of the sidebar container rather than near the text.

### Fixes

**File: `src/components/ChatSidebar.tsx`**

1. **Fix truncation**: Wrap the `Tooltip` in a `div` or ensure the TooltipTrigger span has proper overflow constraints. Add `overflow-hidden` and `min-w-0` to a wrapper around the Tooltip so the flex item properly shrinks:
   ```tsx
   <div className="min-w-0 flex-1">
     <Tooltip>
       <TooltipTrigger asChild>
         <span className="block truncate">{chat.title}</span>
       </TooltipTrigger>
       <TooltipContent side="bottom" className="max-w-[200px] break-words">
         {chat.title}
       </TooltipContent>
     </Tooltip>
   </div>
   ```
   - The outer `div` with `min-w-0 flex-1` becomes the flex child that shrinks
   - The inner `span` with `block truncate` handles the text ellipsis
   - This ensures the title stays within bounds and the `pr-8` space is preserved for the 3-dot menu

2. **Fix tooltip position**: Change `side="right"` to `side="bottom"` so the tooltip appears directly below the title text rather than far to the right of the sidebar.

### Summary
- One file modified: `ChatSidebar.tsx`
- Fixes all three issues: truncation with "...", visible 3-dot menu, and closer tooltip positioning
- No new dependencies or backend changes
