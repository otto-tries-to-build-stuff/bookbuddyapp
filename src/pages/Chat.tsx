/**
 * Chat.tsx — AI Chat Interface
 *
 * This page lets users have conversations with an AI about their books.
 * It features:
 * - A sidebar with chat history (desktop: always visible, mobile: slide-out sheet)
 * - Book selection badges to choose which books provide context
 * - Real-time streaming responses (text appears as the AI "types")
 * - Markdown rendering for AI responses
 * - Copy button on AI messages
 *
 * Key concepts:
 * - Streaming: The AI response arrives chunk by chunk (not all at once)
 * - SSE (Server-Sent Events): The protocol used for streaming
 * - useCallback: Memoizes functions so they don't cause unnecessary re-renders
 * - useRef: Creates a reference to a DOM element (used for auto-scrolling)
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Send, Loader2, Check, Menu, BookOpen, Copy } from "lucide-react";
import chatIcon from "@/assets/chat-icon.png";
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
  fetchChats,
  streamChat,
  createChat,
  fetchChatMessages,
  saveChatMessage,
  updateChatTitle,
  updateChatBookIds,
  generateChatTitle } from
"@/lib/api";
import ReactMarkdown from "react-markdown";
import ChatSidebar from "@/components/ChatSidebar";

// Simple type for chat messages
type Msg = {role: "user" | "assistant";content: string;};

/**
 * CopyButton — A small button that copies text to the clipboard.
 * Shows a checkmark for 2 seconds after copying.
 */
