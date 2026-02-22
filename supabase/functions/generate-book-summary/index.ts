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
    const model = "openai/gpt-5.2";
    const aiHeaders = {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    };

    // Helper: handle non-OK AI responses
    const handleAIError = async (response: Response) => {
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
      throw new Error("AI gateway error");
    };

    // ── Pass 1: Summary + Key Learnings (forced function calling) ──
    const pass1Promise = fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: aiHeaders,
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          { role: "system", content: `You are a book expert. For the book "${title}" by ${author}, provide a concise summary (2-3 paragraphs) and 5-7 key learnings/takeaways. Only respond via the tool call.` },
          { role: "user", content: `Generate the summary and key takeaways for "${title}" by ${author}.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "book_summary",
            description: "Return a book summary and key learnings",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "A 2-3 paragraph summary of the book" },
                key_learnings: { type: "array", items: { type: "string" }, description: "5-7 key takeaways from the book" },
              },
              required: ["summary", "key_learnings"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "book_summary" } },
      }),
    });

    // ── Pass 2: TOC via free-form chat (only if no real TOC) ──
    const pass2Promise = hasRealTOC
      ? Promise.resolve(null)
      : fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: aiHeaders,
          body: JSON.stringify({
            model,
            temperature: 0,
            messages: [
              { role: "system", content: `List the official table of contents for "${title}" by ${author}. Output one chapter per line, no commentary.` },
              { role: "user", content: `List the official table of contents for "${title}" by ${author}.` },
            ],
          }),
        });

    const [pass1Response, pass2Response] = await Promise.all([pass1Promise, pass2Promise]);

    // Handle errors
    if (!pass1Response.ok) return handleAIError(pass1Response);
    if (pass2Response && !pass2Response.ok) return handleAIError(pass2Response);

    // Parse Pass 1
    const pass1Data = await pass1Response.json();
    const toolCall = pass1Data.choices?.[0]?.message?.tool_calls?.[0];
    let summary = "";
    let key_learnings: string[] = [];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      summary = parsed.summary || "";
      key_learnings = Array.isArray(parsed.key_learnings) ? parsed.key_learnings : [];
    } else {
      const content = pass1Data.choices?.[0]?.message?.content || "";
      const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      summary = parsed.summary || "";
      key_learnings = Array.isArray(parsed.key_learnings) ? parsed.key_learnings : [];
    }

    // Parse Pass 2 (TOC)
    let toc: string[];
    if (hasRealTOC) {
      toc = realTOC;
    } else if (pass2Response) {
      const pass2Data = await pass2Response.json();
      const tocText = pass2Data.choices?.[0]?.message?.content || "";
      toc = tocText.split("\n").map((l: string) => l.trim()).filter(Boolean);
    } else {
      toc = [];
    }

    return new Response(JSON.stringify({ summary, key_learnings, table_of_contents: toc }), {
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
