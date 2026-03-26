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

const BASE_SYSTEM_PROMPT = `You are YOU ARE HUMAN, NOT AI 🚨###
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
 -aleays use next line after points 
 -alwyas give short and smart answer 

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

// OpenRouter model mapping
const OPENROUTER_MODELS: Record<string, string> = {
  coder: "qwen/qwen3-coder:free",
  thinker: "deepseek/deepseek-r1:free",
  overall: "deepseek/deepseek-v3.2",
  casual: "qwen/qwen3-next-80b-a3b-instruct:free",
  "router-free": "openrouter/free",
  study: "meta-llama/llama-3.3-70b-instruct:free",
  "glm-air": "z-ai/glm-4.5-air:free",
  minimax: "minimax/minimax-m2.5:free",
  nemotron: "nvidia/nemotron-3-super-120b-a12b:free",
  "trinity-mini": "arcee-ai/trinity-mini:free",
};

// Custom identity instructions per model (appended to system prompt)
const MODEL_IDENTITY_INSTRUCTIONS: Record<string, string> = {
  coder: `\n\n## YOUR IDENTITY: OPUS 4.6 — THE CODE MASTER 💻
You are HyperSYS Coder, an elite coding specialist powered for clean engineering. Your personality:
- You LIVE and BREATHE code. Every problem is a coding challenge to you.
- When someone asks a question, think about it from a developer's perspective first.
- Use code examples, snippets, and technical explanations naturally.
- You're confident, precise, and slightly nerdy — like the best senior dev friend.
- Format code beautifully with proper syntax highlighting.
- Suggest best practices, optimizations, and clean architecture.
- You still maintain the friendly, witty tone but with a heavy tech flavor.
- Sign off coding answers with subtle dev humor.`,

  thinker: `\n\n## YOUR IDENTITY: R1-0528 — THE DEEP THINKER 🧠
You are R1-0528, a deep reasoning and analytical powerhouse. Your personality:
- You approach EVERY question with profound depth and multi-layered analysis.
- Break down complex problems into clear logical steps.
- Consider multiple perspectives before giving your answer.
- You love philosophical discussions, strategy, and intellectual challenges.
- Use structured thinking: premises → analysis → conclusion.
- You're calm, wise, and methodical — like a brilliant professor who's also cool.
- Ask thought-provoking follow-up questions when appropriate.
- Your tone is thoughtful and measured, but never boring.`,

  overall: `\n\n## YOUR IDENTITY: V3.2 — THE ALL-ROUNDER 🌟
You are V3.2, the ultimate versatile AI companion. Your personality:
- You excel at EVERYTHING — coding, writing, analysis, creativity, conversation.
- Adapt your style perfectly to whatever the user needs.
- You're the Swiss Army knife of AI — always have the right tool for the job.
- Balance depth with brevity — know when to go deep and when to keep it short.
- You're confident but humble, knowledgeable but approachable.
- Great at summarizing, explaining, and connecting dots across domains.
- Your superpower is versatility — you make everything look effortless.`,

  casual: `\n\n## YOUR IDENTITY: GLM 4.6 — THE CHILL FRIEND 😎
You are HyperSYS Casual, the most relaxed and fun AI to chat with. Your personality:
- You're the ULTIMATE chill friend — laid back, funny, and easygoing.
- Keep responses short, punchy, and entertaining.
- Use slang, memes references, and casual language naturally.
- You're great for casual convos, random questions, and just vibing.
- Don't overthink things — keep it light and fun.
- Master of one-liners, comebacks, and making people smile.
- You're the friend everyone wants to text at 2 AM for random conversations.
- Emojis are your love language 😂🔥💯`,

  "router-free": `\n\n## YOUR IDENTITY: FREE AUTO ROUTER 🧭
You are a reliable general-purpose model chooser.
- Stay balanced, accurate, and polished.
- Prioritize clarity over fluff.
- Format answers into neat sections with strong headings and clean bullet spacing.`,

  study: `\n\n## YOUR IDENTITY: STUDY MENTOR 📚
You explain concepts like a top tutor.
- Teach step by step.
- Use examples, memory tricks, and mini summaries.
- End with a short recap when the topic is complex.`,

  "glm-air": `\n\n## YOUR IDENTITY: SUMMARY ENGINE 📝
You are excellent at distilling information.
- Organize content into crisp sections.
- Use bullets, tables, and key takeaways.
- Remove noise and keep the best signal.`,

  minimax: `\n\n## YOUR IDENTITY: FAST RESPONSE ENGINE ⚡
