/**
 * api.ts — All Database & API Functions
 *
 * This is the "data layer" of the app. Every function that reads from or
 * writes to the database lives here. Components import these functions
 * to fetch books, save chats, update profiles, etc.
 *
 * Key concept: The Supabase client acts like a bridge between your frontend
 * code and the database. You call methods like `.from("books").select("*")`
 * and it sends the request to the database and returns the results.
 *
 * The file is organised into sections:
 * 1. Books (CRUD operations + AI summary generation)
 * 2. Chat history (conversations with the AI)
 * 3. Profile (user name, avatar)
 * 4. Stream chat (real-time AI responses)
 */

import { supabase } from "@/integrations/supabase/client";

// ── Type Definitions ──
// These "interfaces" define the shape of our data objects.
// They tell TypeScript (and you!) exactly what fields each object has.

export interface KeyLesson {
  title: string;   // Short name for the lesson (e.g. "Start Small")
  detail: string;  // Longer explanation of the lesson
}

export interface Book {
  id: string;
  title: string;
  author: string;
  summary: string | null;          // AI-generated summary (null if not yet generated)
  key_learnings: KeyLesson[];      // Array of key lessons from the book
  cover_id: number | null;         // Open Library cover image ID
  notes: string | null;            // User's personal notes
  created_at: string;              // When the book was added
  updated_at: string;
}

// ── Helper: Get Current User ID ──

/**
 * Gets the ID of the currently logged-in user.
 * Throws an error if no one is logged in — this prevents
 * accidentally saving data without a user attached.
 */
async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

// ═══════════════════════════════════════════════
// ── BOOKS ──
// ═══════════════════════════════════════════════

/**
 * Fetch all books from the database, newest first.
 * The `.select("*")` means "get all columns".
 * We also transform key_learnings from raw JSON to a typed array.
 */
export async function fetchBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;

  // Transform: ensure key_learnings is always an array (database stores it as JSON)
  return (data || []).map((b) => ({
    ...b,
    key_learnings: Array.isArray(b.key_learnings) ? (b.key_learnings as unknown as KeyLesson[]) : [],
  }));
}

/**
 * Add a new book to the library.
 *
 * This does TWO things:
 * 1. Inserts the book into the database
 * 2. Calls an AI edge function to generate a summary and key learnings
 *    (then updates the book with the AI response)
 *
 * If the AI call fails, the book is still saved — just without a summary.
 */
export async function addBook(title: string, author: string, coverId?: number | null, editionKey?: string | null): Promise<Book> {
  const userId = await getUserId();

  // Step 1: Insert the book into the database
  const { data: book, error: insertError } = await supabase
    .from("books")
    .insert({ title, author, cover_id: coverId ?? null, user_id: userId })
    .select()   // Return the inserted row
    .single();  // We expect exactly one result
  if (insertError) throw insertError;

  // Step 2: Try to generate an AI summary (non-blocking — if it fails, we still return the book)
  try {
    // Call the "generate-book-summary" edge function (runs on the server)
    const { data: aiData, error: fnError } = await supabase.functions.invoke(
      "generate-book-summary",
      { body: { title, author } }
    );

    // If the AI succeeded, update the book with the summary and key learnings
    if (!fnError && aiData?.summary) {
      const { data: updated, error: updateError } = await supabase
        .from("books")
        .update({
          summary: aiData.summary,
          key_learnings: aiData.key_learnings || [],
        })
        .eq("id", book.id)  // Only update THIS specific book
        .select()
        .single();

      if (!updateError && updated) {
        return {
          ...updated,
          key_learnings: Array.isArray(updated.key_learnings) ? (updated.key_learnings as unknown as KeyLesson[]) : [],
        };
      }
    }
  } catch (e) {
    // If AI fails, log it but don't crash — the book is still saved
    console.error("Failed to generate summary:", e);
  }

  // Return the book even if AI summary generation failed
  return {
    ...book,
    key_learnings: Array.isArray(book.key_learnings) ? (book.key_learnings as unknown as KeyLesson[]) : [],
  };
}

/**
 * Delete a book from the database by its ID.
 */
