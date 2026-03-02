
## Add Spam Folder Notice to Forgot Password Form on Auth Page

The notice was previously added to `/reset-password` (where users set a new password), but the user wants it on the forgot password form within `/auth` (where users request the reset link). This is the form shown in the screenshot.

### Change

**Modified file: `src/pages/Auth.tsx`**
- Import `Alert`, `AlertDescription` from `@/components/ui/alert` and `Info` from `lucide-react`
- Add an `Alert` component inside the `CardHeader` of the `showForgot` block (after `CardDescription`), displaying: "Didn't receive the email? Check your spam or junk folder."
- This will be permanently visible on the forgot password form

**Optional cleanup: `src/pages/ResetPassword.tsx`**
- Remove the Alert from the ResetPassword page since it's less relevant there (user has already found the email at that point). If you'd prefer to keep it in both places, we can do that too.
