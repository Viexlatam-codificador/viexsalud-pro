const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function clean(value, max = 180) {
  return String(value || '').trim().slice(0, max);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(503).json({ ok: false, error: 'storage_not_configured' });

  const b = req.body || {};
  const lead = {
    nombre: clean(b.nombre),
    telefono: clean(b.telefono, 40),
    edad: Number(b.edad) || null,
    cargas: b.cargas === 'si' ? 1 : 0,
    fuente: clean(b.fuente || 'web', 80),
    campana: clean(b.utm_campaign, 150),
    utm_source: clean(b.utm_source, 100),
    utm_medium: clean(b.utm_medium, 100),
    utm_campaign: clean(b.utm_campaign, 150),
    necesidad: clean([b.sexo && `Sexo: ${b.sexo}`, b.region && `Región: ${b.region}`].filter(Boolean).join(' | '), 500),
    estado: 'nuevo',
    consentimiento_contacto: true
  };

  if (!lead.nombre || !lead.telefono || !lead.edad) {
    return res.status(400).json({ ok: false, error: 'missing_fields' });
  }

  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(lead)
    });
    if (!r.ok) throw new Error(await r.text());
    const rows = await r.json();
    return res.status(201).json({ ok: true, id: rows?.[0]?.id || null });
  } catch (e) {
    console.error('lead_capture_failed', e.message);
    return res.status(500).json({ ok: false, error: 'save_failed' });
  }
}
