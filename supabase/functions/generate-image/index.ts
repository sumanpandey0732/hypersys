import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RATE_LIMIT_IMAGE = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

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
          .eq("endpoint", "generate-image")
          .gt("created_at", windowStart);

        if (recentRequests && recentRequests.length >= RATE_LIMIT_IMAGE) {
          return new Response(
            JSON.stringify({ error: "Image generation limit reached (10/hour). Please try again later.", success: false }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        await supabase.from("rate_limit_log").insert({ user_id: user.id, endpoint: "generate-image" });
      }
    }

    const body = await req.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY is not configured");
    if (!prompt) throw new Error("No prompt provided");

    const enhancedPrompt = `Create a high-quality image with strong composition and clean details: ${prompt}`;

    // Try primary model first
    let response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: enhancedPrompt }],
        modalities: ["image", "text"],
      }),
    });

    // Fallback to secondary model if primary fails
    if (!response.ok) {
      console.log("Primary model failed, trying fallback model...");
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [{ role: "user", content: enhancedPrompt }],
          modalities: ["image", "text"],
        }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Image generation API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many image requests. Please wait a moment.", success: false }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      throw new Error(`Image generation failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract image URL from various response formats
    let imageUrl: string | null = null;

    // Check images array
    const images = data?.choices?.[0]?.message?.images;
    if (Array.isArray(images) && images.length > 0) {
      const img = images[0];
      if (typeof img?.image_url?.url === "string") imageUrl = img.image_url.url;
      else if (typeof img?.image_url === "string") imageUrl = img.image_url;
      else if (typeof img?.url === "string") imageUrl = img.url;
      else if (img?.inline_data?.data && img?.inline_data?.mime_type) {
        imageUrl = `data:${img.inline_data.mime_type};base64,${img.inline_data.data}`;
      }
    }

    // Check data array
    if (!imageUrl && data?.data?.[0]?.url) {
      imageUrl = data.data[0].url;
    }

    // Check content array for image parts
    if (!imageUrl) {
      const content = data?.choices?.[0]?.message?.content;
      if (Array.isArray(content)) {
        const imagePart = content.find((p: any) => p?.type === "image_url" && p?.image_url?.url);
        if (imagePart) imageUrl = imagePart.image_url.url;
      }
      // Check for markdown image in string content
      if (!imageUrl && typeof content === "string") {
        const match = content.match(/!\[.*?\]\((.*?)\)/);
        if (match?.[1]) imageUrl = match[1];
      }
    }

    const messageText = data?.choices?.[0]?.message?.content;
    const textMessage = typeof messageText === "string" ? messageText : 
      Array.isArray(messageText) ? messageText.filter((p: any) => p?.type === "text").map((p: any) => p.text).join(" ") : "";

    if (!imageUrl) {
      console.error("Full response payload:", JSON.stringify(data, null, 2));
      throw new Error("Could not generate that image. Please try a different or simpler prompt.");
    }

    return new Response(
      JSON.stringify({
        imageUrl,
        message: textMessage || "Your image is ready! ✨",
        success: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Generate image error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate image", success: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
