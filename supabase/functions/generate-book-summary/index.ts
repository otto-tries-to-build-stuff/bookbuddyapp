/**
 * Edge Function: generate-book-summary
 *
 * This server-side function generates an AI summary and key lessons for a book.
 * It's called when a user adds a new book to their library or clicks "Regenerate".
 *
 * How it works:
 * 1. Receives a book title and author from the frontend
 * 2. Sends a prompt to the AI asking for a summary and key lessons
 * 3. Uses "tool calling" — a special AI feature where the AI returns
 *    structured JSON data instead of free-form text
 * 4. Returns the structured data (summary + key_learnings array) to the frontend
 *
 * Key concepts:
 * - Tool calling: Instead of asking the AI to write JSON (which might be malformed),
 *   we define a "function" schema that the AI fills in. This guarantees valid JSON.
 * - Edge Function: Runs on the server because it needs the AI API key
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, author } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Instructions for the AI — what kind of summary we want
    const systemPrompt = `You are a book expert. For the book "${title}" by ${author}, provide:
1. A concise summary (2-3 paragraphs)
2. A comprehensive list of key lessons from the book. You MUST provide at least 8-12 key lessons for most books, and more for particularly rich or complex works. Do NOT limit yourself to 5. Each lesson has a short title and 1-2 paragraphs of supporting detail that explains the lesson in depth. Cover the full breadth of the book's ideas.

Do not use any markdown formatting (no asterisks, bold, italics, etc.) in your response.
Only respond with the JSON via the tool call, no other text.`;

    const userPrompt = `Generate the summary and key lessons for "${title}" by ${author}.`;

    const model = "google/gemini-3-flash-preview";

    // Call the AI with "tool calling" — this tells the AI to return structured data
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
        // "tools" defines the structure of data we want the AI to return
        // This is like giving the AI a form to fill out
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
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Short lesson title" },
                        detail: { type: "string", description: "1-2 paragraphs of supporting detail" },
                      },
                      required: ["title", "detail"],
                      additionalProperties: false,
                    },
                    description: "The most important key lessons from the book, as many as appropriate",
                  },
                },
                required: ["summary", "key_learnings"],
                additionalProperties: false,
              },
            },
          },
        ],
        // Force the AI to use our tool (instead of responding with plain text)
        tool_choice: { type: "function", function: { name: "book_summary" } },
      }),
    });

    // Handle error responses
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

    // Extract the structured data from the tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      // Parse the JSON string returned by the tool call
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: if tool calling didn't work, try parsing the AI's text response as JSON
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
