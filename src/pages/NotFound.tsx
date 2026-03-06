/**
 * NotFound.tsx — 404 Error Page
 *
 * This page is shown when someone navigates to a URL that doesn't exist
 * in the app (e.g. /random-page). It's the "catch-all" route defined
 * in App.tsx with `<Route path="*">`.
 *
 * It also logs the attempted URL to the console for debugging purposes,
 * which helps identify broken links or typos.
 */

import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  // useLocation gives us info about the current URL
  const location = useLocation();

  // Log the bad URL so developers can spot broken links
  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
