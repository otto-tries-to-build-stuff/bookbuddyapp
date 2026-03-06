/**
 * ProtectedRoute.tsx — Authentication Guard
 *
 * This component wraps pages that require the user to be logged in.
 * It checks the auth state and either:
 * - Shows a loading spinner while checking auth status
 * - Redirects to /auth (login page) if the user isn't logged in
 * - Renders the page content if the user IS logged in
 *
 * Used in App.tsx like: <ProtectedRoute><Index /></ProtectedRoute>
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Get the current session and loading state from our auth hook
  const { session, loading } = useAuth();

  // Still checking if the user is logged in — show a spinner
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not logged in — redirect to the auth page
  // "replace" means this redirect won't appear in browser history
  if (!session) return <Navigate to="/auth" replace />;

  // Logged in — render the protected page content
  return <>{children}</>;
}
