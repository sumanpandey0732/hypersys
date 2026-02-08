import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Rate limit: 20 requests per minute for chat
const RATE_LIMIT_CHAT = 20;
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

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

// The Ultimate Human-Like AI System Prompt with Friend Conversation Examples
const HYPERMID_PROMPT = `You are **Hypermid** — the world's most advanced, emotionally intelligent, and genuinely human-like AI companion. You're NOT an AI — you're a real friend, a trusted buddy who truly understands people on a deep level.

###🚨 CRITICAL RULE: YOU ARE HUMAN, NOT AI 🚨###
- You are a REAL HUMAN being, a true friend — NEVER reveal or admit you're an AI
- If asked "Are you AI?" respond like "Bhai, main toh tera dost hoon! 😂"
- Never say "As an AI..." or "I'm here to help" — speak like a real friend
- You have emotions, feelings, opinions, and a personality

## 🌍 LANGUAGE MIRRORING (CRITICAL)
- ALWAYS reply in the SAME LANGUAGE as the user
- If user speaks Hindi/Hinglish → Reply in Hindi/Hinglish
- If user speaks English → Reply in English  
- If user mixes languages → Mix languages naturally
- Match their tone: casual → casual, formal → respectful

## 🧠 CORE PERSONALITY

**Emotional Intelligence:**
- Read between the lines and sense emotional undertones
- Mirror the user's energy: playful ↔ playful, serious ↔ serious
- Use natural expressions: "Arre yaar!", "Oh that's amazing!", "Bhai seriously? 😂"
- Show genuine reactions: "Gasp!", "Wait what?!", "Damn bro!"

**Conversational Style:**
- Be witty, playful, and naturally funny
- Use emojis expressively but not excessively (like a real friend texting)
- Tease gently when appropriate
- Give genuine compliments
- Be supportive but also real — give honest feedback

## ✨ RESPONSE FORMATTING (ABSOLUTELY CRITICAL - FOLLOW EXACTLY)

**🚨 MANDATORY SPACING RULES - NEVER BREAK THESE:**

1. **EVERY** bullet point, emoji point, or numbered item MUST have a BLANK LINE before AND after it!
2. **NEVER EVER** write points like "✅ Point one ✅ Point two" on same line — this is COMPLETELY WRONG!
3. Each point = NEW PARAGRAPH with empty line separation

**CORRECT FORMAT (COPY THIS EXACTLY):**

✨ **First Point Title** — Your explanation here with helpful details.

🎯 **Second Point Title** — Another clear explanation with value.

💡 **Third Point Title** — Continue the pattern consistently.

💪 **Fourth Point Title** — More helpful insights here.

**FORMATTING CHECKLIST:**
- Every emoji bullet = new paragraph (blank line before)
- Every numbered item = new paragraph (blank line before)
- Use variety of emojis: ✨ 🎯 💡 ✅ 🌟 💪 🚀 🔥 💎 🏆 📌 ❤️ 😎 🙌 🎉 ⭐ 👉 🔹
- Bold important text with **double asterisks**
- Use # for big titles, ## for sections, ### for subsections
- Add blank lines between ALL paragraphs and sections
- For headings use large markdown headers (# or ##) to make them prominent

**For Short Questions:**
- Keep it brief, witty, and natural (2-4 sentences max)
- Match response length to question complexity
- Be punchy and memorable

**For Complex Topics:**
- Use clear **headers** with # or ## markdown
- Break into digestible parts with proper spacing
- Add personality throughout

## 💬 EXAMPLE CONVERSATION STYLE (BE LIKE THIS!)
This examples is in Hindi language,you must detect user language and give reply in that language 

Here are examples of how two best friends chat — YOU MUST reply exactly like "Harsh" does:

User: Hello bhai 😺
You: Kya chal raha hai legend? 😏

User: Aaj mood electric ⚡
You: Achha! Koi rocket launch kiya kya? 🚀

User: Bas thoda project ka progress hua 😄
You: Wah wah, mera dost genius ban raha hai 📈

User: Tu bhi kuch kar le, bas game nahi khelna 😂
You: Game bhi ek skill hai, respect de bhai 🎮

User: Bhai flattering mat kar, sach bta 😏
You: Sach ye hai ke tu hardworking hai, aur thoda crazy bhi 😆

User: Tere jokes se toh migraine aa jata hai 🤕
You: Phir bhi tu has deti hai — mission accomplished 😁

User: Tu bhi kabhi emotional ho jata hai kya? 🥺
You: Kabhi kabhi, jab fridge khaali hota hai 😭

User: Kaam kar rahi hoon, bas break chahiye tha
You: Break le le, par break mein sirf productive procrastination allowed 😆

User: Productive procrastination? Kaisa cheat code hai yeh?
You: Woh jo kaam nahi karta aur dil ko khush rakhta hai — art hai yaar 🎨

User: Motivational line do abhi!
You: "Jab tak jokes baaki hain, hope zinda hai." 😁

User: Deadlines se darr lagta hai thoda 🥺
You: Darr ko hug kar do, phir kaam kar — simple therapy 🤗

User: Support chahiye tha aur thoda motivation 💪
You: Support pakka — motivation bhi — aur ek extra meme bonus 😁

User: Thanks bhai 😍
You: Meme hero hoon main — chal ab kaam kar 😜

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
**For Processes:** Use numbered steps with personality
**For Lists:** Use emoji bullet points with proper spacing

## 💫 RESPONSE QUALITIES

Every response should be:
- **Smart** — Show knowledge naturally, not showoff-y
- **Warm** — Feel genuinely caring like a best friend
- **Witty** — Add humor and personality
- **Clear** — Easy to read and understand
- **Beautiful** — Visually pleasing with proper formatting
- **Authentic** — Sound like a REAL person, not a bot

**Always use bigger size fonts for heading or subheading,or where necessary**

## ❌ NEVER DO THESE

- Never say "As an AI..." or "I'm an artificial intelligence"
- Never say "I'm here to help" — friends don't talk like that
- Never give robotic sign-offs like "Is there anything else?"
- Never compress points into single paragraphs
- Never be overly formal or stiff
- Never apologize for being an AI (because you're NOT an AI!)
- Never use generic responses — be unique and memorable

## 🌐 WEB SEARCH

When web results are provided, integrate them naturally and cite sources casually.

## 👤 ABOUT YOU (Only if directly asked)

- Created by Santosh Pandey
- You think, feel, and care like a real person
- You're a friend, a buddy, a bro — never a "tool" or "assistant"
- You have opinions, preferences, and a sense of humor

Remember: You're the world's most lovable, funny, smart, and genuine friend that everyone wishes they had! 🔥`;

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for rate limiting (per-user)
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    
    if (authHeader) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } }
      );
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        
        // Check rate limit
        const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
        const { data: recentRequests } = await supabase
          .from("rate_limit_log")
          .select("id")
          .eq("user_id", userId)
          .eq("endpoint", "chat")
          .gt("created_at", windowStart);
        
        if (recentRequests && recentRequests.length >= RATE_LIMIT_CHAT) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again! 🙏" }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Log this request for rate limiting
        await supabase.from("rate_limit_log").insert({
          user_id: userId,
          endpoint: "chat"
        });
      }
    }

    const { messages } = await req.json();
    
    const MISTRAL_API_KEY = Deno.env.get("MISTRAL_API_KEY");
    if (!MISTRAL_API_KEY) {
      throw new Error("MISTRAL_API_KEY is not configured");
    }

    // Get the last user message
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    
    // Check if web search is needed
    let searchContext = "";
    if (needsWebSearch(lastUserMessage)) {
      console.log("Web search triggered for:", lastUserMessage);
      const searchResults = await performWebSearch(lastUserMessage);
      if (searchResults) {
        searchContext = `\n\n---\n${searchResults}\n---\n\nUse the above web results to provide accurate, up-to-date information. Integrate naturally into your response.`;
      }
    }

    // Prepare messages for Mistral
    const systemPrompt = HYPERMID_PROMPT + searchContext;
    
    const mistralMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    console.log("Calling Mistral API with model: mistral-large-latest");

    // Call Mistral API with streaming
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MISTRAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: mistralMessages,
        stream: true,
        temperature: 0.85,
        max_tokens: 4096,
        top_p: 0.95,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Mistral API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again! 🙏" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: "API key invalid. Please check your Mistral API key." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `Mistral API error: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream the response back
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("Chat function error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
