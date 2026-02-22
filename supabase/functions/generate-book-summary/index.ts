import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TOCEntry {
  title: string;
  level?: number;
}

async function fetchEditionTOC(editionKey: string): Promise<TOCEntry[]> {
  try {
    const resp = await fetch(`https://openlibrary.org/books/${editionKey}.json`);
    if (!resp.ok) return [];
    const data = await resp.json();
    const toc = data.table_of_contents;
    if (!Array.isArray(toc) || toc.length === 0) return [];
    return toc
      .filter((entry: any) => entry.title && entry.title.trim())
      .map((entry: any) => ({
        title: entry.title.trim(),
        level: entry.level ?? 0,
      }));
  } catch {
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, author, editionKey } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Try to fetch real chapter data from Open Library
    let realChapters: TOCEntry[] = [];
    if (editionKey) {
      realChapters = await fetchEditionTOC(editionKey);
      console.log(`Fetched ${realChapters.length} TOC entries for edition ${editionKey}`);
    }

    const hasRealChapters = realChapters.length > 0;

    // Build the system prompt based on whether we have real chapters
    let systemPrompt: string;
    let userPrompt: string;

    if (hasRealChapters) {
      const chapterList = realChapters
        .map((ch, i) => `${i + 1}. ${ch.title}`)
        .join("\n");

      systemPrompt = `You are a book expert. For the book "${title}" by ${author}, provide:
1. A concise summary (2-3 paragraphs)
2. 5-7 key learnings/takeaways as an array
3. For EACH chapter listed below, write a 2-3 sentence summary. Use the exact chapter titles provided. Do NOT skip any chapters.

Only respond with the JSON via the tool call, no other text.`;

      userPrompt = `Real chapters from the book:
${chapterList}`;
    } else {
      systemPrompt = `You are a book expert. For the book "${title}" by ${author}, provide:
1. A concise summary (2-3 paragraphs)
2. 5-7 key learnings/takeaways as an array
3. A COMPLETE chapter-by-chapter breakdown. You MUST include ALL chapters — do NOT skip any. Double-check that every chapter is listed. Each chapter needs its number, title, and a brief summary (2-3 sentences).

Only respond with the JSON via the tool call, no other text.`;

      userPrompt = `Generate the complete summary and chapter breakdown for this book.`;
    }

    const model = "openai/gpt-5.2";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "book_summary",
              description: "Return a book summary and key learnings",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "A 2-3 paragraph summary of the book" },
                  key_learnings: {
                    type: "array",
                    items: { type: "string" },
                    description: "5-7 key takeaways from the book",
                  },
                  chapters: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        number: { type: "number", description: "Chapter number" },
                        title: { type: "string", description: "Chapter title" },
                        summary: { type: "string", description: "Brief 2-3 sentence summary of the chapter" },
                      },
                      required: ["number", "title", "summary"],
                    },
                    description: "Chapter-by-chapter breakdown of the book",
                  },
                },
                required: ["summary", "key_learnings", "chapters"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "book_summary" } },
      }),
    });

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
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try parsing content directly
    const content = data.choices?.[0]?.message?.content || "";
    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
