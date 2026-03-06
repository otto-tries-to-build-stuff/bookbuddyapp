/**
 * Index.tsx — Home Page / Book Library
 *
 * This is the main screen users see after logging in. It shows:
 * 1. A header with profile avatar, chat link, and "add book" button
 * 2. A search bar to filter books by title or author
 * 3. A grid of book cards (each links to the book detail page)
 *
 * Key patterns used:
 * - useQuery: Fetches data from the database and caches it
 * - useMutation: Handles actions that modify data (add/delete books)
 * - useState: Tracks local UI state (dialog open, search text, etc.)
 */

import { useState } from "react";
import bookmindLogo from "@/assets/bookmind-logo.png";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, BookOpen, MessageCircle, Trash2, Loader2, User, Search, X } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { fetchProfile } from "@/lib/api";
import { BookSearchInput } from "@/components/BookSearchInput";
import type { OpenLibraryBook } from "@/lib/openLibrary";
import { getCoverUrl } from "@/lib/openLibrary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger } from
"@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle } from
"@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { fetchBooks, addBook, deleteBook, type Book } from "@/lib/api";

const Index = () => {
  const { toast } = useToast();

  // queryClient lets us manually invalidate (refresh) cached data after mutations
  const queryClient = useQueryClient();

  // Local state for the "Add Book" dialog
  const [open, setOpen] = useState(false);          // Whether the dialog is open
  const [title, setTitle] = useState("");            // Book title input
  const [author, setAuthor] = useState("");          // Book author input
  const [coverId, setCoverId] = useState<number | null>(null);      // Cover image ID from Open Library
  const [editionKey, setEditionKey] = useState<string | null>(null); // Edition identifier
  const [manualMode, setManualMode] = useState(false); // Toggle between search and manual entry
  const [searchQuery, setSearchQuery] = useState("");  // Library filter search text

  // Fetch all books from the database
  // useQuery handles loading states, error states, and caching automatically
  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books"],    // Cache key — used to identify this data
    queryFn: fetchBooks     // The function that fetches the data
  });

  // Fetch the user's profile (for the avatar in the header)
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile
  });

  // Mutation for adding a new book
  // useMutation handles the loading/error states for write operations
  const addMutation = useMutation({
    mutationFn: () => addBook(title, author, coverId, editionKey),
    onSuccess: () => {
      // After adding, refresh the book list, close dialog, and reset form
      queryClient.invalidateQueries({ queryKey: ["books"] });
      setOpen(false);
      setTitle("");
      setAuthor("");
      setCoverId(null);
      setEditionKey(null);
      toast({ title: "Book added!", description: "Your AI-generated summary is ready" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" })
  });

  // Filter books by the search query (client-side filtering)
  const query = searchQuery.toLowerCase();
  const filteredBooks = query
    ? books.filter((b) => b.title.toLowerCase().includes(query) || b.author.toLowerCase().includes(query))
    : books;

  // Mutation for deleting a book
  const deleteMutation = useMutation({
    mutationFn: deleteBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast({ title: "Book removed" });
    }
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar — profile avatar, chat button, add book button */}
      <header className="px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-lg md:max-w-3xl lg:max-w-5xl items-center justify-between">
          {/* Profile avatar — links to /profile */}
          <Link to="/profile">
            <Avatar className="h-9 w-9 border border-border">
              {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt="Profile" /> : null}
              <AvatarFallback className="bg-secondary text-muted-foreground">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex items-center gap-1">
            {/* Chat button — links to /chat */}
            <Link to="/chat">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </Link>

            {/* Add Book dialog — opens a form to add a new book */}
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setManualMode(false); }}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add a book to your library</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (title && author) addMutation.mutate();
                  }}
                  className="space-y-4">

                  {/* Two modes: Search (default) or Manual entry */}
                  {!manualMode ? (
                    <>
                      {/* Search mode — uses BookSearchInput for autocomplete */}
                      <div className="space-y-2">
                        <Label htmlFor="title">Search</Label>
                        <BookSearchInput
                          value={title}
                          onChange={setTitle}
                          onSelect={(book: OpenLibraryBook) => {
                            // When a search result is selected, fill in all fields
                            setTitle(book.title);
                            setAuthor(book.author);
                            setCoverId(book.coverId);
                            setEditionKey(book.editionKey);
                          }} />
                      </div>
                      {/* Show the author field once one is selected */}
                      {author && (
                        <div className="space-y-2">
                          <Label>Author</Label>
                          <Input value={author} readOnly className="bg-muted" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setManualMode(true)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        Can't find it? Add manually
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Manual mode — simple text inputs for title and author */}
                      <div className="space-y-2">
                        <Label htmlFor="manual-title">Title</Label>
                        <Input
                          id="manual-title"
                          placeholder="e.g. Atomic Habits"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="manual-author">Author</Label>
                        <Input
                          id="manual-author"
                          placeholder="e.g. James Clear"
                          value={author}
                          onChange={(e) => setAuthor(e.target.value)} />
                      </div>
                      <button
                        type="button"
                        onClick={() => setManualMode(false)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        ← Back to search
                      </button>
                    </>
                  )}

                  {/* Submit button — shows loading state while adding */}
                  <Button type="submit" className="w-full" disabled={addMutation.isPending || !title || !author}>
                    {addMutation.isPending ?
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating summary…
                      </> :
                    "Add Book"
                    }
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="mx-auto max-w-lg md:max-w-3xl lg:max-w-5xl px-4 pb-10 sm:px-6">
        {/* Page heading and book count */}
        <div className="mb-6 mt-4">
          <h1 className="text-3xl sm:text-4xl font-sans font-medium">What are you reading?</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchQuery && books.length > 0
              ? `${filteredBooks.length} of ${books.length} ${books.length === 1 ? "book" : "books"}`
              : `${books.length} ${books.length === 1 ? "book" : "books"} in your library`}
          </p>
        </div>

        {/* Search/filter bar — only shown when there are books */}
        {books.length > 0 && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title or author…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {/* Clear button — only shown when there's search text */}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Book list — shows different states: loading, empty, no results, or grid of books */}
        {isLoading ?
        <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div> :
        books.length === 0 ?
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg text-muted-foreground">Your library is empty</p>
            <p className="text-sm text-muted-foreground/70">Add your first book to get started</p>
          </div> :
        filteredBooks.length === 0 ?
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
            <Search className="mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-muted-foreground">No books match your search</p>
          </div> :

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredBooks.map((book) =>
          <BookCard key={book.id} book={book} onDelete={() => deleteMutation.mutate(book.id)} />
          )}
          </div>
        }
      </main>
    </div>);

};

