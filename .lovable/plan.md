

## Add Authentication with Email Verification

Implement email/password authentication with email verification so users must confirm their email before accessing the app. All existing data tables will be linked to authenticated users.

### What you'll experience

1. **Login/Register page** -- A new `/auth` page with tabs to switch between Sign In and Sign Up forms (email + password)
2. **Email verification** -- After signing up, you'll see a message asking you to check your email and click the confirmation link before you can sign in
3. **Password reset** -- A "Forgot password?" link on the sign-in form, plus a `/reset-password` page where you set a new password after clicking the email link
4. **Protected app** -- All existing pages (Home, Library, Chat, Profile) will require login; unauthenticated visitors are redirected to `/auth`
5. **Logout** -- A sign-out option on the Profile page

### What happens to existing data

Since auth isn't set up yet and tables use public RLS policies, we have two options. Based on our earlier conversation, existing data will need to be handled -- the simplest approach is to **start fresh** (existing unlinked records won't be accessible to new authenticated users). If you'd prefer to assign existing data to the first user who signs in, let me know.

### Technical Details

**Database changes (migration):**
- Add a `user_id` column (uuid, references `auth.users`, ON DELETE CASCADE) to `books`, `chats`, and `chat_messages` tables
- Link the `profile` table's `id` to `auth.users(id)` with a trigger to auto-create a profile on signup
- Replace all public RLS policies with user-scoped policies (e.g., `auth.uid() = user_id`)
- Create a trigger function to auto-create a profile row when a new user signs up

**New files:**
- `src/pages/Auth.tsx` -- Login/Register page with email + password forms
- `src/pages/ResetPassword.tsx` -- Password reset form (handles the recovery link)
- `src/hooks/useAuth.tsx` -- Auth context provider with session state, `onAuthStateChange` listener, sign-in/sign-up/sign-out helpers
- `src/components/ProtectedRoute.tsx` -- Wrapper that redirects to `/auth` if not authenticated

**Modified files:**
- `src/App.tsx` -- Wrap app in AuthProvider, add `/auth` and `/reset-password` routes, protect existing routes with `ProtectedRoute`
- `src/lib/api.ts` -- Include `user_id` when inserting books/chats, and use the authenticated user's session
- `src/pages/Profile.tsx` -- Add sign-out button, show user's email, link profile to auth user
- `src/pages/Home.tsx` -- Minor: profile query will now be user-scoped automatically via RLS

**Auth configuration:**
- Email verification will be **required** (no auto-confirm) -- users must click the confirmation link before signing in
- The signup call will include `emailRedirectTo: window.location.origin` so the confirmation link brings them back to the app

