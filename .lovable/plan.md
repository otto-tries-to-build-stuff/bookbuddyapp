

## Add Show/Hide Password Toggle on Auth Page

**File**: `src/pages/Auth.tsx`

Add a password visibility toggle (eye icon) to all three password fields (sign in, sign up, and reset password if applicable).

**Changes**:
1. Add a `showPassword` boolean state
2. Wrap each password `<Input>` in a `relative` div
3. Change `type` from `"password"` to `{showPassword ? "text" : "password"}`
4. Add an absolutely-positioned button with `Eye`/`EyeOff` icon from lucide-react inside each password field wrapper
5. Clicking the icon toggles `showPassword`

This applies to the sign-in password field and the sign-up password field.

