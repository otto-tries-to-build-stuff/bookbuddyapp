import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, BookOpen, Loader2, Save, PenLine, Trash2,
  RefreshCw, Plus, X, Info,
} from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import {
  fetchBooks, updateBookNotes, deleteBook,
  updateBookSummary, updateBookKeyLearnings, regenerateBookSummary,
  type KeyLesson,
} from "@/lib/api";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getCoverUrl } from "@/lib/openLibrary";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books"],
    queryFn: fetchBooks,
  });
  const book = books.find((b) => b.id === id);

  // Notes state
  const [notes, setNotes] = useState(book?.notes ?? "");
  const [editing, setEditing] = useState(false);

  // Editable summary state
  const [editingSummary, setEditingSummary] = useState(false);
  const [editingSummaryText, setEditingSummaryText] = useState("");

  // Editable lessons state
  const [editingLessons, setEditingLessons] = useState(false);
  const [editingLessonsData, setEditingLessonsData] = useState<KeyLesson[]>([]);

  useEffect(() => {
    if (book) {
      setNotes(book.notes ?? "");
    }
  }, [book]);

  // --- Mutations ---

  const deleteMutation = useMutation({
    mutationFn: () => deleteBook(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast({ title: "Book deleted" });
      navigate("/library");
    },
    onError: (e) => toast({ title: "Error deleting book", description: e.message, variant: "destructive" }),
  });

  const notesMutation = useMutation({
    mutationFn: () => updateBookNotes(id!, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      setEditing(false);
      toast({ title: "Notes saved" });
    },
    onError: (e) => toast({ title: "Error saving notes", description: e.message, variant: "destructive" }),
  });

  const summaryMutation = useMutation({
    mutationFn: () => updateBookSummary(id!, editingSummaryText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      setEditingSummary(false);
      toast({ title: "Summary updated" });
    },
    onError: (e) => toast({ title: "Error updating summary", description: e.message, variant: "destructive" }),
  });

  const lessonsMutation = useMutation({
    mutationFn: () => updateBookKeyLearnings(id!, editingLessonsData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      setEditingLessons(false);
      toast({ title: "Key lessons updated" });
    },
    onError: (e) => toast({ title: "Error updating lessons", description: e.message, variant: "destructive" }),
  });

  const regenerateMutation = useMutation({
    mutationFn: () => regenerateBookSummary(id!, book!.title, book!.author),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast({ title: "Summary regenerated" });
    },
    onError: (e) => toast({ title: "Error regenerating summary", description: e.message, variant: "destructive" }),
  });

  // --- Helpers for editing lessons ---

  const updateLesson = (index: number, field: keyof KeyLesson, value: string) => {
    setEditingLessonsData((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const removeLesson = (index: number) => {
    setEditingLessonsData((prev) => prev.filter((_, i) => i !== index));
  };

  const addLesson = () => {
    setEditingLessonsData((prev) => [...prev, { title: "", detail: "" }]);
  };

  // --- Render ---

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
                  This will permanently remove "{book.title}" and all its data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <main className="mx-auto max-w-lg md:max-w-3xl lg:max-w-4xl px-4 pb-16 pt-4 sm:px-6">
        {/* Cover + Title */}
        <div className="mb-10 flex flex-col items-center md:flex-row md:items-start md:gap-8">
          {(() => {
            const coverUrl = getCoverUrl(book.cover_id, "L");
            return coverUrl ? (
              <div className="mb-6 flex shrink-0 justify-center md:mb-0">
                <img src={coverUrl} alt={`Cover of ${book.title}`} className="h-72 rounded-2xl object-contain shadow-lg" />
              </div>
            ) : null;
          })()}
          <div>
            <h1 className="mb-1 text-3xl leading-tight sm:text-4xl font-sans font-normal">{book.title}</h1>
            <p className="text-base text-muted-foreground">by {book.author}</p>
          </div>
        </div>

        {book.summary ? (
          <div className="space-y-10">
            {/* AI Disclaimer */}
            <Alert className="border-muted bg-muted/40">
              <Info className="h-4 w-4 text-muted-foreground" />
              <AlertDescription className="text-xs text-muted-foreground">
                AI-generated summaries may sometimes contain inaccuracies. You can regenerate the summary or edit any section manually.
              </AlertDescription>
            </Alert>

            {/* Summary */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-sans">Summary</h2>
                <div className="flex items-center gap-1">
                  {!editingSummary && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingSummaryText(book.summary || "");
                        setEditingSummary(true);
                      }}
                    >
                      Edit
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                        disabled={regenerateMutation.isPending}
                      >
                        {regenerateMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        Regenerate
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Regenerate summary?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will replace the current summary and key lessons with a new AI-generated version.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => regenerateMutation.mutate()}>
                          Regenerate
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {editingSummary ? (
                <div className="space-y-3">
                  <Textarea
                    value={editingSummaryText}
                    onChange={(e) => setEditingSummaryText(e.target.value)}
                    className="min-h-[180px] resize-y rounded-xl text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => summaryMutation.mutate()} disabled={summaryMutation.isPending} className="gap-1.5">
                      {summaryMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Save
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingSummary(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{book.summary}</p>
              )}
            </section>

            {/* Key Lessons */}
            {book.key_learnings.length > 0 && (
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xl font-sans">Key Lessons</h2>
                  {!editingLessons && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingLessonsData(book.key_learnings.map((l) => ({ ...l })));
                        setEditingLessons(true);
                      }}
                    >
                      Edit
                    </Button>
                  )}
                </div>

                {editingLessons ? (
                  <div className="space-y-4">
                    {editingLessonsData.map((lesson, i) => (
                      <div key={i} className="rounded-xl border p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-medium text-accent">
                            {i + 1}
                          </span>
                          <Input
                            value={lesson.title}
                            onChange={(e) => updateLesson(i, "title", e.target.value)}
                            placeholder="Lesson title"
                            className="flex-1 text-sm"
                          />
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeLesson(i)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Textarea
                          value={lesson.detail}
                          onChange={(e) => updateLesson(i, "detail", e.target.value)}
                          placeholder="Lesson detail"
                          className="min-h-[80px] resize-y text-sm"
                        />
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={addLesson}>
                      <Plus className="h-3.5 w-3.5" /> Add Lesson
                    </Button>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" onClick={() => lessonsMutation.mutate()} disabled={lessonsMutation.isPending} className="gap-1.5">
                        {lessonsMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        Save
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingLessons(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Accordion type="multiple" className="space-y-2">
                    {book.key_learnings.map((lesson, i) => (
                      <AccordionItem key={i} value={`lesson-${i}`} className="border rounded-xl px-4">
                        <AccordionTrigger className="text-sm font-medium hover:no-underline">
                          <span className="flex items-center gap-3 text-left font-sans">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-medium text-accent">
                              {i + 1}
                            </span>
                            {lesson.title}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="text-sm leading-relaxed text-muted-foreground pl-9">
                          {lesson.detail}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </section>
            )}

            {/* Personal Notes */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xl font-sans">
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
                    <Button size="sm" onClick={() => notesMutation.mutate()} disabled={notesMutation.isPending} className="gap-1.5">
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
