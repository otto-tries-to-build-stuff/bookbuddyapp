/**
 * NavLink.tsx — Navigation Link Wrapper
 *
 * A thin wrapper around React Router's NavLink component that makes it
 * easier to use with our Tailwind CSS utility function `cn()`.
 *
 * React Router's NavLink is special because it knows whether the current
 * URL matches its "to" prop. This lets you style the active page's link
 * differently (e.g. highlight the current tab).
 *
 * This wrapper adds support for:
 * - `activeClassName` — extra CSS classes when the link is active
 * - `pendingClassName` — extra CSS classes while navigation is loading
 *
 * It also uses `forwardRef` so parent components can get a reference
 * to the underlying <a> element if needed.
 */

import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

// Extend NavLink props with our custom className props
interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        // NavLink's className can be a function that receives the current state
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