const CopyButton = ({ content }: { content: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={handleCopy}>
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
};

const Chat = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── State ──
  const [activeChatId, setActiveChatId] = useState<string | null>(null); // Currently selected chat
  const [messages, setMessages] = useState<Msg[]>([]);       // Messages in the current chat
  const [input, setInput] = useState("");                     // Text in the input box
  const [isLoading, setIsLoading] = useState(false);          // Whether the AI is responding
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]); // Books for context

  // Ref for auto-scrolling to the latest message
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch books (for the book selector) and chats (for the sidebar)
  const { data: books = [], isLoading: booksLoading } = useQuery({
    queryKey: ["books"],
    queryFn: fetchBooks
  });

  const { data: chats = [] } = useQuery({
    queryKey: ["chats"],
    queryFn: fetchChats
  });

  const activeChat = chats.find((c) => c.id === activeChatId);

  const [searchParams, setSearchParams] = useSearchParams();

  // Auto-select book from query parameter (e.g. coming from book detail page)
  useEffect(() => {
    const bookId = searchParams.get("bookId");
    if (bookId) {
      setSelectedBookIds((prev) => prev.includes(bookId) ? prev : [...prev, bookId]);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Load messages when the active chat changes
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    // Fetch all messages for this chat from the database
    fetchChatMessages(activeChatId).then((msgs) => {
      setMessages(msgs.map((m) => ({ role: m.role, content: m.content })));
    });
    // Restore the book selection that was saved with this chat
    const chat = chats.find((c) => c.id === activeChatId);
    if (chat?.book_ids?.length) {
      setSelectedBookIds(chat.book_ids);
    }
  }, [activeChatId, chats]);

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Toggle a book's selection (add/remove from context)
  const toggleBook = (id: string) => {
    setSelectedBookIds((prev) =>
    prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedBookIds(books.map((b) => b.id));
  const clearAll = () => setSelectedBookIds([]);

  // Start a new chat (clear everything)
  const handleNewChat = useCallback(() => {
    setActiveChatId(null);
    setMessages([]);
    setInput("");
  }, []);

  // Select an existing chat from the sidebar
  const handleSelectChat = useCallback((chatId: string) => {
    setActiveChatId(chatId);
  }, []);

  /**
   * Send a message to the AI.
   *
   * This is the core function of the chat. It:
   * 1. Creates a new chat if none exists
   * 2. Saves the user's message to the database
   * 3. Streams the AI response in real-time
   * 4. Saves the AI response when it's complete
   * 5. Auto-generates a title for the chat (on first message)
   */
  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    // Add the user's message to the UI immediately (optimistic update)
    const userMsg: Msg = { role: "user", content: text };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    // Create a new chat conversation if this is the first message
    let chatId = activeChatId;
    if (!chatId) {
      try {
        const chat = await createChat("New Chat", selectedBookIds.length > 0 ? selectedBookIds : undefined);
        chatId = chat.id;
        setActiveChatId(chatId);
        queryClient.invalidateQueries({ queryKey: ["chats"] });
      } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
        setIsLoading(false);
        return;
      }
    }

    // Save the user's message to the database
    await saveChatMessage(chatId, "user", text);

    // Track the AI's response as it streams in
    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      // Update the messages array with the growing response
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          // Update existing assistant message
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        // Create new assistant message
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    const finalChatId = chatId;
    try {
      // Start streaming the AI response
      await streamChat({
        messages: allMessages,
        bookIds: selectedBookIds.length > 0 ? selectedBookIds : undefined,
        onDelta: upsert,  // Called for each chunk of text
        onDone: async () => {
          setIsLoading(false);
          // Save the complete AI response to the database
          if (assistantSoFar) {
            await saveChatMessage(finalChatId, "assistant", assistantSoFar);
          }
          // Auto-generate a title from the first user message
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

  // Mobile-specific handlers that also close the sidebar sheet
  const handleSelectChatMobile = useCallback((chatId: string) => {
    handleSelectChat(chatId);
    setSidebarOpen(false);
  }, [handleSelectChat]);

  const handleNewChatMobile = useCallback(() => {
    handleNewChat();
    setSidebarOpen(false);
  }, [handleNewChat]);

  // The sidebar component (reused in both desktop and mobile layouts)
  const sidebarContent =
  <ChatSidebar
    activeChatId={activeChatId}
    onSelectChat={isMobile ? handleSelectChatMobile : handleSelectChat}
    onNewChat={isMobile ? handleNewChatMobile : handleNewChat} />;



  return (
    <div className="flex h-screen bg-background">
      {/* Desktop: sidebar is always visible */}
      {!isMobile && sidebarContent}

      {/* Mobile: sidebar slides in from the left as a "Sheet" */}
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
        {/* Header bar */}
        <header className="shrink-0 border-b border-border">
          <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-4 sm:px-6">
            {/* Mobile: hamburger menu to open sidebar */}
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

        {/* Messages area */}
        <ScrollArea className="flex-1">
          <div className="mx-auto max-w-3xl px-6 py-6">
            {/* Show chat title and context books when a chat is active */}
            {hasStartedChat && activeChat &&
            <div className="mb-6 space-y-2">
                <h2 className="font-semibold text-foreground font-sans text-3xl">{activeChat.title}</h2>
                {selectedBookIds.length > 0 &&
              <div className="flex flex-wrap items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Context:</span>
                    {selectedBookIds.map((id) => {
                  const book = books.find((b) => b.id === id);
                  return book ?
                  <Badge key={id} variant="secondary" className="text-xs py-0.5 px-2">
                          {book.title}
                        </Badge> :
                  null;
                })}
                  </div>
              }
                <div className="border-b border-border" />
              </div>
            }

            {/* Welcome screen — shown before the first message */}
            {!hasStartedChat &&
            <div className="flex flex-col items-center justify-center pt-4 pb-12 text-center">
                <img alt="Chat with books" className="mb-8 h-48 w-48" src="/lovable-uploads/5cc5737f-690e-41df-af95-5d7f4c51d9fc.png" />
                <p className="text-lg text-muted-foreground">Select books for context, then ask away</p>
                <p className="mt-1 mb-6 text-sm text-muted-foreground/60">
                  e.g. "What are the main ideas from Atomic Habits?"
                </p>

                {/* Book selector — lets users choose which books the AI knows about */}
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
                    {/* Each book is a clickable badge — filled when selected */}
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

            {/* Message bubbles */}
            <div className="space-y-6">
              {messages.map((msg, i) =>
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" ? (
                    // AI message — left-aligned, with markdown rendering and copy button
                    <div className="flex flex-col items-start gap-1 max-w-[85%]">
                      <div className="rounded-2xl px-4 py-3 bg-secondary text-secondary-foreground">
                        <div className="prose prose-sm dark:prose-invert">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                      <CopyButton content={msg.content} />
                    </div>
                  ) : (
                    // User message — right-aligned, primary color
                    <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-primary text-primary-foreground">
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  )}
                </div>
              )}
              {/* Loading indicator while waiting for AI to start responding */}
              {isLoading && messages[messages.length - 1]?.role !== "assistant" &&
              <div className="flex justify-start">
                  <div className="rounded-2xl bg-secondary px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              }
            </div>
            {/* Invisible div at the bottom — scrollIntoView targets this */}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input area — fixed at the bottom */}
        <div className="shrink-0 border-t border-border bg-background">
          <div className="mx-auto flex max-w-3xl items-end gap-3 px-6 py-4">
            <Textarea
              placeholder="Ask your books a question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                // Enter sends, Shift+Enter adds a new line
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
