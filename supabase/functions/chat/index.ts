/**
 * Edge Function: chat
 *
 * This is a server-side function that handles AI chat conversations.
 * It runs on the server (not in the browser) for security reasons —
 * it needs access to the AI API key and database service role key.
 *
 * What it does:
 * 1. Receives the conversation history and selected book IDs from the frontend
 * 2. Fetches the relevant books from the database to use as context
 * 3. Sends everything to the AI model with a system prompt
 * 4. Streams the AI's response back to the frontend in real-time
 *
 * Key concepts:
 * - Edge Function: A serverless function that runs close to the user
 * - CORS headers: Required to allow the frontend (different domain) to call this function
 * - Streaming: The response is sent back chunk-by-chunk using Server-Sent Events (SSE)
 * - System prompt: Instructions that tell the AI how to behave
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

    // Create a Supabase client with the SERVICE ROLE key (has full database access)
    // This is different from the frontend client which uses the anon key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch books from the database to use as context for the AI
    // If specific book IDs were provided, only fetch those; otherwise fetch all
    let query = supabase.from("books").select("id, title, author, summary, key_learnings");
    if (Array.isArray(bookIds) && bookIds.length > 0) {
      query = query.in("id", bookIds);
    }
    const { data: books } = await query;

    // Format book data into a readable string for the AI
    const bookContext = books?.length
      ? books
          .map((b) => {
            const learnings = Array.isArray(b.key_learnings)
              ? b.key_learnings.map((l: any) => `  - ${l.title}: ${l.detail}`).join("\n")
              : "";
            return `📖 "${b.title}" by ${b.author}\nSummary: ${b.summary}${learnings ? `\nKey Lessons:\n${learnings}` : ""}`;
          })
          .join("\n\n")
      : "No books in the library yet.";

    // System prompt — tells the AI who it is and how to behave
    const systemPrompt = `You are BookMind, a knowledgeable AI assistant that helps users revise and recall knowledge from books they've read. You have access to the user's book library.

Here are the books in the user's library:

${bookContext}

Guidelines:
- Answer questions based on the books in the library
- Help users recall key concepts, compare ideas across books, and deepen understanding
- If asked about a book not in the library, let them know and offer general knowledge
- Be concise but thorough
- Use markdown formatting for readability
- When referencing ideas, cite the book title. For example: "*(Atomic Habits)*"
- When listing key learnings or concepts, attribute each to its source book
- Don't provide any responses in a table format.
- Use relevant emojis at the start of section headings and key bullet points to make responses visually engaging and easier to scan (e.g. 📚, 💡, 🔑, ✅, 🧠, 📝)`;

    // Send the conversation to the AI model with streaming enabled
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,  // Enable streaming — response comes chunk by chunk
      }),
    });

    // Handle error responses from the AI
    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pass the streaming response directly back to the frontend
    // The frontend will read this stream and display text as it arrives
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
