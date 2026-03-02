

## Make Spam Folder Notice Permanent on Reset Password Page

### Change

**Modified file: `src/pages/ResetPassword.tsx`**
- Remove the `{!ready && ...}` conditional wrapper around the `Alert` component so it always renders, regardless of the `ready` state.

