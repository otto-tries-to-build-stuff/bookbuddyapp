import { useState, useEffect } from "react";
import bookmindLogo from "@/assets/bookmind-logo.png";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Loader2, Save, PenLine } from "lucide-react";
import { fetchBooks, updateBookNotes } from "@/lib/api";
import { getCoverUrl } from "@/lib/openLibrary";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books"],
    queryFn: fetchBooks,
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
    onError: (e) => toast({ title: "Error saving notes", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Book not found</p>
        <Link to="/" className="text-accent underline">Back to library</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-lg md:max-w-3xl lg:max-w-4xl items-center gap-3">
          <Link to="/" className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <img src={bookmindLogo} alt="BookMind" className="h-5 w-5" />
            <span className="text-sm text-muted-foreground">BookMind</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg md:max-w-3xl lg:max-w-4xl px-4 pb-16 pt-4 sm:px-6">
        {/* Cover + Title: two-column on desktop */}
        <div className="mb-10 flex flex-col items-center md:flex-row md:items-start md:gap-8">
          {(() => {
            const coverUrl = getCoverUrl(book.cover_id, "L");
            return coverUrl ? (
              <div className="mb-6 flex shrink-0 justify-center md:mb-0">
                <img
                  src={coverUrl}
                  alt={`Cover of ${book.title}`}
                  className="h-72 rounded-2xl object-contain shadow-lg"
                />
              </div>
            ) : null;
          })()}
          <div>
            <h1 className="mb-1 text-3xl leading-tight sm:text-4xl">{book.title}</h1>
            <p className="text-base text-muted-foreground">by {book.author}</p>
          </div>
        </div>

        {book.summary ? (
          <div className="space-y-10">
            {/* Summary */}
            <section>
              <h2 className="mb-3 text-xl">Summary</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {book.summary}
              </p>
            </section>

            {/* Key Takeaways */}
            {book.key_learnings.length > 0 && (
              <section>
                <h2 className="mb-3 text-xl">Key Takeaways</h2>
                <ul className="space-y-3">
                  {book.key_learnings.map((learning, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-medium text-accent">
                        {i + 1}
                      </span>
                      <span className="text-sm leading-relaxed text-muted-foreground">{learning}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Chapters */}
            {book.chapters.length > 0 && (
              <section>
                <h2 className="mb-3 text-xl">Chapters</h2>
                <Accordion type="single" collapsible className="w-full">
                  {book.chapters.map((chapter) => (
                    <AccordionItem key={chapter.number} value={`chapter-${chapter.number}`}>
                      <AccordionTrigger className="text-left text-sm">
                        <span>
                          <span className="mr-2 font-medium text-accent">Ch. {chapter.number}</span>
                          {chapter.title}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm leading-relaxed text-muted-foreground">{chapter.summary}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            )}

            {/* Personal Notes */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xl">
                  <PenLine className="h-4 w-4 text-accent" />
                  My Notes
                </h2>
                {!editing && (
                  <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                    Edit
                  </Button>
                )}
              </div>
              {editing ? (
                <div className="space-y-3">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Write your personal notes, reflections, and key takeaways here…"
                    className="min-h-[140px] resize-y rounded-xl text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => notesMutation.mutate()}
                      disabled={notesMutation.isPending}
                      className="gap-1.5"
                    >
                      {notesMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Save
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setNotes(book.notes ?? ""); setEditing(false); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : notes ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{notes}</p>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="w-full rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground/70 transition-colors hover:border-accent/50 hover:text-muted-foreground"
                >
                  Click to add your personal notes…
                </button>
              )}
            </section>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Generating summary…
          </div>
        )}
      </main>
    </div>
  );
};

export default BookDetail;
