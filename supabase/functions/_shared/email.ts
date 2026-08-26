const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SHOP_NAME = Deno.env.get("SHOP_NAME") || "Attitude Sports";
const SHOP_URL = Deno.env.get("SHOP_URL") || "https://attitudesports.ca";
const FROM_EMAIL = "Attitude Sports <info@lechoixdesophie.com>";
const REPLY_TO = "info@lechoixdesophie.com";
const LOGO_URL = `${SHOP_URL}/logo.png`;

const COLORS = {
  noir: "#16161A",
  orange: "#FF5A1F",
  ivoire: "#F2F0EB",
  acier: "#2E2E34",
  gris: "#9C9CA4",
};

export interface OrderItem {
  name: string;
  supplier?: string;
  image_url?: string;
  color?: string;
  size?: string;
  quantity: number;
  line_total: number;
}

export interface OrderInfo {
  order_number: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  fulfillment_type: string;
  ship_address1?: string;
  ship_address2?: string;
  ship_city?: string;
  ship_province?: string;
  ship_postal_code?: string;
  subtotal: number;
  shipping_total: number;
  tps: number;
  tvq: number;
  total: number;
  items: OrderItem[];
}

function money(n: number): string {
  return n.toLocaleString("fr-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " $";
}

function baseHtml(inner: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${COLORS.ivoire};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${COLORS.noir};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.ivoire};padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06);">
        <tr><td style="background:${COLORS.noir};padding:28px 40px;text-align:center;">
          <img src="${LOGO_URL}" alt="${SHOP_NAME}" style="height:40px;width:auto;" />
        </td></tr>
        <tr><td style="padding:40px;">
          ${inner}
        </td></tr>
        <tr><td style="background:${COLORS.noir};padding:24px 40px;text-align:center;">
          <p style="margin:0 0 8px;font-size:13px;color:${COLORS.gris};">© 2026 ${SHOP_NAME}. Tous droits réservés.</p>
          <a href="https://reactool.ai" style="color:${COLORS.gris};font-size:12px;text-decoration:none;">Propulsé par Reactool</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function itemsTable(items: OrderItem[]): string {
  const rows = items.map((item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #F0EEE8;">
        <table cellpadding="0" cellspacing="0"><tr>
          ${item.image_url ? `<td style="width:60px;"><img src="${item.image_url}" alt="" style="width:48px;height:60px;object-fit:contain;object-position:top center;border-radius:4px;" /></td>` : ""}
          <td style="vertical-align:top;padding-left:12px;">
            <div style="font-weight:700;font-size:14px;">${item.name}</div>
            ${item.supplier ? `<div style="font-size:12px;color:${COLORS.gris};">${item.supplier}</div>` : ""}
            <div style="font-size:12px;color:${COLORS.gris};margin-top:2px;">
              ${item.color ? item.color : ""}${item.color && item.size ? " · " : ""}${item.size ? "Taille " + item.size : ""}
            </div>
          </td>
        </tr></table>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #F0EEE8;text-align:center;font-size:14px;">${item.quantity}</td>
      <td style="padding:12px 0;border-bottom:1px solid #F0EEE8;text-align:right;font-weight:700;font-size:14px;">${money(item.line_total)}</td>
    </tr>`).join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:${COLORS.gris};">
        <th style="text-align:left;padding-bottom:8px;">Article</th>
        <th style="text-align:center;padding-bottom:8px;">Qté</th>
        <th style="text-align:right;padding-bottom:8px;">Prix</th>
      </tr>
      ${rows}
    </table>`;
}

function totalsTable(order: OrderInfo): string {
  const address = order.fulfillment_type === "delivery"
    ? `${order.ship_address1 || ""}${order.ship_address2 ? ", " + order.ship_address2 : ""}<br>${order.ship_city || ""}, ${order.ship_province || "QC"} ${order.ship_postal_code || ""}`
    : "Ramassage en boutique";

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr><td style="font-size:14px;padding:4px 0;">Sous-total</td><td style="text-align:right;font-size:14px;padding:4px 0;">${money(order.subtotal)}</td></tr>
      <tr><td style="font-size:14px;padding:4px 0;">Livraison</td><td style="text-align:right;font-size:14px;padding:4px 0;">${order.shipping_total === 0 ? "Gratuite" : money(order.shipping_total)}</td></tr>
      <tr><td style="font-size:14px;padding:4px 0;">TPS (5%)</td><td style="text-align:right;font-size:14px;padding:4px 0;">${money(order.tps)}</td></tr>
      <tr><td style="font-size:14px;padding:4px 0;">TVQ (9,975%)</td><td style="text-align:right;font-size:14px;padding:4px 0;">${money(order.tvq)}</td></tr>
      <tr><td style="font-size:18px;font-weight:800;padding:12px 0 0;border-top:2px solid ${COLORS.ivoire};">Total</td><td style="text-align:right;font-size:18px;font-weight:800;padding:12px 0 0;border-top:2px solid ${COLORS.ivoire};">${money(order.total)}</td></tr>
    </table>
    <div style="margin-top:24px;padding:16px;background:${COLORS.ivoire};border-radius:8px;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:${COLORS.gris};margin-bottom:4px;">Mode de réception</div>
      <div style="font-size:14px;">${address}</div>
    </div>`;
}

export function orderConfirmationHtml(order: OrderInfo): string {
  return baseHtml(`
    <h1 style="font-size:26px;margin:0 0 8px;">Merci pour votre commande!</h1>
    <p style="font-size:15px;color:${COLORS.gris};margin:0 0 24px;">Bonjour ${order.customer_first_name}, votre commande a bien été confirmée.</p>
    <div style="background:${COLORS.ivoire};border-radius:8px;padding:16px;margin-bottom:24px;">
      <span style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:${COLORS.gris};">Numéro de commande</span>
      <div style="font-size:20px;font-weight:800;color:${COLORS.orange};">${order.order_number}</div>
    </div>
    ${itemsTable(order.items)}
    ${totalsTable(order)}
    <p style="font-size:14px;color:${COLORS.gris};margin-top:32px;">Vous recevrez un courriel à chaque étape de votre commande.</p>
  `);
}

export function newOrderNotifyHtml(order: OrderInfo): string {
  return baseHtml(`
    <h1 style="font-size:22px;margin:0 0 16px;">Nouvelle commande reçue</h1>
    <div style="background:${COLORS.ivoire};border-radius:8px;padding:16px;margin-bottom:24px;">
      <span style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:${COLORS.gris};">Numéro</span>
      <div style="font-size:20px;font-weight:800;color:${COLORS.orange};">${order.order_number}</div>
      <div style="font-size:14px;margin-top:8px;">Client: ${order.customer_first_name} ${order.customer_last_name}</div>
      <div style="font-size:14px;">Courriel: ${order.customer_email}</div>
    </div>
    ${itemsTable(order.items)}
    ${totalsTable(order)}
  `);
}

export function statusUpdateHtml(order_number: string, first_name: string, status: string): string {
  const messages: Record<string, { subject: string; body: string }> = {
    preparing: {
      subject: `Votre commande ${order_number} est en préparation`,
      body: "Votre commande est maintenant en préparation. Nous vous aviserons dès qu'elle sera prête.",
    },
    ready_for_pickup: {
      subject: `Votre commande ${order_number} est prête pour le ramassage`,
      body: "Bonne nouvelle! Votre commande est prête. Vous pouvez venir la chercher en boutique.",
    },
    shipping: {
      subject: `Votre commande ${order_number} est en livraison`,
      body: "Votre commande est en route! Vous devriez la recevoir sous peu.",
    },
    delivered: {
      subject: `Votre commande ${order_number} a été livrée`,
      body: "Votre commande a été livrée. Merci d'avoir magasiné chez nous!",
    },
  };
  const msg = messages[status] || messages.preparing;
  return baseHtml(`
    <h1 style="font-size:24px;margin:0 0 8px;">Bonjour ${first_name},</h1>
    <p style="font-size:15px;color:${COLORS.gris};margin:0 0 24px;">${msg.body}</p>
    <div style="background:${COLORS.ivoire};border-radius:8px;padding:16px;">
      <span style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:${COLORS.gris};">Commande</span>
      <div style="font-size:18px;font-weight:800;color:${COLORS.orange};">${order_number}</div>
    </div>
  `);
}

export async function sendEmail(to: string | string[], subject: string, html: string): Promise<boolean> {
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        reply_to: REPLY_TO,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

export { corsHeaders };
