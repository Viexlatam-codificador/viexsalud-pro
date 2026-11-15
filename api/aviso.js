// Cada formulario enviado: 1) se guarda en la planilla de Google del cliente (LEADS_SHEET_URL,
// que además le manda un correo) y 2) se avisa por WhatsApp, sin que la persona apriete nada.
// Código de la planilla: v3rtice-agencia/herramientas/planilla-leads/Codigo.gs
// Envía por el número oficial "V3RTICE Leads" (API de WhatsApp de Meta) si está configurado;
// si no, usa CallMeBot como respaldo. Las claves van SOLO en variables de entorno de Vercel:
//   Meta:      WHATSAPP_TOKEN, WHATSAPP_PHONE_ID (opcional WHATSAPP_PLANTILLA, WHATSAPP_IDIOMA)
//   CallMeBot: CALLMEBOT_APIKEY
// Llegan todos los datos que la persona escribió en el formulario (campo "datos": lista de [etiqueta, valor]).

const CLIENTE = "Viex Salud";
const DESTINO = "+56948627767";
const ORIGENES = ["https://www.viexsalud.cl", "https://viexsalud.cl", "http://localhost:8091"];
const PREVIEW = /^https:\/\/viexsalud-pro-[a-z0-9-]+\.vercel\.app$/;
const recientes = new Map(); // límite simple por IP (por instancia)

function limpio(v, max) {
  return String(v == null ? "" : v).replace(/[\r\n\t]+/g, " ").replace(/ {2,}/g, " ").trim().slice(0, max);
}

// Plantilla "nuevo_lead" aprobada en Meta (5 variables, ver guía de la agencia).
async function enviarMeta(lead) {
  const r = await fetch("https://graph.facebook.com/v23.0/" + process.env.WHATSAPP_PHONE_ID + "/messages", {
    method: "POST",
    headers: { Authorization: "Bearer " + process.env.WHATSAPP_TOKEN, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(9000),
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: DESTINO.replace(/\D/g, ""),
      type: "template",
      template: {
        name: process.env.WHATSAPP_PLANTILLA || "nuevo_lead",
        language: { code: process.env.WHATSAPP_IDIOMA || "es" },
        components: [{
          type: "body",
          parameters: [CLIENTE + " · " + lead.origen, lead.nombre, "+56 " + lead.digitos, lead.resumen || "Sin más datos", "56" + lead.digitos]
            .map((t) => ({ type: "text", text: limpio(t, 700) })),
        }],
      },
    }),
  });
  const texto = (await r.text()).slice(0, 300);
  if (!r.ok) console.warn("WhatsApp Meta respondió:", r.status, texto);
  return r.ok;
}

async function guardarPlanilla(lead) {
  const r = await fetch(process.env.LEADS_SHEET_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({ origen: lead.origen, nombre: lead.nombre, telefono: lead.digitos, datos: lead.campos }),
  });
  const texto = (await r.text()).slice(0, 300);
  let ok = false;
  try { ok = r.ok && JSON.parse(texto).ok === true; } catch (e) { ok = false; }
  if (!ok) console.warn("Planilla respondió:", r.status, texto.slice(0, 160));
  return ok;
}

async function enviarCallMeBot(lead) {
  const lineas = ["🔔 Nuevo lead · " + lead.origen, "Nombre: " + lead.nombre, "Teléfono: +56 " + lead.digitos]
    .concat(lead.detalle, ["Escribirle: https://wa.me/56" + lead.digitos]);
  const url = "https://api.callmebot.com/whatsapp.php?phone=" + encodeURIComponent(DESTINO) +
    "&text=" + encodeURIComponent(lineas.join("\n")) + "&apikey=" + encodeURIComponent(process.env.CALLMEBOT_APIKEY);
  const r = await fetch(url, { signal: AbortSignal.timeout(9000) });
  const texto = (await r.text()).slice(0, 300).replace(/<[^>]*>/g, " ");
  const ok = r.ok && !/error|invalid|unregistered/i.test(texto);
  if (!ok) console.warn("CallMeBot respondió:", r.status, texto.slice(0, 160));
  return ok;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  const origin = req.headers.origin || "";
  if (!ORIGENES.includes(origin) && !PREVIEW.test(origin)) return res.status(403).json({ ok: false });

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "x";
  const ahora = Date.now();
  const lista = (recientes.get(ip) || []).filter((t) => ahora - t < 3600000);
  if (lista.length >= 5) return res.status(429).json({ ok: false });
  lista.push(ahora);
  recientes.set(ip, lista);

  let d = req.body || {};
  if (typeof d === "string") { try { d = JSON.parse(d); } catch (e) { d = {}; } }
  if (d.web) return res.status(200).json({ ok: true }); // trampa anti-spam

  const nombre = limpio(d.nombre, 80);
  const digitos = limpio(d.telefono, 20).replace(/\D/g, "").replace(/^56/, "");
  if (nombre.length < 2 || !/^9\d{8}$/.test(digitos)) return res.status(400).json({ ok: false });

  const base = [["Edad", d.edad], ["Región", d.region], ["Cargas", d.cargas], ["Hoy en", d.sistema], ["Paga hoy", d.pago]];
  const campos = (Array.isArray(d.datos) ? d.datos.slice(0, 20) : base)
    .filter((c) => Array.isArray(c) && limpio(c[1], 1))
    .map(([k, v]) => [limpio(k, 30), limpio(v, 300)]);
  const lead = {
    origen: limpio(d.origen, 60) || "sitio web",
    nombre,
    digitos,
    campos,
    detalle: campos.map(([k, v]) => k + ": " + v),
    resumen: limpio(campos.map(([k, v]) => k + ": " + v).join(" · "), 700),
  };

  const meta = process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID;
  const tareas = [];
  if (process.env.LEADS_SHEET_URL) tareas.push(guardarPlanilla(lead));
  if (meta) tareas.push(enviarMeta(lead));
  else if (process.env.CALLMEBOT_APIKEY) tareas.push(enviarCallMeBot(lead));
  if (!tareas.length) return res.status(503).json({ ok: false, motivo: "falta-clave" });

  const resultados = await Promise.all(tareas.map((t) => t.catch((e) => {
    console.warn("El aviso no salió:", e && e.message);
    return false;
  })));
  const ok = resultados.some(Boolean);
  return res.status(ok ? 200 : 502).json({ ok });
};
