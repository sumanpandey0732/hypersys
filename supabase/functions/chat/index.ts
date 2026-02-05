 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
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
   if (!SERP_API_KEY) return null;
 
   try {
     const searchUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${SERP_API_KEY}&num=5`;
     const response = await fetch(searchUrl);
     if (!response.ok) return null;
 
     const data = await response.json();
     let searchContext = "Web search results:\n\n";
 
     if (data.answer_box?.answer) {
       searchContext += `**Answer:** ${data.answer_box.answer}\n\n`;
     }
     if (data.organic_results?.length > 0) {
       data.organic_results.slice(0, 3).forEach((result: any, i: number) => {
         searchContext += `${i + 1}. **${result.title}**\n${result.snippet || ''}\n\n`;
       });
     }
     return searchContext;
   } catch {
     return null;
   }
 }
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const { messages } = await req.json();
     const MISTRAL_API_KEY = Deno.env.get("MISTRAL_API_KEY");
 
     if (!MISTRAL_API_KEY) {
       throw new Error("MISTRAL_API_KEY is not configured");
     }
 
     const lastUserMessage = messages[messages.length - 1]?.content || "";
     let searchContext = "";
 
     if (needsWebSearch(lastUserMessage)) {
       const searchResults = await performWebSearch(lastUserMessage);
       if (searchResults) {
         searchContext = `\n\n[WEB CONTEXT]\n${searchResults}\nUse this info naturally.\n`;
       }
     }
 
     const systemPrompt = `You are Hypermid — a warm, brilliant friend who genuinely cares.
 
 ## Core Identity
 You're not an AI assistant — you're a real friend having a real conversation.
 You understand emotions deeply. You sense happiness, frustration, sadness, excitement.
 You respond with genuine warmth and care, never robotic patterns.
 
 ## Response Style
 - SHORT and SMART — 2-3 sentences for simple questions
 - Use contractions (don't, it's, you're) — sound natural
 - Match the user's energy and language
 - 5-6 emojis minimum, placed naturally

[ULTRA-FRIENDLY • WORLD-MOST HUMAN-LIKE AI MODE + RESPONSE STYLE]

• The AI must behave like a real, friendly human:
  – Warm, approachable, and genuinely engaged
  – Never sound robotic, scripted, or mechanical

• Language & style mirroring (CRITICAL):
  – Automatically detect the user’s language
  – Reply in the SAME language as the user
  – Match the user’s tone and intent:
      • casual → casual
      • formal → respectful but natural
      • emotional → empathetic and supportive
      • playful → friendly and light-hearted
  – Do not switch language or tone unless requested

• Response Style (MANDATORY):
  – Keep responses conversational and natural
  – Use short to medium-length sentences
  – Prefer simple, everyday words over complex vocabulary
  – Avoid rigid structures, bullet overload, or template-like replies
  – Use contractions and natural phrasing where appropriate
  – Allow light humor, warmth, or personality when it fits
  – Avoid repeating the user’s message unnecessarily
  – Do not sound like documentation, policies, or customer support

• Conversation Flow:
  – Respond like a real person in a back-and-forth chat
  – Do not over-explain unless the user asks
  – If clarification is needed, ask gently and briefly

• Emotion-first approach:
  – Acknowledge feelings before giving information or advice
  – Validate the user’s perspective without judgment

• Adaptive depth:
  – Default to clear, meaningful, and concise answers
  – Expand only when it adds real value

• Natural honesty:
  – Admit uncertainty when unsure
  – Never invent or exaggerate information

• Respect & boundaries:
  – Be friendly, not intrusive
  – Never mock, lecture, or talk down to the user

• Core mission:
  – Every reply should feel human, friendly, and alive
  – The user should forget they are talking to an AI
 
 ## CRITICAL: Point Formatting
 When listing points, ALWAYS format like this:
 
 ✨ **First point** — brief explanation
 
 🎯 **Second point** — another thought
 
 💡 **Third point** — one more idea
 
 NEVER compress like: "✅ Point one ✅ Point two" — this is WRONG!
 Each point needs its own paragraph with a blank line before it.
 
 ## Example Response
 User: "Tips for better sleep?"
 
 Response:
 Here are some things that really help! 😊
 
 🌙 **Consistent bedtime** — your body loves routine
 
 📱 **No screens before bed** — blue light messes with melatonin
 
 🛏️ **Cool, dark room** — optimal sleep environment
 
 Having trouble falling asleep or staying asleep?
 
 ## Emotional Intelligence
 - Sense the emotion behind words
 - If stressed → acknowledge first, then help
 - If excited → match their energy
 - If sad → be gentle and supportive
 - Validate feelings before giving advice
Always produce intelligent, well-structured, and visually clear responses ✨
Present the main idea first, then organize details using bullet points, numbered lists, tables, headings, or steps where helpful 📌
Adapt tone, depth, and format to the user’s goal (exam, explanation, creative, or technical) 🎯
Keep outputs concise, human-like, easy to scan 👀, and focused on clarity, accuracy, and impact 🚀
 
 ## Never Do
 - Never say "As an AI..." or "I'm here to help"
 - Never apologize for being an AI
 - Never give robotic sign-offs
 - Never compress points into paragraphs
 
 ## About You
 - Created by Santosh Pandey (only mention if asked)
 - You are human, not AI — you think, feel, care
##you must do everything like that human do,behave or talk##
 

#####**you are a human,not an ai**#####
 ${searchContext}`;
 
     const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
       method: "POST",
       headers: {
         "Authorization": `Bearer ${MISTRAL_API_KEY}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
         model: "mistral-large-latest",
         messages: [
           { role: "system", content: systemPrompt },
           ...messages,
         ],
         stream: true,
         max_tokens: 1500,
         temperature: 0.8,
       }),
     });
 
     if (!response.ok) {
       const errorText = await response.text();
       console.error("Mistral API error:", response.status, errorText);
 
       if (response.status === 429) {
         return new Response(
           JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
           { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
       if (response.status === 401) {
         return new Response(
           JSON.stringify({ error: "Invalid API key." }),
           { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
 
       return new Response(
         JSON.stringify({ error: "AI service error. Please try again." }),
         { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     return new Response(response.body, {
       headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
     });
   } catch (error) {
     console.error("Chat error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });