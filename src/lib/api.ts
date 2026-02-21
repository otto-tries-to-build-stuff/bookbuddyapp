import { supabase } from "@/integrations/supabase/client";

export interface BookChapter {
  number: number;
  title: string;
  summary: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  summary: string | null;
  key_learnings: string[];
  chapters: BookChapter[];
  created_at: string;
  updated_at: string;
}

export async function fetchBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((b) => ({
    ...b,
    key_learnings: Array.isArray(b.key_learnings) ? b.key_learnings as string[] : [],
    chapters: Array.isArray((b as any).chapters) ? (b as any).chapters as BookChapter[] : [],
  }));
}

export async function addBook(title: string, author: string): Promise<Book> {
  // First insert the book
  const { data: book, error: insertError } = await supabase
    .from("books")
    .insert({ title, author })
    .select()
    .single();
  if (insertError) throw insertError;

  // Generate summary via edge function
  try {
    const { data: aiData, error: fnError } = await supabase.functions.invoke(
      "generate-book-summary",
      { body: { title, author } }
    );

    if (!fnError && aiData?.summary) {
      const { data: updated, error: updateError } = await supabase
        .from("books")
        .update({
          summary: aiData.summary,
          key_learnings: aiData.key_learnings || [],
          chapters: aiData.chapters || [],
        })
        .eq("id", book.id)
        .select()
        .single();

      if (!updateError && updated) {
        return {
          ...updated,
          key_learnings: Array.isArray(updated.key_learnings) ? updated.key_learnings as string[] : [],
          chapters: Array.isArray((updated as any).chapters) ? (updated as any).chapters as BookChapter[] : [],
        };
      }
    }
  } catch (e) {
    console.error("Failed to generate summary:", e);
  }

  return {
    ...book,
    key_learnings: Array.isArray(book.key_learnings) ? book.key_learnings as string[] : [],
    chapters: Array.isArray((book as any).chapters) ? (book as any).chapters as BookChapter[] : [],
  };
}

export async function deleteBook(id: string): Promise<void> {
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) throw error;
}

// ── Chat history ──

export interface Chat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  pinned_at: string | null;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export async function fetchChats(): Promise<Chat[]> {
  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return ((data || []) as any[]).map((c) => ({ ...c, pinned_at: c.pinned_at ?? null }));
}

export async function fetchArchivedChats(): Promise<Chat[]> {
  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  if (error) throw error;
  return ((data || []) as any[]).map((c) => ({ ...c, pinned_at: c.pinned_at ?? null }));
}

export async function createChat(title?: string): Promise<Chat> {
  const { data, error } = await supabase
    .from("chats")
    .insert({ title: title || "New Chat" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateChatTitle(id: string, title: string): Promise<void> {
  const { error } = await supabase.from("chats").update({ title }).eq("id", id);
  if (error) throw error;
}

export async function archiveChat(id: string): Promise<void> {
  const { error } = await supabase
    .from("chats")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function restoreChat(id: string): Promise<void> {
  const { error } = await supabase
    .from("chats")
    .update({ deleted_at: null })
    .eq("id", id);
  if (error) throw error;
}

export async function pinChat(id: string): Promise<void> {
  const { error } = await supabase
    .from("chats")
    .update({ pinned_at: new Date().toISOString() } as any)
    .eq("id", id);
  if (error) throw error;
}

export async function unpinChat(id: string): Promise<void> {
  const { error } = await supabase
    .from("chats")
    .update({ pinned_at: null } as any)
    .eq("id", id);
  if (error) throw error;
}

export async function permanentlyDeleteChat(id: string): Promise<void> {
  const { error } = await supabase.from("chats").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchChatMessages(chatId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as ChatMessage[];
}

export async function saveChatMessage(chatId: string, role: "user" | "assistant", content: string): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ chat_id: chatId, role, content })
    .select()
    .single();
  if (error) throw error;
  return data as ChatMessage;
}

type Msg = { role: "user" | "assistant"; content: string };

export async function streamChat({
  messages,
  bookIds,
  onDelta,
  onDone,
}: {
  messages: Msg[];
  bookIds?: string[];
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, bookIds }),
    }
  );

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || "Failed to start chat");
  }

  if (!resp.body) throw new Error("No response body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { streamDone = true; break; }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  onDone();
}
