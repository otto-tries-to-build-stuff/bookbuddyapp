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

interface BookSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (book: OpenLibraryBook) => void;
}

export function BookSearchInput({ value, onChange, onSelect }: BookSearchInputProps) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(value, 350);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["openLibrarySearch", debouncedQuery],
    queryFn: () => searchOpenLibrary(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 60_000,
  });

  const showDropdown = open && (results.length > 0 || isFetching) && value.length >= 2;

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          id="title"
          placeholder="Search for a book…"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Delay closing so click on item registers
            setTimeout(() => setOpen(false), 200);
          }}
          className="pl-9"
          autoComplete="off"
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
          <ul className="max-h-60 overflow-y-auto py-1">
            {results.map((book, i) => {
              const cover = getCoverUrl(book.coverId, "S");
              return (
                <li
                  key={`${book.title}-${book.author}-${i}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(book);
                    setOpen(false);
                  }}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-accent"
                >
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
