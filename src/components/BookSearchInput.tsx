/**
 * BookSearchInput.tsx — Book Search Autocomplete
 *
 * This component provides a search input with a dropdown of matching books
 * from the Open Library API. As the user types, it fetches matching results
 * and displays them in a dropdown list with cover thumbnails.
 *
 * How it works:
 * 1. User types in the search box
 * 2. The input value is "debounced" (waits 350ms after typing stops)
 * 3. A React Query fetch is triggered to search Open Library
 * 4. Results appear in a dropdown below the input
 * 5. User clicks a result to select it (fills in title + author)
 */

import { useState, useRef } from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import {
  searchOpenLibrary,
  getCoverUrl,
  type OpenLibraryBook,
} from "@/lib/openLibrary";
import { useQuery } from "@tanstack/react-query";

// Props this component receives from its parent
interface BookSearchInputProps {
  value: string;                            // Current search text
  onChange: (value: string) => void;         // Called when search text changes
  onSelect: (book: OpenLibraryBook) => void; // Called when user clicks a result
}

export function BookSearchInput({ value, onChange, onSelect }: BookSearchInputProps) {
  const [open, setOpen] = useState(false);       // Whether the dropdown is visible
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce the search query — don't search until 350ms after the user stops typing
  const debouncedQuery = useDebounce(value, 350);

  // React Query: automatically fetches search results when debouncedQuery changes
  // "enabled" prevents the query from running until there's enough text
  // "staleTime" caches results for 60 seconds to avoid duplicate requests
  const { data: results = [], isFetching } = useQuery({
    queryKey: ["openLibrarySearch", debouncedQuery],
    queryFn: () => searchOpenLibrary(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 60_000,
  });

  // Show dropdown when: it's open AND (there are results OR we're still loading) AND query is long enough
  const showDropdown = open && (results.length > 0 || isFetching) && value.length >= 2;

  return (
    <div className="relative">
      {/* Search input with magnifying glass icon */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          id="title"
          placeholder="Search for a book…"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true); // Open dropdown when typing
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Delay closing so clicking on an item registers before the dropdown disappears
            setTimeout(() => setOpen(false), 200);
          }}
          className="pl-9"
          autoComplete="off"
        />
        {/* Show loading spinner while fetching results */}
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Dropdown list of search results */}
      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
          <ul className="max-h-80 overflow-y-auto py-1">
            {results.map((book, i) => {
              const cover = getCoverUrl(book.coverId, "S");
              return (
                <li
                  key={`${book.title}-${book.author}-${i}`}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent input blur from firing first
                    onSelect(book);     // Tell parent which book was selected
                    setOpen(false);     // Close the dropdown
                  }}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-accent"
                >
                  {/* Book cover thumbnail (or placeholder) */}
                  {cover ? (
                    <img
                      src={cover}
                      alt=""
                      className="h-10 w-7 rounded-sm object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-10 w-7 items-center justify-center rounded-sm bg-muted text-xs text-muted-foreground">
                      ?
                    </div>
                  )}
                  {/* Book title and author */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{book.title}</p>
                    <p className="truncate text-muted-foreground">
                      {book.author}
                      {book.firstPublishYear ? ` · ${book.firstPublishYear}` : ""}
                    </p>
                  </div>
                </li>
              );
            })}
            {/* Show "Searching…" if we're loading and have no results yet */}
            {isFetching && results.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-muted-foreground">
                Searching…
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
