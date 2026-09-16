/**
 * Edge Function: chat
 *
 * A server-side function that handles AI chat conversations.
 * It runs on the server (not in the browser) because it needs access
 * to the AI API key and database service role key.
 *
 * What it does:
 * 1. Checks WHO is asking (from their login token) — so we only ever
 *    load THAT person's books, never anyone else's
 * 2. Loads the selected books as "reference points" (not the sole source)
 * 3. Sends the conversation to a strong AI model that can also SEARCH
 *    THE WEB — like ChatGPT or Claude do — when it needs real facts
 * 4. Streams the AI's response back to the frontend in real-time
 *
 * Key concepts:
 * - Edge Function: A serverless function that runs close to the user
 * - CORS headers: Required to allow the frontend (different domain) to call this function
 * - Streaming: The response is sent back chunk-by-chunk using Server-Sent Events (SSE)
 * - Web search tool: The AI can look things up on the internet mid-answer
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers allow the frontend to call this function from a different domain
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // Handle CORS preflight requests (browsers send these before the actual request)
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Parse the request body — contains the conversation messages and book IDs
    const { messages, bookIds } = await req.json();

    // Get the AI API key from environment variables (stored securely on the server)
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // ── Figure out who is asking ──
    // The browser sends the user's login token in the Authorization header.
    // We ask Supabase to verify it, so we can never be fooled by a fake token.
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Not signed in" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the token and get the user's ID
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Not signed in" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // ── Load the user's OWN books as reference context ──
    // We filter by user_id so a user can never see another user's books,
    // and so the AI isn't distracted by books that aren't theirs.
    // If specific book IDs were selected in the chat, only fetch those
    // (still scoped to this user).
    let query = supabase
      .from("books")
      .select("id, title, author, summary, key_learnings")
      .eq("user_id", userId);
    if (Array.isArray(bookIds) && bookIds.length > 0) {
      query = query.in("id", bookIds);
    }
    const { data: books } = await query;

    // Format book data into a readable string for the AI.
    // The summary is APP-GENERATED and may be incomplete — the prompt tells
    // the AI to treat it as background, not as the source of truth.
    const bookContext = books?.length
      ? books
          .map((b) => {
            const learnings = Array.isArray(b.key_learnings)
              ? b.key_learnings.map((l: any) => `  - ${l.title}: ${l.detail}`).join("\n")
              : "";
            return `📖 "${b.title}" by ${b.author}\nSummary (app-generated, may be incomplete): ${b.summary ?? "none yet"}${learnings ? `\nKey Lessons:\n${learnings}` : ""}`;
          })
          .join("\n\n")
      : "No books in the library yet.";

    // System prompt — tells the AI who it is and how to behave
    const systemPrompt = `You are BookBuddy, a knowledgeable AI assistant that helps users understand, revise and recall knowledge from books they've read. You have web search available and should use it like ChatGPT or Claude would.

The books below are the REFERENCE POINT for the conversation. Their summaries are app-generated aids and may be incomplete or miss details — they are background, not the final authority.

Books in the user's library:

${bookContext}

How to answer:
- Treat the selected/mentioned books as the topic of discussion. Use the summaries as a starting point, not as a limit.
- When a question needs a fact you are not certain about — a term, acronym, quote, event, name, or anything book-specific that isn't fully covered in the summaries above — SEARCH THE WEB before answering, then answer from what you find.
- You may also use your own general knowledge (like ChatGPT does), especially for well-known books and authors.
- Be honest about sourcing: make clear whether an answer comes from the user's library summary, your general knowledge, or a web source (include links for web results). If something genuinely can't be found or confirmed, SAY SO — never invent an acronym expansion, quote, or fact.

Scope guardrails:
- Stay within the world of books, reading, and the ideas in the user's library
- Do NOT answer questions completely unrelated to books or the ideas in them — for example: coding help, math homework, news, weather, medical/legal/financial advice, or writing emails
- When asked something out of scope, politely decline and redirect, e.g. "That's outside what I can help with, but I'd love to tell you about the books in your library! 📚"
- When in doubt, ERR ON THE SIDE OF ANSWERING: questions about a book's themes, or about APPLYING lessons from the books to the user's life, are always welcome

Style:
- Be concise but thorough
- Use markdown formatting for readability
- When referencing ideas, cite the book title. For example: "*(Atomic Habits)*"
- When listing key learnings or concepts, attribute each to its source book
- Don't provide any responses in a table format.
- Use relevant emojis at the start of section headings and key bullet points to make responses visually engaging and easier to scan (e.g. 📚, 💡, 🔑, ✅, 🧠, 📝)`;

    // ── Build the message list for the AI ──
    // The frontend sends the full conversation as simple {role, content}
    // objects. The Responses API wants them wrapped in typed content parts:
    // user messages use "input_text", assistant messages use "output_text".
    const input = (Array.isArray(messages) ? messages : [])
      .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m: any) => ({
        role: m.role,
        content: [
          {
            type: m.role === "user" ? "input_text" : "output_text",
            text: m.content,
          },
        ],
      }));

    // ── Call the AI ──
    // We use the gateway's Responses API with:
    // - openai/gpt-5.6-sol: a strong model (much better than the previous small one)
    // - tools: [{ type: "web_search" }]: lets the AI search the internet mid-answer
    // - stream: true: the answer is sent back chunk by chunk
    // - store: false: required — the gateway is stateless, we resend history each time
    // - reasoning: lets the model "think" before answering for better accuracy
    const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        instructions: systemPrompt,
        input,
        stream: true,
        store: false,
        tools: [{ type: "web_search" }],
        reasoning: { effort: "medium", summary: "auto" },
      }),
    });

    // Handle error responses from the AI
    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      // Rate limit and credits errors are passed through with their real
      // status so the frontend can show a useful message
      if (response.status === 429 || response.status === 402) {
        let msg = "AI request failed, please try again later.";
        try {
          msg = JSON.parse(t).message ?? msg;
        } catch { /* keep default */ }
        return new Response(JSON.stringify({ error: msg }), {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pass the streaming response directly back to the frontend.
    // The stream uses Responses SSE events (e.g. response.output_text.delta),
    // which the frontend's streamChat function knows how to read.
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
