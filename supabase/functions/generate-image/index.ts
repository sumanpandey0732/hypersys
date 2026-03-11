import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RATE_LIMIT_IMAGE = 10;
const RATE_LIMIT_WINDOW_MS = 3600000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
        const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
        const { data: recentRequests } = await supabase
          .from("rate_limit_log")
          .select("id")
          .eq("user_id", userId)
          .eq("endpoint", "generate-image")
          .gt("created_at", windowStart);
        
        if (recentRequests && recentRequests.length >= RATE_LIMIT_IMAGE) {
          return new Response(
            JSON.stringify({ error: "Image generation limit reached (10/hour). Please try again later! 🎨", success: false }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        await supabase.from("rate_limit_log").insert({ user_id: userId, endpoint: "generate-image" });
      }
    }

    const { prompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!prompt) throw new Error("No prompt provided");

    const enhancedPrompt = `Create a stunning, high-quality, professional image: ${prompt}. Make it visually beautiful, vibrant, detailed, and artistically compelling.`;

    console.log("Generating image with gemini-3.1-flash-image-preview for:", prompt);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: enhancedPrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Image generation error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many image requests! Please wait a moment. 🎨", success: false }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Image generation failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Image generation response keys:", Object.keys(data));

    // Try multiple paths to find the image
    let imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url
      || data.choices?.[0]?.message?.images?.[0]?.url
      || data.choices?.[0]?.message?.content?.match(/!\[.*?\]\((.*?)\)/)?.[1];

    // Check inline_data (base64)
    if (!imageUrl) {
      const inlineData = data.choices?.[0]?.message?.images?.[0]?.inline_data;
      if (inlineData?.data && inlineData?.mime_type) {
        imageUrl = `data:${inlineData.mime_type};base64,${inlineData.data}`;
      }
    }

    const textContent = data.choices?.[0]?.message?.content || "";

    if (!imageUrl) {
      console.error("Full response:", JSON.stringify(data).slice(0, 500));
      throw new Error("No image was generated. Please try a different description!");
    }

    return new Response(
      JSON.stringify({ imageUrl, message: textContent || "Here's your image! ✨", success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Generate image error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate image", success: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
