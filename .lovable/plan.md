

## Fix: Add vertical spacing on mobile profile card

**Problem**: The `CardContent` wrapper uses `p-0` on mobile and `p-6` on desktop (`p-0 md:p-6`). This means on mobile there's no padding inside the card — the avatar, name, and email only have `gap-4` (16px) between them, making them feel cramped. On desktop, `p-6` adds 24px of padding on all sides.

**Fix**: Change `p-0 md:p-6` to something like `px-0 py-2 md:p-6` on line 134, adding a small amount of vertical padding on mobile without introducing horizontal padding (since the card is borderless on mobile anyway). This gives a bit more breathing room between the avatar and the email text.

**File**: `src/pages/Profile.tsx`, line 134  
**Change**: `p-0 md:p-6` → `px-0 py-2 md:p-6`

