
The change will **not** impact the desktop or tablet views.

In the codebase, the sidebar is rendered differently depending on the device:
1.  **Desktop/Tablet:** The `ChatSidebar` component is rendered directly as a standard `div` on the left side of the screen.
2.  **Mobile:** The `ChatSidebar` is wrapped inside a `Sheet` (drawer) component.

The extra gap you are seeing only exists on mobile because it is caused by the default layout settings of the `SheetContent` component. By adding `gap-0` to the mobile-only sheet wrapper, we remove that spacing specifically for the mobile drawer without touching the desktop layout at all.

### Technical Plan

**File: `src/pages/Chat.tsx`**

We will update the `SheetContent` component (which only renders on mobile) to remove the default gap.

- **Current line 171:**
  ```tsx
  <SheetContent side="left" className="w-80 p-0 [&>button:last-child]:hidden [&_.chat-sidebar]:border-r-0">
  ```
- **Proposed change:**
  ```tsx
  <SheetContent side="left" className="w-80 p-0 gap-0 [&>button:last-child]:hidden [&_.chat-sidebar]:border-r-0">
  ```

This ensures that the `SheetTitle` (which is hidden but still takes up logical space in a gap-enabled container) doesn't push the actual sidebar content down.
