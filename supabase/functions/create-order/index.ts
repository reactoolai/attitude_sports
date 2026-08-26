import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  corsHeaders,
  sendEmail,
  orderConfirmationHtml,
  newOrderNotifyHtml,
  type OrderInfo,
  type OrderItem,
} from "../_shared/email.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      cart_token,
      customer,
      fulfillment_type = "delivery",
      shipping = {},
      note = null,
      items = [],
      payment_token,
    } = body;

    // 1. Validate required fields
    if (!customer?.first_name || !customer?.last_name || !customer?.email) {
      return new Response(JSON.stringify({ error: "Informations client incomplètes" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!payment_token) {
      return new Response(JSON.stringify({ error: "Token de paiement manquant" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: "Le panier est vide" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (fulfillment_type === "delivery") {
      if (!shipping.address1 || !shipping.city || !shipping.postal_code) {
        return new Response(JSON.stringify({ error: "Adresse de livraison incomplète" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // 2. Server-side price recalculation
    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const item of items) {
      let skuData: { id: string; price: number; quantity: number; color: string | null; size: string | null } | null = null;

      if (item.sku_id) {
        const { data } = await supabase
          .from("skus")
          .select("id,price,quantity,color,size")
          .eq("sku_id", item.sku_id)
          .maybeSingle();
        skuData = data;
      } else if (item.product_id) {
        let query = supabase
          .from("skus")
          .select("id,price,quantity,color,size")
          .eq("product_id", item.product_id);
        if (item.color) query = query.eq("color", item.color);
        if (item.size) query = query.eq("size", item.size);
        const { data } = await query.maybeSingle();
        skuData = data;
      }

      if (!skuData) {
        return new Response(JSON.stringify({
          error: `Article introuvable: ${item.name || "produit inconnu"}`,
        }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (skuData.quantity <= 0) {
        return new Response(JSON.stringify({
          error: `Désolé, cet article n'est plus en stock: ${item.name || "produit"}`,
        }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const unitPrice = parseFloat(skuData.price) || 0;
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      // Fetch product info
      const { data: product } = await supabase
        .from("products")
        .select("name,supplier,tax_tps,tax_tvq")
        .eq("id", item.product_id)
        .maybeSingle();

      // Fetch first image
      const { data: img } = await supabase
        .from("product_images")
        .select("image_url")
        .eq("numref", item.numref)
        .eq("deleted", false)
        .order("image_number", { ascending: true })
        .limit(1)
        .maybeSingle();

      orderItems.push({
        name: product?.name || item.name || "Sans nom",
        supplier: product?.supplier || null,
        image_url: img?.image_url || null,
        color: skuData.color || item.color || null,
        size: skuData.size || item.size || null,
        quantity: item.quantity,
        line_total: lineTotal,
        _skuUuid: skuData.id,
      } as any);
    }

    // 3. Calculate totals
    const shippingTotal = fulfillment_type === "delivery"
      ? (subtotal >= 200 ? 0 : 25.00)
      : 0;

    // Use product tax rates if available, else defaults
    const { data: firstProduct } = await supabase
      .from("products")
      .select("tax_tps,tax_tvq")
      .eq("id", items[0]?.product_id)
      .maybeSingle();

    const tpsRate = (firstProduct?.tax_tps ?? 5) / 100;
    const tvqRate = (firstProduct?.tax_tvq ?? 9.975) / 100;

    const taxableBase = subtotal + shippingTotal;
    const tps = Math.round(taxableBase * tpsRate * 100) / 100;
    const tvq = Math.round(taxableBase * tvqRate * 100) / 100;
    const total = Math.round((subtotal + shippingTotal + tps + tvq) * 100) / 100;

    // 4. Generate order number and create order
    const { data: orderNumberData } = await supabase
      .rpc("next_order_number");
    const orderNumber = orderNumberData;

    const { data: orderRow, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        status: "pending_payment",
        customer_first_name: customer.first_name,
        customer_last_name: customer.last_name,
        customer_email: customer.email,
        customer_phone: customer.phone || null,
        fulfillment_type,
        ship_address1: shipping.address1 || null,
        ship_address2: shipping.address2 || null,
        ship_city: shipping.city || null,
        ship_province: shipping.province || "QC",
        ship_postal_code: shipping.postal_code || null,
        ship_country: "CA",
        customer_note: note,
        subtotal,
        shipping_total: shippingTotal,
        tps,
        tvq,
        total,
        currency: "CAD",
        payment_provider: "square",
        cart_token: cart_token || null,
      })
      .select("id")
      .single();

    if (orderError) throw orderError;
    const orderId = orderRow.id;

    // Insert order items
    const itemInserts = items.map((item: Record<string, unknown>, i: number) => ({
      order_id: orderId,
      product_id: item.product_id || null,
      numref: item.numref || null,
      sku_id: item.sku_id || null,
      name: orderItems[i].name,
      supplier: orderItems[i].supplier,
      image_url: orderItems[i].image_url,
      color: orderItems[i].color,
      size: orderItems[i].size,
      unit_price: orderItems[i].line_total / orderItems[i].quantity,
      quantity: orderItems[i].quantity,
      line_total: orderItems[i].line_total,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemInserts);
    if (itemsError) throw itemsError;

    // 5. Charge with Square
    const squareToken = Deno.env.get("SQUARE_ACCESS_TOKEN")!;
    const squareLocation = Deno.env.get("SQUARE_LOCATION_ID")!;
    const totalCents = Math.round(total * 100);
    const idempotencyKey = crypto.randomUUID();

    let squarePaymentId: string | null = null;
    let paymentSuccess = false;

    try {
      const squareResp = await fetch("https://connect.squareup.com/v2/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${squareToken}`,
          "Square-Version": "2025-01-23",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idempotency_key: idempotencyKey,
          source_id: payment_token,
          amount_money: { amount: totalCents, currency: "CAD" },
          location_id: squareLocation,
          reference_id: orderNumber,
          buyer_email_address: customer.email,
          note: `Commande ${orderNumber} — Attitude Sports`,
        }),
      });

      if (squareResp.ok) {
        const squareData = await squareResp.json();
        squarePaymentId = squareData.payment?.id || null;
        paymentSuccess = true;
      } else {
        const squareErr = await squareResp.json().catch(() => ({}));
        const errMsg = squareErr.errors?.[0]?.detail || squareErr.errors?.[0]?.code || "Erreur de paiement";
        // Cancel the order
        await supabase.from("orders").update({
          status: "cancelled",
          payment_status: "failed",
          updated_at: new Date().toISOString(),
        }).eq("id", orderId);

        await supabase.from("order_status_history").insert({
          order_id: orderId,
          status: "cancelled",
          note: `Échec de paiement Square: ${errMsg}`,
        });

        return new Response(JSON.stringify({
          error: `Le paiement a échoué: ${errMsg}. Aucun montant n'a été chargé.`,
        }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    } catch (squareErr) {
      await supabase.from("orders").update({
        status: "cancelled",
        payment_status: "failed",
        updated_at: new Date().toISOString(),
      }).eq("id", orderId);

      return new Response(JSON.stringify({
        error: "Erreur de communication avec le service de paiement. Aucun montant n'a été chargé.",
      }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Payment succeeded — update order
    await supabase.from("orders").update({
      status: "paid",
      payment_status: "paid",
      square_payment_id: squarePaymentId,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", orderId);

    // 6. Mark abandoned cart as converted
    if (cart_token) {
      await supabase.from("abandoned_carts").update({
        status: "converted",
        converted_order_id: orderId,
      }).eq("cart_token", cart_token);
    }

    // 7. Add order status history
    await supabase.from("order_status_history").insert({
      order_id: orderId,
      status: "paid",
      note: "Paiement confirmé via Square",
    });

    // 8. Decrement SKU quantities — collect uuid ids during price recalculation
    for (let i = 0; i < items.length; i++) {
      const skuUuid = (orderItems[i] as any)._skuUuid;
      if (skuUuid) {
        await supabase.rpc("decrement_sku_quantity", {
          sku_uuid: skuUuid,
          qty: items[i].quantity,
        }).catch(() => {});
      }
    }

    // 9. Send emails (non-blocking — never fail the order)
    const orderInfo: OrderInfo = {
      order_number: orderNumber,
      customer_first_name: customer.first_name,
      customer_last_name: customer.last_name,
      customer_email: customer.email,
      fulfillment_type,
      ship_address1: shipping.address1,
      ship_address2: shipping.address2,
      ship_city: shipping.city,
      ship_province: shipping.province,
      ship_postal_code: shipping.postal_code,
      subtotal,
      shipping_total: shippingTotal,
      tps,
      tvq,
      total,
      items: orderItems,
    };

    const notifyEmail = Deno.env.get("ORDER_NOTIFY_EMAIL") || "info@lechoixdesophie.com";

    // Fire and forget — email failures must not break a paid order
    sendEmail(customer.email, `Confirmation de votre commande ${orderNumber}`, orderConfirmationHtml(orderInfo)).catch(() => {});
    sendEmail(notifyEmail, `Nouvelle commande ${orderNumber} — Attitude Sports`, newOrderNotifyHtml(orderInfo)).catch(() => {});

    return new Response(JSON.stringify({
      ok: true,
      order_number: orderNumber,
      total,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
