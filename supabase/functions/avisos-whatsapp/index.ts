// Pido y Ido: avisos por WhatsApp desde el número de Pido y Ido (WhatsApp Business Cloud API de Meta).
// Lo llama un "Database Webhook" de Supabase cada vez que se crea o cambia un pedido (tabla orders).
//
// Secretos (Supabase > Edge Functions > Secrets):
//   WHATSAPP_TOKEN     token permanente del "System user" de Meta
//   WHATSAPP_PHONE_ID  "Phone number ID" del número de Pido y Ido (no es el número mismo)
//   AVISOS_SECRET      una clave larga inventada; la misma va en el webhook como header x-pyi-secret
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY ya existen en toda Edge Function.
//
// Plantillas (WhatsApp Manager > Plantillas, categoría "Utilidad", idioma Español "es"):
//   pyi_pedido_nuevo      -> al negocio:  {{1}} número de pedido, {{2}} nombre del cliente, {{3}} total
//   pyi_pedido_aceptado   -> al cliente:  {{1}} negocio, {{2}} número de pedido, {{3}} minutos
//   pyi_pedido_en_camino  -> al cliente:  {{1}} negocio, {{2}} número de pedido
//   pyi_pedido_rechazado  -> al cliente:  {{1}} negocio, {{2}} número de pedido
// El cliente solo recibe avisos si marcó "Avísame por WhatsApp" (customer.wa = true).

const GRAPH = "https://graph.facebook.com/v23.0";

type Order = {
  id: number; rest_id: string; status: string; total: number; eta_min: number | null; wish: string | null;
  customer: { name?: string; phone?: string; wa?: boolean };
};

const pad = (id: number) => String(id).padStart(4, "0");
const money = (n: number) => "$" + Math.round(n || 0).toLocaleString("es-CO");
const first = (s = "") => s.trim().split(/\s+/)[0] || "cliente";
const intl = (p = "") => { const d = p.replace(/\D/g, ""); return d.length === 10 ? "57" + d : d; };

async function db(path: string) {
  const url = Deno.env.get("SUPABASE_URL") + "/rest/v1/" + path;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const r = await fetch(url, { headers: { apikey: key, Authorization: "Bearer " + key } });
  return r.ok ? await r.json() : [];
}

async function restInfo(restId: string) {
  const [rest] = await db("restaurants?select=name,short,phone&id=eq." + encodeURIComponent(restId));
  const [ct] = await db("rest_contact?select=phone&rest_id=eq." + encodeURIComponent(restId));
  return { name: rest?.short || rest?.name || "El negocio", phone: ct?.phone || rest?.phone || "" };
}

async function send(to: string, template: string, params: string[]) {
  if (!to) return { skipped: "no_phone" };
  const r = await fetch(GRAPH + "/" + Deno.env.get("WHATSAPP_PHONE_ID") + "/messages", {
    method: "POST",
    headers: { Authorization: "Bearer " + Deno.env.get("WHATSAPP_TOKEN"), "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp", to: intl(to), type: "template",
      template: { name: template, language: { code: "es" },
        components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text: String(text).slice(0, 200) })) }] },
    }),
  });
  const out = await r.json().catch(() => ({}));
  if (!r.ok) console.error("whatsapp", template, r.status, JSON.stringify(out));
  return out;
}

Deno.serve(async (req) => {
  if (req.headers.get("x-pyi-secret") !== Deno.env.get("AVISOS_SECRET")) return new Response("no", { status: 401 });
  const ev = await req.json().catch(() => null);
  if (!ev || ev.table !== "orders" || !ev.record) return new Response("ignorado");
  const o: Order = ev.record, old: Order | null = ev.old_record;
  const wantsWa = !!o.customer?.wa;
  const res: unknown[] = [];

  if (ev.type === "INSERT") {
    const r = await restInfo(o.rest_id);
    res.push(await send(r.phone, "pyi_pedido_nuevo", [pad(o.id), first(o.customer?.name), o.wish ? "por confirmar" : money(o.total)]));
  } else if (ev.type === "UPDATE" && old && old.status !== o.status && wantsWa) {
    const r = await restInfo(o.rest_id);
    const to = o.customer?.phone || "";
    if (o.status === "preparando") res.push(await send(to, "pyi_pedido_aceptado", [r.name, pad(o.id), String(o.eta_min || 30)]));
    if (o.status === "en_camino") res.push(await send(to, "pyi_pedido_en_camino", [r.name, pad(o.id)]));
    if (o.status === "rechazado") res.push(await send(to, "pyi_pedido_rechazado", [r.name, pad(o.id)]));
  }
  return new Response(JSON.stringify({ ok: true, res }), { headers: { "Content-Type": "application/json" } });
});
