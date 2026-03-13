import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RATE_LIMIT_IMAGE = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function extractImageUrl(payload: any): string | null {
  const imageCandidates = [
    payload?.choices?.[0]?.message?.images?.[0]?.image_url?.url,
    payload?.choices?.[0]?.message?.images?.[0]?.image_url,
    payload?.choices?.[0]?.message?.images?.[0]?.url,
    payload?.data?.[0]?.url,
  ];

  for (const candidate of imageCandidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  const inlineData = payload?.choices?.[0]?.message?.images?.[0]?.inline_data;
  if (inlineData?.data && inlineData?.mime_type) {
    return `data:${inlineData.mime_type};base64,${inlineData.data}`;
  }

  const messageContent = payload?.choices?.[0]?.message?.content;
  if (Array.isArray(messageContent)) {
    const imagePart = messageContent.find((part: any) => part?.type === "image_url" && part?.image_url?.url);
    if (imagePart?.image_url?.url) return imagePart.image_url.url;
  }

  if (typeof messageContent === "string") {
    const markdownImage = messageContent.match(/!\[.*?\]\((.*?)\)/)?.[1];
    if (markdownImage) return markdownImage;
  }

  return null;
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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
    const imageUrl = extractImageUrl(data);
    const messageText = data?.choices?.[0]?.message?.content;

    if (!imageUrl) {
      console.error("Image URL missing in response payload");
      throw new Error("I couldn't generate that image yet. Please try a different prompt.");
    }

    return new Response(
      JSON.stringify({
        imageUrl,
        message: typeof messageText === "string" ? messageText : "Your image is ready!",
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
