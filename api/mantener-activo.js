// Mantiene activa la base de datos (Supabase) aunque el sitio no tenga visitas.
// Supabase pausa los proyectos gratis tras ~7 días sin actividad; Vercel llama a esta
// función todos los días (ver "crons" en vercel.json) y hace una consulta real a la base.
// Solo lee 1 fila y no devuelve datos.

const SUPABASE_URL = "https://jniaoqcgpdryqrssntfp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_BCFzQF1HZw8EPsGsdNvXCQ_0ILWpQB6";

module.exports = async (req, res) => {
  try {
    const r = await fetch(SUPABASE_URL + "/rest/v1/cotizaciones_web?select=created_at&limit=1", {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + SUPABASE_ANON_KEY },
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) console.error("Supabase respondió", r.status, (await r.text()).slice(0, 200));
    return res.status(r.ok ? 200 : 502).json({ ok: r.ok, fecha: new Date().toISOString() });
  } catch (e) {
    console.error("Supabase no responde (¿pausado?):", e && e.message);
    return res.status(502).json({ ok: false });
  }
};
