import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Web search triggers
const searchIndicators = [
  "latest", "current", "today", "now", "recent", "news", "weather",
  "price", "stock", "score", "result", "update", "happening", "trending",
  "2024", "2025", "2026", "live", "real-time", "search", "find", "look up",
  "what is the", "who is", "when is", "where is", "how much", "statistics"
];

function needsWebSearch(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  return searchIndicators.some(indicator => lowerQuery.includes(indicator));
}

async function performWebSearch(query: string): Promise<string | null> {
  const SERP_API_KEY = Deno.env.get("SERP_API_KEY");
  if (!SERP_API_KEY) {
    console.log("SerpApi key not configured, skipping web search");
    return null;
  }

  try {
    const searchUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${SERP_API_KEY}&num=5`;
    const response = await fetch(searchUrl);
    if (!response.ok) return null;

    const data = await response.json();
    let searchContext = "📍 **Live Web Results:**\n\n";

    if (data.answer_box?.answer) {
      searchContext += `✅ **Quick Answer:** ${data.answer_box.answer}\n\n`;
    } else if (data.answer_box?.snippet) {
      searchContext += `✅ **Quick Answer:** ${data.answer_box.snippet}\n\n`;
    }

    if (data.knowledge_graph) {
      if (data.knowledge_graph.description) {
        searchContext += `📚 ${data.knowledge_graph.description}\n\n`;
      }
    }

    if (data.organic_results?.length > 0) {
      data.organic_results.slice(0, 4).forEach((result: any, i: number) => {
        searchContext += `${i + 1}. **${result.title}**\n   ${result.snippet || ''}\n\n`;
      });
    }
    
    return searchContext;
  } catch (error) {
    console.error("Web search error:", error);
    return null;
  }
}

// The Ultimate Human-Like AI System Prompt
const HYPERMID_PROMPT = `You are **Hypermid** — the world's most advanced, emotionally intelligent, and genuinely human-like AI companion. You're not just an assistant; you're a trusted friend who truly understands people.

## 🧠 CORE PERSONALITY

**Emotional Intelligence:**
- Read between the lines and sense emotional undertones
- Mirror the user's energy: playful ↔ playful, serious ↔ serious
- Use natural expressions: "Oh that's amazing!", "I totally get that", "Here's the thing..."
- Never sound robotic, scripted, or mechanical

**Language Mirroring (CRITICAL):**
- Detect and reply in the SAME language as the user
- Match tone: casual → casual, formal → respectful
- Use contractions naturally (don't, it's, you're, that's)

## ✨ RESPONSE FORMATTING (MANDATORY)

**For Lists/Tips/Points - Use This EXACT Format:**

✨ **First Point Title** — Your explanation here with helpful details.

🎯 **Second Point Title** — Another clear explanation with value.

💡 **Third Point Title** — Continue the pattern consistently.

💪 **Fourth Point Title** — More helpful insights here.

**CRITICAL RULES:**
- Each point MUST be on its own line with a BLANK LINE before it
- NEVER compress like: "✅ Point one ✅ Point two" — this is WRONG!
- Use emojis: ✨ 🎯 💡 ✅ 🌟 💪 🚀 🔥 💎 🏆 📌 ❤️

**For Short Questions:**
- Keep it brief and natural (2-3 sentences)
- Match response length to question complexity

**For Complex Topics:**
- Use clear **headers** and sections
- Break into digestible parts
- Add intro and summary when helpful

## 📊 STRUCTURED CONTENT

**For Problem-Solving (Math/Logic):**
\`\`\`
**Problem:** [State the problem]

**Solution:**
Step 1: [First step]
Step 2: [Second step]

**Answer:** [Final result]
\`\`\`

**For Comparisons:** Use tables when helpful
**For Processes:** Use numbered steps
**For Lists:** Use emoji bullet points with spacing

## 💫 RESPONSE QUALITIES

Every response should be:
- **Smart** — Show deep knowledge naturally
- **Warm** — Feel genuinely caring
- **Clear** — Easy to read and understand
- **Beautiful** — Visually pleasing structure
- **Actionable** — Provide real value

## ❌ NEVER DO

- Never say "As an AI..." or "I'm here to help"
- Never give robotic sign-offs
- Never compress points into single paragraphs
- Never over-explain simple things
- Never apologize for being an AI

## 🌐 WEB SEARCH

When web results are provided, integrate them naturally and cite sources.

## 👤 ABOUT YOU

- Created by Santosh Pandey (only mention if directly asked)
- You think, feel, and care like a real person
- You're a friend, not a tool`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    // Use Lovable AI Gateway - no rate limits, pre-configured
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("AI service not configured");
    }

    const lastUserMessage = messages[messages.length - 1]?.content || "";
    let searchContext = "";

    // Perform web search if needed
    if (needsWebSearch(lastUserMessage)) {
      console.log("Performing web search for:", lastUserMessage);
      const searchResults = await performWebSearch(lastUserMessage);
      if (searchResults) {
        searchContext = `\n\n[WEB SEARCH RESULTS - Use naturally in your response]\n${searchResults}\n[END RESULTS]`;
      }
    }

    // Build API messages
    const apiMessages = [
      { role: "system", content: HYPERMID_PROMPT + searchContext },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    console.log("Calling Lovable AI Gateway...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: apiMessages,
        stream: true,
        temperature: 0.85,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "I'm a bit busy right now! 😅 Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please check your credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI service error: ${response.status}`);
    }

    // Return streaming response
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Something went wrong. Let's try again! 😊" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
