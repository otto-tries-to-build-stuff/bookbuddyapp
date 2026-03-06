/**
 * ResetPassword.tsx — Password Reset Page
 *
 * This page is shown when a user clicks the password reset link in their email.
 * The link contains a special token that authenticates the user temporarily.
 *
 * How the flow works:
 * 1. User clicks "Forgot password?" on the Auth page
 * 2. They receive an email with a reset link pointing to /reset-password
 * 3. The link contains a token that triggers a PASSWORD_RECOVERY event
 * 4. This page listens for that event and shows the password form
 * 5. User enters a new password and submits
 *
 * Key concept:
 * - onAuthStateChange: A listener that fires when auth events happen.
 *   We use it to detect the PASSWORD_RECOVERY event, which confirms
 *   the user clicked a valid reset link.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Info, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);  // True once the reset token is verified

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event — this fires when the user
    // arrives via a valid password reset link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);  // Token is valid, show the form
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that passwords match
    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password too short", description: "At least 6 characters required.", variant: "destructive" });
      return;
    }

    setBusy(true);
    const { error } = await updatePassword(password);
    setBusy(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated", description: "You can now sign in with your new password." });
      navigate("/");  // Redirect to home page
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Set new password</CardTitle>
          <CardDescription>
            {ready ? "Enter your new password below." : "Processing your reset link…"}
          </CardDescription>
          <Alert className="mt-3">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Didn't receive the email? Check your spam or junk folder.
            </AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-pw">New password</Label>
              <Input id="new-pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pw">Confirm password</Label>
              <Input id="confirm-pw" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