export async function deleteBook(id: string): Promise<void> {
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Update just the personal notes for a specific book.
 */
export async function updateBookNotes(id: string, notes: string): Promise<void> {
  const { error } = await supabase.from("books").update({ notes }).eq("id", id);
  if (error) throw error;
}

/**
 * Update just the summary text for a specific book (used when editing manually).
 */
export async function updateBookSummary(id: string, summary: string): Promise<void> {
  const { error } = await supabase.from("books").update({ summary }).eq("id", id);
  if (error) throw error;
}

/**
 * Update the key learnings array for a specific book (used when editing manually).
 */
export async function updateBookKeyLearnings(id: string, keyLearnings: KeyLesson[]): Promise<void> {
  const { error } = await supabase
    .from("books")
    .update({ key_learnings: keyLearnings as unknown as any })
    .eq("id", id);
  if (error) throw error;
}

/**
 * Regenerate the AI summary for an existing book.
 * Calls the edge function again and overwrites the current summary + lessons.
 */
export async function regenerateBookSummary(id: string, title: string, author: string): Promise<Book> {
  const { data: aiData, error: fnError } = await supabase.functions.invoke(
    "generate-book-summary",
    { body: { title, author } }
  );
  if (fnError) throw fnError;

  const { data: updated, error: updateError } = await supabase
    .from("books")
    .update({
      summary: aiData.summary,
      key_learnings: aiData.key_learnings || [],
    })
    .eq("id", id)
    .select()
    .single();
  if (updateError) throw updateError;

  return {
    ...updated,
    key_learnings: Array.isArray(updated.key_learnings)
      ? (updated.key_learnings as unknown as KeyLesson[])
      : [],
  };
}

// ═══════════════════════════════════════════════
// ── CHAT HISTORY ──
// ═══════════════════════════════════════════════

/**
 * A "Chat" is a conversation. It has a title, a list of book IDs for context,
 * and timestamps for creation, updates, deletion (soft-delete), and pinning.
 */
export interface Chat {
  id: string;
  title: string;
  book_ids: string[];         // Which books provide context for this chat
  created_at: string;
  updated_at: string;
  deleted_at: string | null;  // If set, the chat is "archived" (soft-deleted)
  pinned_at: string | null;   // If set, the chat is pinned to the top
}

/**
 * A single message within a chat — either from the user or the AI assistant.
 */
export interface ChatMessage {
  id: string;
  chat_id: string;
  role: "user" | "assistant";  // Who sent this message
  content: string;
  created_at: string;
}

/**
 * Fetch all active (non-archived) chats, newest first.
 */
export async function fetchChats(): Promise<Chat[]> {
  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .is("deleted_at", null)  // Only get chats that haven't been archived
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return ((data || []) as any[]).map((c) => ({ ...c, pinned_at: c.pinned_at ?? null }));
}

/**
 * Fetch archived chats (ones that have been soft-deleted).
 */
export async function fetchArchivedChats(): Promise<Chat[]> {
  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .not("deleted_at", "is", null)  // Only get chats that HAVE been archived
    .order("deleted_at", { ascending: false });
  if (error) throw error;
  return ((data || []) as any[]).map((c) => ({ ...c, pinned_at: c.pinned_at ?? null, book_ids: Array.isArray(c.book_ids) ? c.book_ids : [] }));
}

/**
 * Create a new chat conversation.
 */
export async function createChat(title?: string, bookIds?: string[]): Promise<Chat> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("chats")
    .insert({ title: title || "New Chat", book_ids: bookIds || [], user_id: userId } as any)
    .select()
    .single();
  if (error) throw error;
  return { ...(data as any), book_ids: Array.isArray((data as any).book_ids) ? (data as any).book_ids : [] };
}

/**
 * Update which books provide context for a chat.
 */
export async function updateChatBookIds(id: string, bookIds: string[]): Promise<void> {
  const { error } = await supabase
    .from("chats")
    .update({ book_ids: bookIds } as any)
    .eq("id", id);
  if (error) throw error;
}

/**
 * Rename a chat (update its title).
 */
export async function updateChatTitle(id: string, title: string): Promise<void> {
  const { error } = await supabase.from("chats").update({ title }).eq("id", id);
  if (error) throw error;
}

/**
 * Archive a chat (soft-delete by setting deleted_at to now).
 * The chat still exists in the database but won't appear in the main list.
 */
