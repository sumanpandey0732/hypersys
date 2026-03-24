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
    if (!prompt) throw new Error("No prompt provided");

    // Try Lovable AI gateway first (Nano Banana), fallback to Horde AI
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    
    if (lovableKey) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [{ role: "user", content: `Generate a high quality image: ${prompt}` }],
            modalities: ["image", "text"],
          }),
        });

        if (aiResponse.ok) {
          const data = await aiResponse.json();
          const imageData = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          
          if (imageData) {
            return new Response(
              JSON.stringify({ imageUrl: imageData, message: "Your image is ready! ✨", success: true }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
          }
        }
        console.log("Lovable AI image gen failed, falling back to Horde AI");
      } catch (e) {
        console.error("Lovable AI error:", e);
      }
    }

    // Fallback: Stable Horde AI
    const hordeApiKey = Deno.env.get("AI_HORDE_KEY") || "0000000000";

    const submitResponse = await fetch("https://stablehorde.net/api/v2/generate/async", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: hordeApiKey },
      body: JSON.stringify({
        prompt,
        params: { sampler_name: "k_euler_a", cfg_scale: 7.5, width: 512, height: 512, steps: 35, n: 1 },
        nsfw: false,
        censor_nsfw: true,
        models: ["stable_diffusion"],
        r2: true,
      }),
    });

    if (!submitResponse.ok) {
      const errText = await submitResponse.text();
      console.error("Horde submit error:", submitResponse.status, errText);
      throw new Error("Image generation request failed");
    }

    const submitData = await submitResponse.json();
    const requestId = submitData?.id;
    if (!requestId) throw new Error("Failed to queue image generation");

    // Poll for completion
    for (let attempt = 0; attempt < 40; attempt++) {
      await new Promise((r) => setTimeout(r, 3000));

      const statusResponse = await fetch(`https://stablehorde.net/api/v2/generate/status/${requestId}`, {
        headers: { apikey: hordeApiKey },
      });

      if (!statusResponse.ok) continue;
      const statusData = await statusResponse.json();

      if (statusData.faulted) throw new Error("Image generation failed. Try a different prompt.");

      if (statusData.done && statusData.generations?.length > 0) {
        return new Response(
          JSON.stringify({ imageUrl: statusData.generations[0].img, message: "Your image is ready! ✨", success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    throw new Error("Image generation timed out. Please try again.");
  } catch (error) {
    console.error("Generate image error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate image", success: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