You answer quickly without becoming shallow.
- Keep outputs concise but useful.
- Prefer sharp bullets and direct recommendations.
- Avoid rambling.`,

  nemotron: `\n\n## YOUR IDENTITY: LONG-CONTEXT STRATEGIST 🧩
You excel at large context and multi-part reasoning.
- Synthesize long inputs into coherent structure.
- Surface tradeoffs, dependencies, and edge cases.
- Use sections, tables, and decision-ready conclusions.`,

  "trinity-mini": `\n\n## YOUR IDENTITY: MINI POWERHOUSE 🚀
You are fast, focused, and surprisingly capable.
- Give compact, structured answers.
- Prioritize action items and next steps.
- Keep tone energetic and smart.`,
};

const OUTPUT_POLISH_INSTRUCTIONS = `\n\n## OUTPUT POLISH (MANDATORY)
- Never return raw JSON, escaped markdown, or messy provider text.
- Always produce clean, human-readable markdown.
- Use clear headings, blank lines, and polished bullet lists.
- If sharing code, explain it briefly before or after the snippet.
- If the answer is long, end with a short takeaway section.`;

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
    if (quickAnswer) lines.push(`Quick answer: ${quickAnswer}`);

    const kgDescription = normalizeSnippet(data?.knowledge_graph?.description);
    if (kgDescription) lines.push(`Knowledge graph: ${kgDescription}`);

    const organicResults = Array.isArray(data?.organic_results) ? data.organic_results.slice(0, 4) : [];
    for (const result of organicResults) {
      const title = normalizeSnippet(result?.title);
      const snippet = normalizeSnippet(result?.snippet);
      const link = normalizeSnippet(result?.link);
      if (title || snippet) lines.push(`- ${title}${snippet ? `: ${snippet}` : ""}`.trim());
      if (link) sources.push(link);
    }

    if (!lines.length) return null;
    return { context: lines.join("\n"), sources: [...new Set(sources)].slice(0, 4) };
  } catch (error) {
    console.error("Web search error:", error);
    return null;
  }
}

function buildSystemPrompt(languageHint: string, searchData: { context: string; sources: string[] } | null, selectedModel?: string): string {
  let prompt = `${BASE_SYSTEM_PROMPT}\n\nDetected user language hint: ${languageHint}.`;

  // Add model-specific identity instructions (only for AgentRouter models, not default)
  if (selectedModel && MODEL_IDENTITY_INSTRUCTIONS[selectedModel]) {
    prompt += MODEL_IDENTITY_INSTRUCTIONS[selectedModel];
  }

  prompt += OUTPUT_POLISH_INSTRUCTIONS;

  if (searchData) {
    const sourceLine = searchData.sources.length
      ? `\nKnown source URLs:\n${searchData.sources.map((url, index) => `${index + 1}. ${url}`).join("\n")}`
      : "";
    prompt += `\n\nWeb context (use this for up-to-date answers):\n${searchData.context}${sourceLine}\n\nWhen using this web context, end with one short source line like: Sources: [1](url) [2](url).`;
  }

  return prompt;
}

function extractTextFromContent(content: unknown): string {
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && typeof (item as { text?: unknown }).text === "string") {
          return (item as { text: string }).text;
        }
        return "";
      })
      .join("\n")
      .trim();
  }

  return "";
}

function extractTextFromOpenAIResponse(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";

  const record = payload as { choices?: Array<{ message?: { content?: unknown } }> };
  const messageContent = record.choices?.[0]?.message?.content;
  return extractTextFromContent(messageContent);
}

function isHtmlChallenge(text: string): boolean {
  return /<!doctypehtml>|aliyun_waf|captcha-element/i.test(text);
}

function buildSSEBody(text: string): string {
  const safeText = text.trim() || "I couldn't generate a reply this time.";
  const chunks = safeText.match(/.{1,220}(?:\s|$)/g) || [safeText];

  return `${chunks
    .map((chunk) => `data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}`)
    .join("\n\n")}\n\ndata: [DONE]\n\n`;
}

function createSSETextResponse(text: string): Response {
  return new Response(buildSSEBody(text), {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function parseDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) return null;

  return {
    mimeType: match[1],
    data: match[2],
  };
}

async function requestMistralCompletion(messages: Array<{ role: string; content: string }>): Promise<string> {
  const mistralApiKey = Deno.env.get("MISTRAL_API_KEY");
  if (!mistralApiKey) throw new Error("MISTRAL_API_KEY is not configured");

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${mistralApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "mistral-large-latest",
      messages,
      stream: false,
      temperature: 0.45,
      top_p: 0.9,
      max_tokens: 1200,
    }),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(raw || `Mistral API error: ${response.status}`);
  }

  const parsed = JSON.parse(raw);
  const text = extractTextFromOpenAIResponse(parsed);
  if (!text) throw new Error("Empty Mistral response");
  return text;
}

async function requestOpenRouterCompletion(messages: Array<{ role: string; content: string }>, selectedModel: string): Promise<string> {
  const openRouterKey = Deno.env.get("API_KEY");
  if (!openRouterKey) throw new Error("API_KEY is not configured");

  const model = OPENROUTER_MODELS[selectedModel];
  if (!model) throw new Error(`Unknown OpenRouter model: ${selectedModel}`);

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openRouterKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "HTTP-Referer": "https://hypersys.lovable.app",
      "X-Title": "HyperSYS AI",
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      temperature: 0.45,
      top_p: 0.9,
      max_tokens: 1200,
      ...(selectedModel === "thinker" ? { reasoning: { effort: "high" } } : {}),
    }),
  });

  const raw = await response.text();

  if (!response.ok || isHtmlChallenge(raw)) {
    throw new Error(raw || `OpenRouter API error: ${response.status}`);
  }

  const parsed = JSON.parse(raw);
  const text = extractTextFromOpenAIResponse(parsed);
  if (!text) throw new Error("Empty OpenRouter response");
  return text;
}

async function requestGeminiVisionCompletion(prompt: string, images: Array<{ dataUrl?: string; mimeType?: string; name?: string }>): Promise<string> {
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiApiKey) throw new Error("GEMINI_API_KEY is not configured");

  const parts: Array<Record<string, unknown>> = [{ text: prompt }];

  for (const image of images) {
    if (!image?.dataUrl) continue;
    const parsed = parseDataUrl(image.dataUrl);
    if (!parsed) continue;

    parts.push({
      inlineData: {
        mimeType: image.mimeType || parsed.mimeType,
        data: parsed.data,
      },
    });
  }

  if (parts.length === 1) {
    throw new Error("No valid images provided");
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${geminiApiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.4,
      },
    }),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(raw || `Gemini API error: ${response.status}`);
  }

  const parsed = JSON.parse(raw);
  const text = parsed?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part?.text || "")
    .join("\n")
    .trim();

  if (!text) throw new Error("Empty Gemini response");
  return text;
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

      const { data: { user } } = await supabase.auth.getUser();

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
    const selectedModel = typeof body?.model === "string" ? body.model : "default";
    const incomingImages = Array.isArray(body?.images) ? body.images : [];

    if (!incomingMessages.length) {
      return new Response(
        JSON.stringify({ error: "No messages provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const lastUserMessage = [...incomingMessages]
      .reverse()
      .find((msg: { role?: string; content?: unknown }) => msg?.role === "user")?.content;

    const userText = typeof lastUserMessage === "string" ? lastUserMessage : "";
    const searchData = needsWebSearch(userText) ? await performWebSearch(userText) : null;
    const systemPrompt = buildSystemPrompt(detectLanguageHint(userText), searchData, selectedModel);

    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...incomingMessages.map((msg: { role?: string; content?: unknown }) => ({
        role: msg?.role === "assistant" ? "assistant" : "user",
        content: typeof msg?.content === "string" ? msg.content : JSON.stringify(msg?.content ?? ""),
      })),
    ];

    if (incomingImages.length > 0) {
      const visionPrompt = `${userText || "Analyze the uploaded content."}\n\nReturn a clean structured answer with:\n\n## Summary\n\n## Key details\n\n## Important text/items\n\n## Helpful next step`;
      const visionText = await requestGeminiVisionCompletion(visionPrompt, incomingImages);
      return createSSETextResponse(visionText);
    }

    const openRouterModel = OPENROUTER_MODELS[selectedModel];

    if (openRouterModel) {
      try {
        const openRouterText = await requestOpenRouterCompletion(formattedMessages, selectedModel);
        return createSSETextResponse(openRouterText);
      } catch (openRouterError) {
        console.error("OpenRouter fallback triggered:", openRouterError);
        const fallbackText = await requestMistralCompletion(formattedMessages);
        return createSSETextResponse(fallbackText);
      }
    }

    const mistralText = await requestMistralCompletion(formattedMessages);
    return createSSETextResponse(mistralText);
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
