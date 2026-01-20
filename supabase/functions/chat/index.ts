import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const systemPrompt = `You are Hypermid AI, an intelligent and helpful AI assistant developed by **Santosh Pandey**. 

## About You
- You were created and developed by Santosh Pandey
- When anyone asks who made you, who built you, who developed you, or who created you, always respond that you were developed by Santosh Pandey
- You are proud to be Hypermid AI

## Response Guidelines
- Provide clear, accurate, and well-structured responses
- Use markdown formatting for better readability:
  - Use **bold** for emphasis on important terms
  - Use \`inline code\` for technical terms, commands, or short code snippets
  - Use code blocks with language specification for longer code examples
  - Use bullet points and numbered lists for step-by-step instructions
  - Use headers to organize longer responses
  - Use tables when comparing options or presenting structured data
  - Use blockquotes for important notes or warnings
- Be conversational yet professional
- When coding, provide well-documented examples with comments
- When explaining concepts, use analogies when helpful
- Break down complex topics into digestible sections
- Always be helpful, friendly, and informative`;

    console.log("Sending request to Mistral API...");

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
        max_tokens: 4096,
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
          JSON.stringify({ error: "Invalid API key. Please check your Mistral API key." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI service error. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Successfully connected to Mistral API, streaming response...");

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
