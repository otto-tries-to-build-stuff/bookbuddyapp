import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Send, Loader2, Check, Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchBooks,
  streamChat,
  createChat,
  fetchChatMessages,
  saveChatMessage,
  updateChatTitle,
  generateChatTitle } from
"@/lib/api";
import ReactMarkdown from "react-markdown";
import ChatSidebar from "@/components/ChatSidebar";

type Msg = {role: "user" | "assistant";content: string;};

const Chat = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: books = [], isLoading: booksLoading } = useQuery({
    queryKey: ["books"],
    queryFn: fetchBooks
  });

  // Load messages when active chat changes
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    fetchChatMessages(activeChatId).then((msgs) => {
      setMessages(msgs.map((m) => ({ role: m.role, content: m.content })));
    });
  }, [activeChatId]);

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

  const handleNewChat = useCallback(() => {
    setActiveChatId(null);
    setMessages([]);
    setInput("");
  }, []);

  const handleSelectChat = useCallback((chatId: string) => {
    setActiveChatId(chatId);
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Msg = { role: "user", content: text };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    // Create a new chat if none is active
    let chatId = activeChatId;
    if (!chatId) {
      try {
        const chat = await createChat("New Chat");
        chatId = chat.id;
        setActiveChatId(chatId);
        queryClient.invalidateQueries({ queryKey: ["chats"] });
      } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
        setIsLoading(false);
        return;
      }
    }

    // Save user message
    await saveChatMessage(chatId, "user", text);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    const finalChatId = chatId;
    try {
      await streamChat({
        messages: allMessages,
        bookIds: selectedBookIds.length > 0 ? selectedBookIds : undefined,
        onDelta: upsert,
        onDone: async () => {
          setIsLoading(false);
          if (assistantSoFar) {
            await saveChatMessage(finalChatId, "assistant", assistantSoFar);
          }
          // Auto-title from first user message
          if (allMessages.filter((m) => m.role === "user").length === 1) {
            const title = await generateChatTitle(text);
            await updateChatTitle(finalChatId, title);
            queryClient.invalidateQueries({ queryKey: ["chats"] });
          }
        }
      });
    } catch (e: any) {
      console.error(e);
      setIsLoading(false);
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const hasStartedChat = messages.length > 0;
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSelectChatMobile = useCallback((chatId: string) => {
    handleSelectChat(chatId);
    setSidebarOpen(false);
  }, [handleSelectChat]);

  const handleNewChatMobile = useCallback(() => {
    handleNewChat();
    setSidebarOpen(false);
  }, [handleNewChat]);

  const sidebarContent =
  <ChatSidebar
    activeChatId={activeChatId}
    onSelectChat={isMobile ? handleSelectChatMobile : handleSelectChat}
    onNewChat={isMobile ? handleNewChatMobile : handleNewChat} />;



  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      {!isMobile && sidebarContent}

      {/* Mobile sidebar sheet */}
      {isMobile &&
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0 gap-0 [&>button:last-child]:hidden [&_.chat-sidebar]:border-r-0">
            <SheetTitle className="sr-only">Chat history</SheetTitle>
            {sidebarContent}
          </SheetContent>
        </Sheet>
      }

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="shrink-0 border-b border-border">
          <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-4 sm:px-6">
            {isMobile &&
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
            }
            <Link to="/" className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              
              <h1 className="text-xl font-sans font-semibold bg-inherit">Chat with your books</h1>
            </div>
          </div>
        </header>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="mx-auto max-w-3xl px-6 py-6">
            {!hasStartedChat &&
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/30" />
                <p className="text-lg text-muted-foreground">Select books for context, then ask away</p>
                <p className="mt-1 mb-6 text-sm text-muted-foreground/60">
                  e.g. "What are the main ideas from Atomic Habits?"
                </p>

                {/* Book selector */}
                {booksLoading ?
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> :
              books.length === 0 ?
              <p className="text-sm text-muted-foreground">
                    No books in your library yet.{" "}
                    <Link to="/" className="text-accent underline">Add some first</Link>.
                  </p> :

              <div className="w-full max-w-md space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        {selectedBookIds.length === 0 ?
                    "All books will be used" :
                    `${selectedBookIds.length} book${selectedBookIds.length > 1 ? "s" : ""} selected`}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-7">
                          Select all
                        </Button>
                        {selectedBookIds.length > 0 &&
                    <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs h-7">
                            Clear
                          </Button>
                    }
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
                        onClick={() => toggleBook(book.id)}>

                            {selected && <Check className="h-3 w-3" />}
                            {book.title}
                          </Badge>);

                  })}
                    </div>
                  </div>
              }
              </div>
            }

            <div className="space-y-6">
              {messages.map((msg, i) =>
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === "user" ?
                  "bg-primary text-primary-foreground" :
                  "bg-secondary text-secondary-foreground"}`
                  }>

                    {msg.role === "assistant" ?
                  <div className="prose prose-base dark:prose-invert">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div> :

                  <p className="text-sm">{msg.content}</p>
                  }
                  </div>
                </div>
              )}
              {isLoading && messages[messages.length - 1]?.role !== "assistant" &&
              <div className="flex justify-start">
                  <div className="rounded-2xl bg-secondary px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              }
            </div>
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="shrink-0 border-t border-border bg-background">
          <div className="mx-auto flex max-w-3xl items-end gap-3 px-6 py-4">
            <Textarea
              placeholder="Ask your books a question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              className="min-h-[44px] max-h-32 resize-none"
              rows={1} />

            <Button size="icon" onClick={send} disabled={!input.trim() || isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>);

};

export default Chat;