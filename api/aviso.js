// Aviso por WhatsApp a Viex Salud (WhatsApp de Nicolás) por cada formulario enviado (CallMeBot).
// La clave va SOLO en la variable de entorno CALLMEBOT_APIKEY de Vercel.
// Se envían solo datos de contacto básicos: nada de salud.

const DESTINO = "+56948627767";
const ORIGENES = ["https://www.viexsalud.cl", "https://viexsalud.cl", "http://localhost:8091"];
const recientes = new Map(); // límite simple por IP (por instancia)

function limpio(v, max) {
  return String(v == null ? "" : v).replace(/[\r\n\t]+/g, " ").trim().slice(0, max);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  const origin = req.headers.origin || "";
  const permitido = ORIGENES.includes(origin) || /^https:\/\/viexsalud-pro-[a-z0-9-]+\.vercel\.app$/.test(origin);
  if (!permitido) return res.status(403).json({ ok: false });

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
  const telefono = limpio(d.telefono, 20).replace(/[^\d+]/g, "");
  const digitos = telefono.replace(/\D/g, "").replace(/^56/, "");
  if (nombre.length < 2 || !/^9\d{8}$/.test(digitos)) return res.status(400).json({ ok: false });

  const apikey = process.env.CALLMEBOT_APIKEY;
  if (!apikey) return res.status(503).json({ ok: false, motivo: "falta-clave" });

  const lineas = [
    "🔔 Nuevo lead · " + (limpio(d.origen, 60) || "sitio web"),
    "Nombre: " + nombre,
    "Teléfono: +56 " + digitos,
    d.edad && "Edad: " + limpio(d.edad, 10),
    d.region && "Región: " + limpio(d.region, 40),
    d.cargas && "Cargas: " + limpio(d.cargas, 60),
    d.sistema && "Hoy en: " + limpio(d.sistema, 30),
    d.pago && "Paga hoy: " + limpio(d.pago, 30),
    "Escribirle: https://wa.me/56" + digitos,
  ].filter(Boolean);

  const url = "https://api.callmebot.com/whatsapp.php?phone=" + encodeURIComponent(DESTINO) +
    "&text=" + encodeURIComponent(lineas.join("\n")) + "&apikey=" + encodeURIComponent(apikey);

  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(9000) });
    const texto = (await r.text()).slice(0, 300);
    const ok = r.ok && !/error|invalid|unregistered/i.test(texto.replace(/<[^>]*>/g, " "));
    if (!ok) console.warn("CallMeBot respondió:", r.status, texto.replace(/<[^>]*>/g, " ").slice(0, 160));
    return res.status(ok ? 200 : 502).json({ ok });
  } catch (e) {
    console.warn("CallMeBot no respondió:", e && e.message);
    return res.status(502).json({ ok: false });
  }
};
