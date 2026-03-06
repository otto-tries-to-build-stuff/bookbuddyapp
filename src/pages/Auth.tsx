/**
 * Auth.tsx — Sign In / Sign Up Page
 *
 * This is the login/registration page. It has three views:
 * 1. Main view: Tabs for "Sign In" and "Sign Up" forms
 * 2. Verification view: Shown after signup to tell the user to check their email
 * 3. Forgot password view: Form to request a password reset link
 *
 * Key concepts:
 * - Navigate: React Router component that redirects (used when already logged in)
 * - Tabs: A UI pattern that switches between sign in and sign up forms
 * - Conditional rendering: The component shows different views based on state
 *   (showVerification, showForgot, or the default login/signup tabs)
 */

import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Info, Loader2, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import homescreenBook from "@/assets/homescreen-book.png";

export default function AuthPage() {
  // Get auth state and functions from our custom hook
  const { session, loading, signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showVerification, setShowVerification] = useState(false); // Show "check your email" view
  const [showForgot, setShowForgot] = useState(false);             // Show forgot password form

  // Show loading spinner while checking auth status
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If already logged in, redirect to home page
  if (session) return <Navigate to="/" replace />;

  // ── View 1: Email Verification Confirmation ──
  // Shown after successful signup to tell the user to check their email
  if (showVerification) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Check your email</CardTitle>
            <CardDescription>
              We sent a verification link to <span className="font-medium text-foreground">{email}</span>. Click the link to activate your account.
            </CardDescription>
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Didn't receive the email? Check your spam or junk folder.
              </AlertDescription>
            </Alert>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => setShowVerification(false)}>
              Back to sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── View 2: Forgot Password Form ──
  if (showForgot) {
    const handleReset = async (e: React.FormEvent) => {
      e.preventDefault();
      setBusy(true);
      const { error } = await resetPassword(email);
      setBusy(false);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Check your email", description: "If an account exists, you'll receive a password reset link." });
        setShowForgot(false);
      }
    };

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-xl">Reset password</CardTitle>
            <CardDescription>Enter your email to receive a reset link.</CardDescription>
            <Alert className="mt-3">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Didn't receive the email? Check your spam or junk folder.
              </AlertDescription>
            </Alert>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input id="reset-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send reset link
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setShowForgot(false)}>
                Back to sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Handlers for the main sign in / sign up forms ──

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();   // Prevent the form from reloading the page
    setBusy(true);
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
    }
    // If successful, the auth state change listener in useAuth will update the session,
    // which triggers the redirect to "/" above
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    setBusy(true);
    const { error, needsVerification } = await signUp(email, password);
    setBusy(false);
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } else if (needsVerification) {
      setShowVerification(true); // Show the "check your email" view
    }
  };

  // ── View 3: Main Sign In / Sign Up Tabs ──
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <p className="mb-6 text-5xl font-medium text-foreground">Hi there 👋</p>

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 h-48 w-48">
            <img src="/lovable-uploads/56195569-8c38-43f8-bec7-173d30014769.png" alt="Book" className="h-full w-full object-contain" />
          </div>
          <CardTitle className="text-2xl">BookBuddy</CardTitle>
          <CardDescription>Your AI-powered reading companion</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tabs switch between Sign In and Sign Up forms */}
          <Tabs defaultValue="signin">
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="signin" className="flex-1">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">Sign Up</TabsTrigger>
            </TabsList>

            {/* Sign In form */}
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="si-email">Email</Label>
                  <Input id="si-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="si-password">Password</Label>
                  <div className="relative">
                    <Input id="si-password" type={showPassword ? "text" : "password"} required value={email ? password : ""} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
                <button type="button" onClick={() => setShowForgot(true)} className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Forgot password?
                </button>
              </form>
            </TabsContent>

            {/* Sign Up form */}
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-password">Password</Label>
                  <Input id="su-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6} />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Link to the About page */}
      <div className="mt-6">
        <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          About BookBuddy
        </Link>
      </div>
    </div>
  );
}
