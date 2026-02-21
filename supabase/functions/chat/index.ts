import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, bookIds } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase.from("books").select("id, title, author, summary, key_learnings");
    if (Array.isArray(bookIds) && bookIds.length > 0) {
      query = query.in("id", bookIds);
    }
    const { data: books } = await query;

    const bookContext = books?.length
      ? books
          .map(
            (b) =>
              `📖 [ID: ${b.id}] "${b.title}" by ${b.author}\nSummary: ${b.summary}\nKey Learnings: ${
                Array.isArray(b.key_learnings) ? b.key_learnings.join("; ") : ""
              }`
          )
          .join("\n\n")
      : "No books in the library yet.";

    const systemPrompt = `You are BookMind, a knowledgeable AI assistant that helps users revise and recall knowledge from books they've read. You have access to the user's book library.

Here are the books in the user's library:

${bookContext}

Guidelines:
- Answer questions based on the books in the library
- Help users recall key concepts, compare ideas across books, and deepen understanding
- If asked about a book not in the library, let them know and offer general knowledge
- Be concise but thorough
- Use markdown formatting for readability
- **IMPORTANT**: When referencing information from a book, always mention the specific chapter, section, or part of the book where the concept can be found. For example: "*(Chapter 3: The Four Laws of Behavior Change, Atomic Habits)*"
- If you're unsure of the exact chapter, provide your best estimate based on the book's typical structure and note it as approximate
- When listing key learnings or concepts, attribute each to its source book and chapter/section
- Use relevant emojis at the start of section headings and key bullet points to make responses visually engaging and easier to scan (e.g. 📚, 💡, 🔑, ✅, 🧠, 📝)`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
