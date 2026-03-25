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

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}

function parseDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) return null;

  return {
    mimeType: match[1],
    data: match[2],
  };
}

async function convertRemoteImageToDataUrl(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Failed to fetch generated image: ${response.status}`);

  const mimeType = response.headers.get("content-type") || "image/png";
  const buffer = new Uint8Array(await response.arrayBuffer());
  return `data:${mimeType};base64,${bytesToBase64(buffer)}`;
}

async function generateWithHorde(prompt: string): Promise<string> {
  const hordeApiKey = Deno.env.get("AI_HORDE_KEY") || "0000000000";

  const submitResponse = await fetch(`${HORDE_API_URL}/generate/async`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: hordeApiKey,
    },
    body: JSON.stringify({
      prompt,
      params: {
        sampler_name: "k_euler_a",
        cfg_scale: 7,
        width: 768,
        height: 768,
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
    throw new Error(`Horde submit failed [${submitResponse.status}]: ${errText}`);
  }

  const submitData = await submitResponse.json();
  const requestId = submitData?.id;
  if (!requestId) throw new Error("Failed to queue Horde generation");

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    const statusResponse = await fetch(`${HORDE_API_URL}/generate/status/${requestId}`, {
      headers: { apikey: hordeApiKey },
    });

    if (!statusResponse.ok) continue;

    const statusData = await statusResponse.json();
    if (statusData?.faulted) {
      throw new Error("Horde generation failed. Try a different prompt.");
    }

    const imageUrl = statusData?.generations?.[0]?.img;
    if (statusData?.done && imageUrl) {
      return await convertRemoteImageToDataUrl(imageUrl);
    }
  }

  throw new Error("Horde generation timed out.");
}

async function generateWithGemini(prompt: string, images: Array<{ dataUrl?: string; mimeType?: string }> = []): Promise<{ imageDataUrl: string; text: string }> {
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

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${geminiApiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K",
        },
      },
    }),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(raw || `Gemini image API error: ${response.status}`);
  }

  const parsed = JSON.parse(raw);
  const responseParts = parsed?.candidates?.[0]?.content?.parts || [];
  const imagePart = responseParts.find((part: { inlineData?: { data?: string; mimeType?: string } }) => part?.inlineData?.data);
  const textPart = responseParts.find((part: { text?: string }) => typeof part?.text === "string" && part.text.trim());

  if (!imagePart?.inlineData?.data) {
    throw new Error("Gemini fallback returned no image data");
  }

  return {
    imageDataUrl: `data:${imagePart.inlineData.mimeType || "image/png"};base64,${imagePart.inlineData.data}`,
    text: textPart?.text || "Image generated with Gemini fallback.",
  };
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
    const images = Array.isArray(body?.images) ? body.images : [];

    if (!prompt) throw new Error("No prompt provided");

    let imageDataUrl = "";
    let provider = "horde";
    let message = "Your image is ready! ✨ Powered by Horde AI";

    try {
      if (images.length > 0) {
        throw new Error("Using Gemini fallback because reference images were provided.");
      }

      imageDataUrl = await generateWithHorde(prompt);
    } catch (hordeError) {
      console.error("Horde generation failed, switching to Gemini fallback:", hordeError);
      const geminiResult = await generateWithGemini(prompt, images);
      imageDataUrl = geminiResult.imageDataUrl;
      provider = "gemini";
      message = geminiResult.text;
    }

    return new Response(
      JSON.stringify({
        imageDataUrl,
        provider,
        message,
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
