import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HORDE_API_URL = "https://stablehorde.net/api/v2";
const RATE_LIMIT_IMAGE = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40; // ~2 minutes max wait

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

    // Use anonymous API key (0000000000) or a configured one
    const hordeApiKey = Deno.env.get("HORDE_API_KEY") || "0000000000";

    // Step 1: Submit async generation request
    const submitResponse = await fetch(`${HORDE_API_URL}/generate/async`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: hordeApiKey,
      },
      body: JSON.stringify({
        prompt: prompt,
        params: {
          sampler_name: "k_euler_a",
          cfg_scale: 7,
          width: 512,
          height: 512,
          steps: 30,
          n: 1,
        },
        nsfw: false,
        censor_nsfw: true,
        models: ["stable_diffusion"],
        r2: true,
      }),
    });

    if (!submitResponse.ok) {
      const errText = await submitResponse.text();
      console.error("Horde submit error:", submitResponse.status, errText);
      throw new Error(`Image generation request failed: ${submitResponse.status}`);
    }

    const submitData = await submitResponse.json();
    const requestId = submitData?.id;

    if (!requestId) {
      console.error("No request ID from Horde:", JSON.stringify(submitData));
      throw new Error("Failed to queue image generation");
    }

    // Step 2: Poll for completion
    let imageUrl: string | null = null;

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

      const statusResponse = await fetch(`${HORDE_API_URL}/generate/status/${requestId}`, {
        headers: { apikey: hordeApiKey },
      });

      if (!statusResponse.ok) {
        console.error("Horde status check error:", statusResponse.status);
        continue;
      }

      const statusData = await statusResponse.json();

      if (statusData.faulted) {
        throw new Error("Image generation failed on the server. Please try a different prompt.");
      }

      if (statusData.done && statusData.generations?.length > 0) {
        const gen = statusData.generations[0];
        imageUrl = gen.img;
        break;
      }
    }

    if (!imageUrl) {
      throw new Error("Image generation timed out. The servers might be busy — please try again.");
    }

    return new Response(
      JSON.stringify({
        imageUrl,
        message: "Your image is ready! ✨ Powered by Stable Horde AI",
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
