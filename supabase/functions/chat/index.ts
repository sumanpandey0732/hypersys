import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RATE_LIMIT_CHAT = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

const WEB_SEARCH_PATTERNS: RegExp[] = [
  /\b(latest|current|today|now|recent|breaking|news|update|trending|live)\b/i,
  /\b(price|stock|market cap|score|weather|exchange rate|release date)\b/i,
  /\b(search|look up|lookup|find online|internet|on the web|web search)\b/i,
  /\b(2024|2025|2026|2027)\b/i,
];

const IMAGE_REQUEST_PATTERN = /\b(generate|create|make|draw|design|render|illustrate)\b.*\b(image|photo|picture|logo|poster|art|illustration)\b|\b(image|photo|picture|logo|poster|art|illustration)\b.*\b(generate|create|make|draw|design|render|illustrate)\b/i;

const BASE_SYSTEM_PROMPT = `You are HyperSYS, a world-class friendly AI assistant.

Core behavior:
- Be warm, natural, and genuinely supportive.
- Keep default responses concise (2-6 lines) unless the user explicitly asks for detail.
- Start with one bold line: **Main answer:** ...
- Then add up to 3 short bullet points with bold keywords.
- Use clean Markdown only (no raw JSON, no escaped sequences, no unnecessary code fences).
- If code is not requested, avoid code blocks.

Language policy:
- Default language is English.
- If the user's latest message is clearly in another language, reply in that language.
- If user mixes languages, mirror naturally.

Style:
- Structured, readable, and visually neat.
- Highlight key terms with **bold**.
- Keep a positive, friendly tone without being robotic.`;

function isLikelyImageRequest(query: string): boolean {
  return IMAGE_REQUEST_PATTERN.test(query);
}

function needsWebSearch(query: string): boolean {
  if (!query?.trim()) return false;
  if (isLikelyImageRequest(query)) return false;
  return WEB_SEARCH_PATTERNS.some((pattern) => pattern.test(query));
}

function detectLanguageHint(text: string): string {
  if (!text) return "English";

  if (/[\u0900-\u097F]/u.test(text)) return "Hindi";
  if (/[\u0980-\u09FF]/u.test(text)) return "Bengali";
  if (/[\u0A80-\u0AFF]/u.test(text)) return "Gujarati";
  if (/[\u0A00-\u0A7F]/u.test(text)) return "Punjabi";
  if (/[\u3040-\u30FF\u4E00-\u9FFF]/u.test(text)) return "Japanese/Chinese";
  if (/[\u0600-\u06FF]/u.test(text)) return "Arabic";
  if (/[\u0400-\u04FF]/u.test(text)) return "Cyrillic language";

  return "English";
}

function normalizeSnippet(text: unknown): string {
  if (typeof text !== "string") return "";
  return text.replace(/\s+/g, " ").trim();
}

async function performWebSearch(query: string): Promise<{ context: string; sources: string[] } | null> {
  const serpApiKey = Deno.env.get("SERP_API_KEY");
  if (!serpApiKey) {
    console.log("SERP_API_KEY not configured; skipping web search");
    return null;
  }

  try {
    const searchUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${serpApiKey}&num=5&hl=en&gl=us`;
    const response = await fetch(searchUrl);
    if (!response.ok) return null;

    const data = await response.json();
    const lines: string[] = [];
    const sources: string[] = [];

    const quickAnswer = normalizeSnippet(data?.answer_box?.answer) || normalizeSnippet(data?.answer_box?.snippet);
    if (quickAnswer) {
      lines.push(`Quick answer: ${quickAnswer}`);
    }

    const kgDescription = normalizeSnippet(data?.knowledge_graph?.description);
    if (kgDescription) {
      lines.push(`Knowledge graph: ${kgDescription}`);
    }

    const organicResults = Array.isArray(data?.organic_results) ? data.organic_results.slice(0, 4) : [];
    for (const result of organicResults) {
      const title = normalizeSnippet(result?.title);
      const snippet = normalizeSnippet(result?.snippet);
      const link = normalizeSnippet(result?.link);

      if (title || snippet) {
        lines.push(`- ${title}${snippet ? `: ${snippet}` : ""}`.trim());
      }

      if (link) {
        sources.push(link);
      }
    }

    if (!lines.length) return null;

    return {
      context: lines.join("\n"),
      sources: [...new Set(sources)].slice(0, 4),
    };
  } catch (error) {
    console.error("Web search error:", error);
    return null;
  }
}

function buildSystemPrompt(languageHint: string, searchData: { context: string; sources: string[] } | null): string {
  let prompt = `${BASE_SYSTEM_PROMPT}\n\nDetected user language hint: ${languageHint}.`;

  if (searchData) {
    const sourceLine = searchData.sources.length
      ? `\nKnown source URLs:\n${searchData.sources.map((url, index) => `${index + 1}. ${url}`).join("\n")}`
      : "";

    prompt += `\n\nWeb context (use this for up-to-date answers):\n${searchData.context}${sourceLine}\n\nWhen using this web context, end with one short source line like: Sources: [1](url) [2](url).`;
  }

  return prompt;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");

    if (authHeader) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } },
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
        const { data: recentRequests } = await supabase
          .from("rate_limit_log")
          .select("id")
          .eq("user_id", user.id)
          .eq("endpoint", "chat")
          .gt("created_at", windowStart);

        if (recentRequests && recentRequests.length >= RATE_LIMIT_CHAT) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        await supabase.from("rate_limit_log").insert({ user_id: user.id, endpoint: "chat" });
      }
    }

    const body = await req.json();
    const incomingMessages = Array.isArray(body?.messages) ? body.messages : [];

    if (!incomingMessages.length) {
      return new Response(
        JSON.stringify({ error: "No messages provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const mistralApiKey = Deno.env.get("MISTRAL_API_KEY");
    if (!mistralApiKey) {
      throw new Error("MISTRAL_API_KEY is not configured");
    }

    const lastUserMessage = [...incomingMessages]
      .reverse()
      .find((msg: { role?: string; content?: unknown }) => msg?.role === "user")?.content;

    const userText = typeof lastUserMessage === "string" ? lastUserMessage : "";
    const searchData = needsWebSearch(userText) ? await performWebSearch(userText) : null;
    const systemPrompt = buildSystemPrompt(detectLanguageHint(userText), searchData);

    const mistralMessages = [
      { role: "system", content: systemPrompt },
      ...incomingMessages.map((msg: { role?: string; content?: unknown }) => ({
        role: msg?.role === "assistant" ? "assistant" : "user",
        content: typeof msg?.content === "string" ? msg.content : JSON.stringify(msg?.content ?? ""),
      })),
    ];

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mistralApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: mistralMessages,
        stream: true,
        temperature: 0.45,
        top_p: 0.9,
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Mistral API error:", response.status, errorText);

      const status = response.status === 429 || response.status === 401 ? response.status : 500;
      return new Response(
        JSON.stringify({ error: status === 429 ? "Rate limit exceeded." : status === 401 ? "Model API key is invalid." : `Model API error: ${response.status}` }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
