// Traspaso único de Supabase al Drive de viexlatam: ejecutivos, comparaciones,
// suscriptores y cotizaciones antiguas. Se puede repetir sin duplicar (salta lo que ya está).
// Protegido con la cabecera x-clave = DRIVE_CLAVE. Las contraseñas no se pueden traspasar:
// cada ejecutivo crea una nueva con "¿Olvidaste tu contraseña?".
const { drive } = require("./_lib/drive");

const SUPABASE_URL = "https://jniaoqcgpdryqrssntfp.supabase.co";

const aTexto = (v) => (v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v));

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido." });
  if (!process.env.DRIVE_CLAVE || req.headers["x-clave"] !== process.env.DRIVE_CLAVE) return res.status(403).json({ error: "No autorizado." });
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return res.status(500).json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY." });
  const h = { apikey: key, Authorization: "Bearer " + key };
  const leer = async (ruta) => {
    const r = await fetch(SUPABASE_URL + ruta, { headers: h, signal: AbortSignal.timeout(20000) });
    if (!r.ok) throw new Error("Supabase " + r.status + " en " + ruta.split("?")[0]);
    return r.json();
  };

  try {
    const [usuarios, comparaciones, suscriptores, cotizaciones] = await Promise.all([
      leer("/auth/v1/admin/users?per_page=1000").then((j) => j.users || []),
      leer("/rest/v1/comparaciones?select=*&order=created_at.asc"),
      leer("/rest/v1/suscriptores?select=*&order=created_at.asc"),
      leer("/rest/v1/cotizaciones_web?select=*&order=created_at.asc"),
    ]);
    const [yaEjec, yaComp, yaSubs, yaCot] = await Promise.all(
      ["Ejecutivos", "Comparaciones", "Suscriptores", "Cotizaciones antiguas"].map((hoja) => drive("listar", { hoja }).then((r) => r.filas || []))
    );
    const emails = new Set(yaEjec.map((f) => String(f.email).toLowerCase()));
    const idsComp = new Set(yaComp.map((f) => String(f.supabase_id)));
    const subs = new Set(yaSubs.map((f) => String(f.email).toLowerCase()));
    const idsCot = new Set(yaCot.map((f) => String(f.supabase_id)));

    const nuevosEjec = usuarios.filter((u) => u.email && !emails.has(u.email.toLowerCase())).map((u) => ({
      creado: u.created_at, nombre: (u.user_metadata && u.user_metadata.nombre) || "", telefono: (u.user_metadata && u.user_metadata.telefono) || "",
      email: u.email.toLowerCase(), estado: "activo", clave_hash: "", ultimo_ingreso: u.last_sign_in_at || "", origen: "Supabase",
    }));
    const nuevasComp = comparaciones.filter((c) => !idsComp.has(String(c.id))).map((c) => {
      const f = { supabase_id: c.id };
      Object.keys(c).forEach((k) => { if (k !== "id") f[k] = aTexto(c[k]); });
      return f;
    });
    const nuevosSubs = suscriptores.filter((s) => s.email && !subs.has(s.email.toLowerCase()))
      .map((s) => ({ created_at: s.created_at, email: s.email.toLowerCase(), fuente: s.fuente || "" }));
    const nuevasCot = cotizaciones.filter((c) => !idsCot.has(String(c.id))).map((c) => {
      const f = { supabase_id: c.id };
      Object.keys(c).forEach((k) => { if (k !== "id") f[k] = aTexto(c[k]); });
      return f;
    });

    const lotes = async (hoja, filas) => {
      for (let i = 0; i < filas.length; i += 200) await drive("agregarVarias", { hoja, filas: filas.slice(i, i + 200) });
    };
    await lotes("Ejecutivos", nuevosEjec);
    await lotes("Comparaciones", nuevasComp);
    await lotes("Suscriptores", nuevosSubs);
    await lotes("Cotizaciones antiguas", nuevasCot);

    return res.status(200).json({
      ok: true,
      encontrados: { ejecutivos: usuarios.length, comparaciones: comparaciones.length, suscriptores: suscriptores.length, cotizaciones: cotizaciones.length },
      traspasados: { ejecutivos: nuevosEjec.length, comparaciones: nuevasComp.length, suscriptores: nuevosSubs.length, cotizaciones: nuevasCot.length },
    });
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
};
