// Receives the website's contact/demo forms.
// Set ONE of these in Vercel > Settings > Environment Variables:
//   FORM_WEBHOOK_URL  - any webhook (Zapier, Make, HubSpot, Google Apps Script...) that should get each lead
//   RESEND_API_KEY + LEAD_EMAIL_TO - email each lead via resend.com
export async function POST(req: Request) {
  const data = await req.json().catch(() => null);
  if (!data || typeof data !== "object") return Response.json({ ok: false }, { status: 400 });
  const lines = Object.entries(data).map(([k, v]) => `${k}: ${String(v).slice(0, 2000)}`).join("\n");
  try {
    if (process.env.FORM_WEBHOOK_URL) {
      const r = await fetch(process.env.FORM_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error(`webhook ${r.status}`);
    } else if (process.env.RESEND_API_KEY && process.env.LEAD_EMAIL_TO) {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: process.env.LEAD_EMAIL_FROM || "NeOffice website <onboarding@resend.dev>", to: process.env.LEAD_EMAIL_TO.split(","), subject: `New website enquiry: ${data.form || "form"}`, text: lines }),
      });
      if (!r.ok) throw new Error(`resend ${r.status}`);
    } else {
      console.warn("Lead received but no FORM_WEBHOOK_URL or RESEND_API_KEY is set:\n" + lines);
      return Response.json({ ok: false, error: "not configured" }, { status: 503 });
    }
    return Response.json({ ok: true });
  } catch (e) {
    console.error("Lead delivery failed", e, lines);
    return Response.json({ ok: false }, { status: 502 });
  }
}
