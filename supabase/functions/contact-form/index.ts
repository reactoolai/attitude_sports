import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, sendEmail } from "../_shared/email.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "Tous les champs sont requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Service non configuré" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F2F0EB;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F0EB;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
<tr><td style="background:#16161A;padding:24px 40px;text-align:center;">
<span style="color:#F2F0EB;font-size:20px;font-weight:800;letter-spacing:.05em;">Attitude Sports</span>
</td></tr>
<tr><td style="padding:40px;">
<h1 style="font-size:22px;margin:0 0 16px;">Nouveau message du formulaire de contact</h1>
<table cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;">
<tr><td style="padding:4px 0;color:#9C9CA4;font-weight:600;width:80px;">Nom:</td><td style="padding:4px 0;">${name}</td></tr>
<tr><td style="padding:4px 0;color:#9C9CA4;font-weight:600;">Courriel:</td><td style="padding:4px 0;">${email}</td></tr>
<tr><td style="padding:4px 0;color:#9C9CA4;font-weight:600;">Sujet:</td><td style="padding:4px 0;">${subject || '(non précisé)'}</td></tr>
</table>
<div style="margin-top:20px;padding:16px;background:#F2F0EB;border-radius:8px;font-size:14px;line-height:1.6;white-space:pre-wrap;">${message}</div>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Attitude Sports <info@lechoixdesophie.com>",
        reply_to: email,
        to: ["info@lechoixdesophie.com"],
        subject: `Contact: ${subject || 'Nouveau message'}`,
        html,
      }),
    });

    if (!resp.ok) {
      return new Response(JSON.stringify({ error: "Erreur d'envoi" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
