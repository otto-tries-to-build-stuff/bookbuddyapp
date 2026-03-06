/**
 * utils.ts — Utility Functions
 *
 * This file contains small helper functions used throughout the app.
 * Currently it only has `cn()`, which is used for combining CSS class names.
 *
 * cn() does two things:
 * 1. `clsx()` — Merges multiple class names together, handling conditionals
 *    (e.g. cn("base", isActive && "active") → "base active" or just "base")
 * 2. `twMerge()` — Resolves Tailwind CSS conflicts intelligently
 *    (e.g. cn("px-4", "px-6") → "px-6" instead of "px-4 px-6")
 *
 * You'll see cn() used everywhere in component className props.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
