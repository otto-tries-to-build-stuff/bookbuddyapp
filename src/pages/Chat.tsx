import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Send, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { fetchBooks, streamChat } from "@/lib/api";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const Chat = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: books = [], isLoading: booksLoading } = useQuery({
    queryKey: ["books"],
    queryFn: fetchBooks,
  });

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleBook = (id: string) => {
    setSelectedBookIds((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedBookIds(books.map((b) => b.id));
  const clearAll = () => setSelectedBookIds([]);

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Msg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        bookIds: selectedBookIds.length > 0 ? selectedBookIds : undefined,
        onDelta: upsert,
        onDone: () => setIsLoading(false),
      });
    } catch (e: any) {
      console.error(e);
      setIsLoading(false);
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const hasStartedChat = messages.length > 0;

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="shrink-0 border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 py-4">
          <Link to="/" className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" />
            <h1 className="text-xl">Chat with your books</h1>
          </div>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-6">
          {!hasStartedChat && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/30" />
              <p className="text-lg text-muted-foreground">Select books for context, then ask away</p>
              <p className="mt-1 mb-6 text-sm text-muted-foreground/60">
                e.g. "What are the main ideas from Atomic Habits?"
              </p>

              {/* Book selector */}
              {booksLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : books.length === 0 ? (
                <p className="text-sm text-muted-foreground">No books in your library yet. <Link to="/" className="text-accent underline">Add some first</Link>.</p>
              ) : (
                <div className="w-full max-w-md space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      {selectedBookIds.length === 0
                        ? "All books will be used"
                        : `${selectedBookIds.length} book${selectedBookIds.length > 1 ? "s" : ""} selected`}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-7">
                        Select all
                      </Button>
                      {selectedBookIds.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs h-7">
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {books.map((book) => {
                      const selected = selectedBookIds.includes(book.id);
                      return (
                        <Badge
                          key={book.id}
                          variant={selected ? "default" : "outline"}
                          className="cursor-pointer select-none gap-1.5 py-1.5 px-3 text-sm transition-colors"
                          onClick={() => toggleBook(book.id)}
                        >
                          {selected && <Check className="h-3 w-3" />}
                          {book.title}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-secondary px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="shrink-0 border-t border-border bg-background">
        <div className="mx-auto flex max-w-3xl items-end gap-3 px-6 py-4">
          <Textarea
            placeholder="Ask about your books…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          <Button size="icon" onClick={send} disabled={!input.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
