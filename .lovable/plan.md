

## Add Spam Folder Notice to Reset Password Page

Add a small informational note below the card description on the reset password page, reminding users to check their spam/junk folder if they don't see the reset email.

### Changes

**Modified file: `src/pages/ResetPassword.tsx`**
- Add an `Alert` component (using the existing `src/components/ui/alert.tsx`) below the `CardDescription` inside `CardHeader`
- The alert will contain a brief message: "Didn't receive the email? Check your spam or junk folder."
- Use the `Info` icon from `lucide-react` for visual clarity
- Only show this note while waiting for the recovery token (i.e., when `ready` is `false`), since that's when the user has just arrived from their email

