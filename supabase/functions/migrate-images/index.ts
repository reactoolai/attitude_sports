import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "list";

    if (action === "list") {
      const offset = parseInt(url.searchParams.get("offset") || "0");
      const { data, error } = await supabase
        .from("product_images")
        .select("id,numref,image_number,image_url")
        .eq("deleted", false)
        .or("image_url.like.%scene7.com%,image_url.like.%pexels.com%")
        .order("numref")
        .range(offset, offset + 999);

      if (error) throw new Error(error.message);

      return new Response(JSON.stringify({ total: data.length, external: data.length, images: data, offset }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "migrate") {
      const body = await req.json();
      const { id, numref, image_number, image_url } = body;

      // Download the image
      let buf: ArrayBuffer | null = null;
      let contentType = "image/jpeg";

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const imgResp = await fetch(image_url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
            },
          });
          if (imgResp.ok) {
            buf = await imgResp.arrayBuffer();
            contentType = imgResp.headers.get("content-type") || "image/jpeg";
            break;
          }
        } catch {}
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }

      if (!buf) {
        return new Response(JSON.stringify({ error: "Download failed after retries" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const ext = contentType.includes("webp") ? "webp" : contentType.includes("png") ? "png" : contentType.includes("gif") ? "gif" : "jpg";
      const path = `${numref}/${numref}_${image_number}.${ext}`;

      // Upload to storage using SDK
      const { error: uploadErr } = await supabase.storage
        .from("product-images")
        .upload(path, buf, { contentType, upsert: true });

      if (uploadErr) {
        return new Response(JSON.stringify({ error: `Upload failed: ${uploadErr.message}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const publicUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${path}`;

      // Update DB
      const { error: dbErr } = await supabase
        .from("product_images")
        .update({ image_url: publicUrl })
        .eq("id", id);

      if (dbErr) {
        return new Response(JSON.stringify({ error: `DB update failed: ${dbErr.message}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, publicUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "count") {
      const { count, error } = await supabase
        .from("product_images")
        .select("*", { count: "exact", head: true })
        .eq("deleted", false)
        .or("image_url.like.%scene7.com%,image_url.like.%pexels.com%");

      if (error) throw new Error(error.message);

      return new Response(JSON.stringify({ remaining: count }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
