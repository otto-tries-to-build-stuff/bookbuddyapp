

## Add Change Password to Profile Page

Add a "Change password" section to the existing profile page, allowing authenticated users to update their password directly.

### What you'll see

A new section on the profile page (between the name editor and sign-out button) with:
- New password field
- Confirm password field
- "Update password" button
- Validation: passwords must match and be at least 6 characters
- Success/error toast notifications

### Technical Details

**Modified file: `src/pages/Profile.tsx`**
- Add two password state variables (`newPassword`, `confirmPassword`)
- Add a form section with password inputs and submit button
- Use the existing `updatePassword` method from `useAuth` hook (already implemented)
- Clear the fields on success
- Client-side validation: match check + minimum length

No database changes or new files needed -- the `updatePassword` function in `useAuth.tsx` already calls `supabase.auth.updateUser({ password })`.

