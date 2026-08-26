import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, sendEmail, statusUpdateHtml } from "../_shared/email.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // 3.3 JWT auth check
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Verify JWT
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) {
      return new Response(JSON.stringify({ error: "Session invalide" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { order_id, status, note = null } = body;

    if (!order_id || !status) {
      return new Response(JSON.stringify({ error: "order_id et status requis" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validStatuses = ["pending_payment", "paid", "preparing", "ready_for_pickup", "shipping", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return new Response(JSON.stringify({ error: "Statut invalide" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update order status
    const { data: order, error: updateError } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", order_id)
      .select("order_number, customer_first_name, customer_email")
      .maybeSingle();

    if (updateError) throw updateError;
    if (!order) {
      return new Response(JSON.stringify({ error: "Commande introuvable" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Add to history
    await supabase.from("order_status_history").insert({
      order_id,
      status,
      note,
    });

    // Send customer email for specific statuses
    const emailStatuses = ["preparing", "ready_for_pickup", "shipping", "delivered"];
    if (emailStatuses.includes(status)) {
      const html = statusUpdateHtml(order.order_number, order.customer_first_name, status);
      const subjects: Record<string, string> = {
        preparing: `Votre commande ${order.order_number} est en préparation`,
        ready_for_pickup: `Votre commande ${order.order_number} est prête pour le ramassage`,
        shipping: `Votre commande ${order.order_number} est en livraison`,
        delivered: `Votre commande ${order.order_number} a été livrée`,
      };
      await sendEmail(order.customer_email, subjects[status], html).catch(() => {});
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
