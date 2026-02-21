import { useState } from "react";
import bookmindLogo from "@/assets/bookmind-logo.png";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, BookOpen, MessageCircle, Trash2, Loader2, User } from "lucide-react";
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
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverId, setCoverId] = useState<number | null>(null);

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books"],
    queryFn: fetchBooks
  });

  const addMutation = useMutation({
    mutationFn: () => addBook(title, author, coverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      setOpen(false);
      setTitle("");
      setAuthor("");
      setCoverId(null);
      toast({ title: "Book added!", description: "AI is generating the summary." });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" })
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast({ title: "Book removed" });
    }
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-lg md:max-w-3xl lg:max-w-5xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img alt="BookMind" className="h-6 w-6" src="/lovable-uploads/52961b25-0993-4a45-88df-fc639126044c.png" />
            <span className="text-sm font-medium text-foreground">BookMind</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link to="/profile">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <User className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/chat">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </Link>
            <Dialog open={open} onOpenChange={setOpen}>
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

                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <BookSearchInput
                      value={title}
                      onChange={setTitle}
                      onSelect={(book: OpenLibraryBook) => {
                        setTitle(book.title);
                        setAuthor(book.author);
                        setCoverId(book.coverId);
                      }} />

                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author">Author</Label>
                    <Input
                      id="author"
                      placeholder="e.g. James Clear"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)} />

                  </div>
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

      {/* Greeting */}
      <main className="mx-auto max-w-lg md:max-w-3xl lg:max-w-5xl px-4 pb-10 sm:px-6">
        <div className="mb-6 mt-4">
          <h1 className="text-3xl sm:text-4xl">What are you reading?</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {books.length} {books.length === 1 ? "book" : "books"} in your collection
          </p>
        </div>

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

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {books.map((book) =>
          <BookCard key={book.id} book={book} onDelete={() => deleteMutation.mutate(book.id)} />
           )}
          </div>
        }
      </main>
    </div>);

};

function BookCard({ book, onDelete }: {book: Book;onDelete: () => void;}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const coverUrl = getCoverUrl(book.cover_id, "M");

  return (
    <>
      <Link
        to={`/book/${book.id}`}
        className="group relative flex gap-4 rounded-2xl bg-card p-3 shadow-sm transition-all hover:shadow-md active:scale-[0.99]">

        {/* Cover thumbnail */}
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

        {/* Text */}
        <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
          <h3 className="truncate text-base font-medium leading-snug text-foreground">
            {book.title}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{book.author}</p>
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground/80">
            {book.summary || "Generating summary…"}
          </p>
        </div>

        {/* Delete */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowConfirm(true);
          }}
          className="absolute right-2 top-2 rounded-lg p-1.5 text-muted-foreground/40 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100">

          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </Link>

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