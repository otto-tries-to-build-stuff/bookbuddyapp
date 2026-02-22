import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function fetchEditionTOC(editionKey: string): Promise<string[]> {
  try {
    const resp = await fetch(`https://openlibrary.org/books/${editionKey}.json`);
    if (!resp.ok) return [];
    const data = await resp.json();
    const toc = data.table_of_contents;
    if (!Array.isArray(toc) || toc.length === 0) return [];
    return toc.filter((entry: any) => entry.title && entry.title.trim()).map((entry: any) => entry.title.trim());
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

    // Try to fetch real TOC from Open Library
    let realTOC: string[] = [];
    if (editionKey) {
      realTOC = await fetchEditionTOC(editionKey);
      console.log(`Fetched ${realTOC.length} TOC entries for edition ${editionKey}`);
    }

    const hasRealTOC = realTOC.length > 0;

    let systemPrompt: string;
    let userPrompt: string;

    if (hasRealTOC) {
      systemPrompt = `You are a book expert. For the book "${title}" by ${author}, provide:
1. A concise summary (2-3 paragraphs)
2. 5-7 key learnings/takeaways as an array

The table of contents has already been provided — do NOT generate one. Only respond with the JSON via the tool call, no other text.`;

      userPrompt = `Generate the summary and key takeaways for "${title}" by ${author}.`;
    } else {
      systemPrompt = `You are a book expert. For the book "${title}" by ${author}, provide:
1. A concise summary (2-3 paragraphs)
2. 5-7 key learnings/takeaways as an array
3. The officially published table of contents

Only respond with the JSON via the tool call, no other text.`;

      userPrompt = `You are a book expert. For the book "${title}" by ${author}, provide:
1. A concise summary (2-3 paragraphs)
2. 5-7 key learnings/takeaways as an array
3. The officially published table of contents`;
    }

    const model = "openai/gpt-5.2";

    const tocProperty = hasRealTOC
      ? {}
      : {
          table_of_contents: {
            type: "string",
            description: "A structured text block listing all chapters, one per line. No disclaimers or caveats.",
          },
        };

    const requiredFields = hasRealTOC
      ? ["summary", "key_learnings"]
      : ["summary", "key_learnings", "table_of_contents"];

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
                  ...tocProperty,
                },
                required: requiredFields,
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

    // Convert TOC to array of strings regardless of source
    const toTocArray = (toc: any): string[] => {
      if (Array.isArray(toc)) return toc;
      if (typeof toc === "string")
        return toc
          .split("\n")
          .map((l: string) => l.trim())
          .filter(Boolean);
      return [];
    };

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      const toc = hasRealTOC ? realTOC : toTocArray(parsed.table_of_contents);
      return new Response(JSON.stringify({ ...parsed, table_of_contents: toc }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try parsing content directly
    const content = data.choices?.[0]?.message?.content || "";
    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    const toc = hasRealTOC ? realTOC : toTocArray(parsed.table_of_contents);

    return new Response(JSON.stringify({ ...parsed, table_of_contents: toc }), {
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