/**
 * BookCard — A single book in the library grid.
 *
 * Shows the book cover, title, author, and a preview of the summary.
 * Clicking the card navigates to the book detail page.
 * The delete button (trash icon) appears on hover.
 */
function BookCard({ book, onDelete }: {book: Book;onDelete: () => void;}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const coverUrl = getCoverUrl(book.cover_id, "M");

  return (
    <>
      {/* The entire card is a Link — clicking anywhere navigates to /book/:id */}
      <Link
        to={`/book/${book.id}`}
        className="group relative flex gap-4 rounded-2xl bg-card p-3 shadow-sm transition-all hover:shadow-md active:scale-[0.99]">

        {/* Book cover thumbnail */}
        <div className="h-24 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
          {coverUrl ?
          <img
            src={coverUrl}
            alt={`Cover of ${book.title}`}
            className="h-full w-full object-cover"
            loading="lazy" /> :

          <div className="flex h-full w-full items-center justify-center">
              <BookOpen className="h-5 w-5 text-muted-foreground/40" />
            </div>
          }
        </div>

        {/* Book info: title, author, summary preview */}
        <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
          <h3 className="truncate text-base font-medium leading-snug text-foreground font-sans">
            {book.title}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{book.author}</p>
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground/80">
            {book.summary || "Generating summary…"}
          </p>
        </div>

        {/* Delete button — hidden by default, appears on hover (group-hover) */}
        <button
          onClick={(e) => {
            e.preventDefault();      // Don't navigate to book detail
            e.stopPropagation();     // Don't trigger the Link
            setShowConfirm(true);    // Show confirmation dialog
          }}
          className="absolute right-2 top-2 rounded-lg p-1.5 text-muted-foreground/40 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100">

          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </Link>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{book.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this book and its summary from your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>);

}

export default Index;
