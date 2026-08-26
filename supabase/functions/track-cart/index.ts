import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/email.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      cart_token,
      items = [],
      subtotal = 0,
      email = null,
      first_name = null,
      last_name = null,
      phone = null,
      reached_checkout = false,
    } = body;

    if (!cart_token) {
      return new Response(JSON.stringify({ error: "cart_token requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: existing } = await supabase
      .from("abandoned_carts")
      .select("id")
      .eq("cart_token", cart_token)
      .maybeSingle();

    const update: Record<string, unknown> = {
      items,
      items_count: Array.isArray(items) ? items.length : 0,
      subtotal,
      last_seen_at: new Date().toISOString(),
      reached_checkout,
    };
    if (email !== null) update.email = email;
    if (first_name !== null) update.first_name = first_name;
    if (last_name !== null) update.last_name = last_name;
    if (phone !== null) update.phone = phone;

    if (existing) {
      const { error } = await supabase
        .from("abandoned_carts")
        .update(update)
        .eq("cart_token", cart_token);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("abandoned_carts")
        .insert({ cart_token, ...update });
      if (error) throw error;
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
