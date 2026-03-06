/**
 * use-debounce.ts — Debounce Hook
 *
 * "Debouncing" means waiting until the user stops doing something
 * before taking action. For example, when typing in a search box,
 * you don't want to send a request for every single keystroke —
 * instead, you wait until the user pauses typing.
 *
 * How it works:
 * 1. You pass in a value and a delay (in milliseconds)
 * 2. The hook returns the value, but only updates it after the
 *    user stops changing it for the specified delay
 *
 * Example: useDebounce(searchText, 350) → only updates after
 * 350ms of no typing, preventing excessive API calls
 */

import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  // Store the debounced version of the value
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    // Set a timer to update the debounced value after the delay
    const timer = setTimeout(() => setDebounced(value), delay);

    // If the value changes again before the timer fires,
    // cancel the old timer (this is what creates the "wait" effect)
    return () => clearTimeout(timer);
  }, [value, delay]); // Re-run when value or delay changes

  return debounced;
}
