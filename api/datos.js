// Guarda datos del sitio en el Drive de viexlatam (reemplaza las tablas de Supabase):
//  - suscriptores del blog (público)
//  - comparaciones del Comparador de Planes (solo ejecutivos con sesión)
//  - archivos de respaldo del comparador (solo ejecutivos con sesión)
const { drive } = require("./_lib/drive");
const { leerSesion } = require("./_lib/sesion");

const recientes = new Map();
const TABLAS = { suscriptores: "Suscriptores", comparaciones: "Comparaciones" };
const CAMPOS_COMPARACION = ["cliente_nombre", "prioridad", "familia", "plan_actual", "ofertas", "recomendado", "segunda_alternativa"];

function texto(v, max) {
  const s = typeof v === "object" && v !== null ? JSON.stringify(v) : String(v == null ? "" : v);
  return s.slice(0, max);
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido." });
  const o = req.headers.origin || "";
  if (o && !/^https:\/\/(www\.)?viexsalud\.cl$/.test(o) && !/^https:\/\/viexsalud-pro-[a-z0-9-]+\.vercel\.app$/.test(o) && !/^http:\/\/localhost:\d+$/.test(o)) {
    return res.status(403).json({ error: "Origen no permitido." });
  }

  let d = req.body || {};
  if (typeof d === "string") { try { d = JSON.parse(d); } catch (e) { d = {}; } }
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "x";
  const ahora = Date.now();
  const lista = (recientes.get(ip) || []).filter((t) => ahora - t < 3600000);
  if (lista.length >= 60) return res.status(429).json({ error: "Demasiadas solicitudes." });
  lista.push(ahora);
  recientes.set(ip, lista);

  try {
    if (d.tabla === "suscriptores") {
      const email = String(d.fila && d.fila.email || "").trim().toLowerCase().slice(0, 120);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ error: "Correo no válido." });
      const existe = (await drive("buscar", { hoja: "Suscriptores", campo: "email", valor: email })).fila;
      if (!existe) await drive("agregar", { hoja: "Suscriptores", fila: { created_at: new Date().toISOString(), email, fuente: texto(d.fila.fuente, 200) } });
      return res.status(200).json({ ok: true });
    }

    const sesion = leerSesion(req);
    if (!sesion) return res.status(401).json({ error: "Tu sesión expiró, vuelve a iniciar sesión." });

    if (d.tabla === "comparaciones") {
      const fila = { created_at: new Date().toISOString(), ejecutivo_email: sesion.email, ejecutivo_nombre: sesion.nombre };
      CAMPOS_COMPARACION.forEach((k) => { fila[k] = texto(d.fila && d.fila[k], 40000); });
      await drive("agregar", { hoja: TABLAS.comparaciones, fila });
      return res.status(200).json({ ok: true });
    }

    if (d.archivo) {
      const base64 = String(d.archivo.base64 || "");
      if (!base64 || base64.length > 4.2e6) return res.status(413).json({ error: "El archivo pesa más de 3 MB." });
      const nombre = String(d.archivo.nombre || "archivo").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
      const r = await drive("subir", { nombre: Date.now() + "-" + nombre, base64, tipo: String(d.archivo.tipo || "").slice(0, 80), carpeta: sesion.email });
      return res.status(200).json({ ok: true, id: r.id });
    }

    return res.status(400).json({ error: "Tabla no válida." });
  } catch (e) {
    console.error("datos:", e.message);
    return res.status(502).json({ error: "No se pudo guardar. Intenta de nuevo." });
  }
};