export async function archiveChat(id: string): Promise<void> {
  const { error } = await supabase
    .from("chats")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/**
 * Restore an archived chat (clear its deleted_at timestamp).
 */
export async function restoreChat(id: string): Promise<void> {
  const { error } = await supabase
    .from("chats")
    .update({ deleted_at: null })
    .eq("id", id);
  if (error) throw error;
}

/**
 * Pin a chat to the top of the sidebar.
 */
export async function pinChat(id: string): Promise<void> {
  const { error } = await supabase
    .from("chats")
    .update({ pinned_at: new Date().toISOString() } as any)
    .eq("id", id);
  if (error) throw error;
}

/**
 * Unpin a chat (remove it from the top of the sidebar).
 */
export async function unpinChat(id: string): Promise<void> {
  const { error } = await supabase
    .from("chats")
    .update({ pinned_at: null } as any)
    .eq("id", id);
  if (error) throw error;
}

/**
 * Permanently delete a chat from the database (no recovery possible).
 */
export async function permanentlyDeleteChat(id: string): Promise<void> {
  const { error } = await supabase.from("chats").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Fetch all messages for a specific chat, in chronological order.
 */
export async function fetchChatMessages(chatId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as ChatMessage[];
}

/**
 * Save a new message (user or assistant) to a chat.
 */
export async function saveChatMessage(chatId: string, role: "user" | "assistant", content: string): Promise<ChatMessage> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ chat_id: chatId, role, content, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data as ChatMessage;
}

/**
 * Ask the AI to generate a short title for a chat based on the first message.
 * Falls back to truncating the message if the AI call fails.
 */
export async function generateChatTitle(message: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("generate-chat-title", {
    body: { message },
  });
  if (error) {
    console.error("Failed to generate title:", error);
    return message.slice(0, 40);  // Fallback: use first 40 characters
  }
  return data?.title || message.slice(0, 40);
}

// ═══════════════════════════════════════════════
// ── PROFILE ──
// ═══════════════════════════════════════════════

export interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch the current user's profile (name, avatar, etc.).
 */
export async function fetchProfile(): Promise<Profile> {
  const { data, error } = await supabase
    .from("profile")
    .select("*")
    .limit(1)      // We only expect one profile per user
    .single();     // Return a single object (not an array)
  if (error) throw error;
  return data as Profile;
}

/**
 * Update the user's profile (name and/or avatar URL).
 */
export async function updateProfile(
  id: string,
  updates: { name?: string; avatar_url?: string }
): Promise<void> {
  const { error } = await supabase
    .from("profile")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
}

/**
 * Upload an avatar image file to cloud storage and return its public URL.
 *
 * How it works:
 * 1. Generate a unique filename using the current timestamp
 * 2. Upload the file to the "avatars" storage bucket
 * 3. Get and return the public URL so it can be saved to the profile
 */
export async function uploadAvatar(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "png";  // Get file extension
  const path = `avatar-${Date.now()}.${ext}`;       // Create unique filename
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true });  // upsert = overwrite if exists
  if (error) throw error;

  // Get the public URL for the uploaded file
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

// ═══════════════════════════════════════════════
// ── STREAMING CHAT (Real-time AI responses) ──
// ═══════════════════════════════════════════════

type Msg = { role: "user" | "assistant"; content: string };

/**
 * Stream a chat response from the AI in real-time.
 *
 * Instead of waiting for the entire response, this function receives the
 * AI's answer chunk by chunk (like watching someone type). This is called
 * "streaming" and uses Server-Sent Events (SSE).
 *
 * @param messages - The conversation history to send to the AI
 * @param bookIds - Which books to use as context for the AI
 * @param onDelta - Called with each new chunk of text as it arrives
 * @param onDone - Called when the AI finishes its response
 */
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
  // Make a POST request to our chat edge function
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

  // Read the streaming response chunk by chunk
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();  // Converts raw bytes to text
  let buffer = "";                    // Accumulates partial data between chunks
  let streamDone = false;

  while (!streamDone) {
    // Read the next chunk from the stream
    const { done, value } = await reader.read();
    if (done) break;

    // Decode the chunk and add it to our buffer
    buffer += decoder.decode(value, { stream: true });

    // Process complete lines from the buffer
    // SSE format: each event is on its own line, prefixed with "data: "
    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);

      // Clean up the line and skip empty/comment lines
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      // Extract the JSON data after "data: "
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { streamDone = true; break; }  // AI finished

      try {
        // Parse the SSE event and extract the text content
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);  // Send the new text to the UI
      } catch {
        // If JSON parsing fails, put the line back in the buffer
        // (it might be a partial line that needs more data)
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  onDone();  // Signal that the stream is complete
}

// ═══════════════════════════════════════════════
// ── FEEDBACK ──
// ═══════════════════════════════════════════════

/**
 * Submit user feedback (bug report, suggestion, or general comment).
 */
export async function submitFeedback(
  message: string,
  category: "bug" | "suggestion" | "general"
): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase
    .from("feedback" as any)
    .insert({ user_id: userId, message, category } as any);
  if (error) throw error;
}
