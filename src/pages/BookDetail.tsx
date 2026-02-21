import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { fetchBooks } from "@/lib/api";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books"],
    queryFn: fetchBooks,
  });

  const book = books.find((b) => b.id === id);

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
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 py-5">
          <Link to="/" className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" />
            <span className="text-sm text-muted-foreground">BookMind</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="mb-2 text-5xl leading-tight">{book.title}</h1>
        <p className="mb-10 text-lg text-muted-foreground">by {book.author}</p>

        {book.summary ? (
          <>
            <section className="mb-12">
              <h2 className="mb-4 text-2xl">Summary</h2>
              <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                {book.summary}
              </p>
            </section>

            {book.key_learnings.length > 0 && (
              <section>
                <h2 className="mb-4 text-2xl">Key Takeaways</h2>
                <ul className="space-y-3">
                  {book.key_learnings.map((learning, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-medium text-accent">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed text-muted-foreground">{learning}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {book.chapters.length > 0 && (
              <section className="mt-12">
                <h2 className="mb-4 text-2xl">Chapters</h2>
                <Accordion type="single" collapsible className="w-full">
                  {book.chapters.map((chapter) => (
                    <AccordionItem key={chapter.number} value={`chapter-${chapter.number}`}>
                      <AccordionTrigger className="text-left">
                        <span>
                          <span className="mr-2 text-accent font-medium">Ch. {chapter.number}</span>
                          {chapter.title}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="leading-relaxed text-muted-foreground">{chapter.summary}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            )}
          </>
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
