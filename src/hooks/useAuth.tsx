/**
 * useAuth.tsx — Authentication Context & Hook
 *
 * This file manages everything related to user authentication (login, signup,
 * logout, password reset). It uses React's "Context" pattern to make auth
 * data available to any component in the app without passing it through props.
 *
 * How it works:
 * 1. AuthProvider wraps the entire app (see App.tsx)
 * 2. Any component can call `useAuth()` to get the current user,
 *    session, and auth functions (signIn, signOut, etc.)
 *
 * Key concepts:
 * - "Session" = proof that a user is logged in (contains tokens)
 * - "Context" = a React feature that shares data across components
 *   without passing props through every level
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

// Define the shape of the auth context — what data and functions it provides
interface AuthContextType {
  session: Session | null;       // The current login session (null if logged out)
  user: User | null;             // The current user object (null if logged out)
  loading: boolean;              // True while we're checking if the user is logged in
  signUp: (email: string, password: string) => Promise<{ error: Error | null; needsVerification: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
}

// Create the context with no default value (undefined until AuthProvider sets it)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider — Wraps the app and provides auth state to all children.
 *
 * It does two things on mount:
 * 1. Subscribes to auth state changes (so it reacts when a user logs in/out)
 * 2. Checks for an existing session (in case the user was already logged in)
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true); // Start as true — we don't know the auth state yet

  useEffect(() => {
    // Listen for ANY auth changes (login, logout, token refresh, etc.)
    // This fires automatically whenever the auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    // Also check if there's already a session stored (e.g. from a previous visit)
    // This runs once when the app first loads
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Cleanup: unsubscribe when the component unmounts
    return () => subscription.unsubscribe();
  }, []); // Empty array = only run once when component mounts

  /**
   * Sign up a new user with email and password.
   * Returns whether verification is needed (user must confirm their email).
   */
  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin }, // Where to redirect after email verification
    });
    if (error) return { error, needsVerification: false };

    // Edge case: if user exists but has no identities, the email is already taken
    if (data.user && data.user.identities?.length === 0) {
      return { error: new Error("An account with this email already exists."), needsVerification: false };
    }
    return { error: null, needsVerification: true };
  };

  /**
   * Sign in an existing user with email and password.
   */
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  };

  /**
   * Sign out the current user. This clears the session from memory and localStorage.
   */
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  /**
   * Send a password reset email to the given address.
   * The email contains a link that brings the user to /reset-password.
   */
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error ? new Error(error.message) : null };
  };

  /**
   * Update the currently logged-in user's password to a new one.
   * Used on the /reset-password page after clicking the email link.
   */
  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error ? new Error(error.message) : null };
  };

  // Provide all auth data and functions to any child component that calls useAuth()
  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth() — Custom hook to access auth data from any component.
 *
 * Usage: const { user, signIn, signOut } = useAuth();
 *
 * Throws an error if used outside of AuthProvider (which shouldn't happen
 * since AuthProvider wraps the entire app in App.tsx).
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
