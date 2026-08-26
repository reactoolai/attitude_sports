import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const imageUrl = url.searchParams.get("url");
    if (!imageUrl) {
      return new Response("Missing url param", { status: 400, headers: corsHeaders });
    }

    const allowedHosts = [
      "underarmour.scene7.com",
      "images.pexels.com",
      "llzejjwjfmfpkomdbjua.supabase.co",
    ];
    const parsedUrl = new URL(imageUrl);
    if (!allowedHosts.includes(parsedUrl.hostname)) {
      return new Response("Host not allowed", { status: 403, headers: corsHeaders });
    }

    const resp = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
      },
    });

    if (!resp.ok) {
      return new Response("Failed to fetch image", { status: resp.status, headers: corsHeaders });
    }

    const contentType = resp.headers.get("content-type") || "image/jpeg";
    const body = await resp.arrayBuffer();

    return new Response(body, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    return new Response("Error: " + err.message, { status: 500, headers: corsHeaders });
  }
});
