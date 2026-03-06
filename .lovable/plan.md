

You're right — `py-2` is 8px and `py-4` is 16px, so that's doubling. To triple it (24px), the class should be `py-6`.

**File**: `src/pages/Profile.tsx`, line 134

**Change**: `px-0 py-2 md:p-6` → `px-0 py-6 md:p-6`

Desktop is unaffected since `md:p-6` overrides at the `md` breakpoint. On mobile, vertical padding goes from 8px to 24px.

