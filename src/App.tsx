/**
 * App.tsx — The Root Component & Route Definitions
 *
 * This is the "skeleton" of the entire application. It sets up:
 * 1. Global providers (things every page needs access to)
 * 2. Routes (which URL shows which page)
 *
 * Think of "providers" like layers of an onion — each one wraps the app
 * and makes a specific feature available everywhere inside it.
 */

// Toast notifications (the little pop-up messages)
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

// Tooltip provider — enables hover tooltips across the app
import { TooltipProvider } from "@/components/ui/tooltip";

// React Query — manages server data fetching, caching, and synchronisation
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// React Router — handles navigation between pages without full page reloads
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Theme provider — handles dark mode / light mode switching
import { ThemeProvider } from "next-themes";

// Our custom auth provider — makes the logged-in user available everywhere
import { AuthProvider } from "@/hooks/useAuth";

// A wrapper component that redirects to /auth if the user isn't logged in
import ProtectedRoute from "@/components/ProtectedRoute";

// All the page components (each one represents a different screen)
import Index from "./pages/Index";
import BookDetail from "./pages/BookDetail";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

// Create a single QueryClient instance — this is the "brain" that manages
// all data fetching and caching for the app
const queryClient = new QueryClient();

const App = () => (
  // QueryClientProvider: Makes React Query available to all components
  <QueryClientProvider client={queryClient}>
    {/* ThemeProvider: Manages dark/light mode, stores preference in localStorage */}
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {/* AuthProvider: Tracks whether the user is logged in and provides auth functions */}
      <AuthProvider>
        <TooltipProvider>
          {/* These two components render toast notifications anywhere in the app */}
          <Toaster />
          <Sonner />

          {/* BrowserRouter: Enables client-side routing (URL-based navigation) */}
          <BrowserRouter>
          {/* Routes: Defines which component to show for each URL path */}
          <Routes>
            {/* Public routes — anyone can access these */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/about" element={<About />} />

            {/* Protected routes — wrapped in ProtectedRoute, which redirects
                to /auth if the user isn't logged in */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/book/:id" element={<ProtectedRoute><BookDetail /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Catch-all: any URL that doesn't match above shows the 404 page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
