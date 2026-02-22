import { useState, useEffect } from "react";
import bookmindLogo from "@/assets/bookmind-logo.png";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Loader2, Save, PenLine, Trash2 } from "lucide-react";
import { fetchBooks, updateBookNotes, deleteBook } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from
"@/components/ui/alert-dialog";
import { getCoverUrl } from "@/lib/openLibrary";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const BookDetail = () => {
  const { id } = useParams<{id: string;}>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const deleteMutation = useMutation({
    mutationFn: () => deleteBook(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast({ title: "Book deleted" });
      navigate("/library");
    },
    onError: (e) => toast({ title: "Error deleting book", description: e.message, variant: "destructive" })
  });

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books"],
    queryFn: fetchBooks
  });

  const book = books.find((b) => b.id === id);

  const [notes, setNotes] = useState(book?.notes ?? "");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (book) setNotes(book.notes ?? "");
  }, [book]);

  const notesMutation = useMutation({
    mutationFn: () => updateBookNotes(id!, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      setEditing(false);
      toast({ title: "Notes saved" });
    },
    onError: (e) => toast({ title: "Error saving notes", description: e.message, variant: "destructive" })
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>);

  }

  if (!book) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Book not found</p>
        <Link to="/" className="text-accent underline">Back to library</Link>
      </div>);

  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-lg md:max-w-3xl lg:max-w-4xl items-center justify-between">
          <Link to="/library" className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4.5 w-4.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this book?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove "{book?.title}" and all its data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90">

                  {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <main className="mx-auto max-w-lg md:max-w-3xl lg:max-w-4xl px-4 pb-16 pt-4 sm:px-6">
        {/* Cover + Title: two-column on desktop */}
        <div className="mb-10 flex flex-col items-center md:flex-row md:items-start md:gap-8">
          {(() => {
            const coverUrl = getCoverUrl(book.cover_id, "L");
            return coverUrl ?
            <div className="mb-6 flex shrink-0 justify-center md:mb-0">
                <img
                src={coverUrl}
                alt={`Cover of ${book.title}`}
                className="h-72 rounded-2xl object-contain shadow-lg" />

              </div> :
            null;
          })()}
          <div>
            <h1 className="mb-1 text-3xl leading-tight sm:text-4xl font-sans font-normal">{book.title}</h1>
            <p className="text-base text-muted-foreground">by {book.author}</p>
          </div>
        </div>

        {book.summary ?
        <div className="space-y-10">
            {/* Summary */}
            <section>
              <h2 className="mb-3 text-xl font-sans">Summary</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {book.summary}
              </p>
            </section>

            {/* Key Takeaways */}
            {book.key_learnings.length > 0 &&
          <section>
                <h2 className="mb-3 text-xl font-sans">Key Takeaways</h2>
                <ul className="space-y-3">
                  {book.key_learnings.map((learning, i) =>
              <li key={i} className="flex gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-medium text-accent">
                        {i + 1}
                      </span>
                      <span className="text-sm leading-relaxed text-muted-foreground">{learning}</span>
                    </li>
              )}
                </ul>
              </section>
          }

            {/* Table of Contents */}
            {book.table_of_contents.length > 0 &&
          <section>
                <h2 className="mb-3 text-xl font-sans">Table of Contents</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {book.table_of_contents.join("\n")}
                </p>
              </section>
          }

            {/* Personal Notes */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xl font-sans">
                  <PenLine className="h-4 w-4 text-accent" />
                  My Notes
                </h2>
                {!editing &&
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                    Edit
                  </Button>
              }
              </div>
              {editing ?
            <div className="space-y-3">
                  <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write your personal notes, reflections, and key takeaways here…"
                className="min-h-[140px] resize-y rounded-xl text-sm" />

                  <div className="flex gap-2">
                    <Button
                  size="sm"
                  onClick={() => notesMutation.mutate()}
                  disabled={notesMutation.isPending}
                  className="gap-1.5">

                      {notesMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Save
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => {setNotes(book.notes ?? "");setEditing(false);}}>
                      Cancel
                    </Button>
                  </div>
                </div> :
            notes ?
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{notes}</p> :

            <button
              onClick={() => setEditing(true)}
              className="w-full rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground/70 transition-colors hover:border-accent/50 hover:text-muted-foreground">

                  Click to add your personal notes…
                </button>
            }
            </section>
          </div> :

        <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Generating summary…
          </div>
        }
      </main>
    </div>);

};

export default BookDetail;