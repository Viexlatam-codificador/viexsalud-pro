// Resumen para el panel de administración: visitas (Google Analytics 4) +
// actividad del sitio (Supabase). Solo responde al correo administrador.
const crypto = require("crypto");

const SUPABASE_URL = "https://jniaoqcgpdryqrssntfp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_BCFzQF1HZw8EPsGsdNvXCQ_0ILWpQB6";
const ADMIN_EMAIL = "viexlatam@gmail.com";

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function getGoogleAccessToken(clientEmail, privateKey) {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };
  const unsigned = base64url(JSON.stringify(header)) + "." + base64url(JSON.stringify(claim));
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  const signature = signer
    .sign(privateKey)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const jwt = unsigned + "." + signature;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:
      "grant_type=" +
      encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer") +
      "&assertion=" +
      jwt,
  });
  const json = await res.json();
  if (!res.ok) throw new Error("No se pudo autenticar con Google: " + (json.error_description || json.error));
  return json.access_token;
}

async function runReport(accessToken, propertyId, body) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error((json.error && json.error.message) || "Error consultando Google Analytics.");
  return json;
}

function rowsToMap(report, dimCount) {
  const map = {};
  (report.rows || []).forEach((row) => {
    const key = row.dimensionValues.slice(0, dimCount).map((d) => d.value).join("|");
    map[key] = row.metricValues.map((m) => Number(m.value));
  });
  return map;
}

async function getGa4Summary() {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const clientEmail = process.env.GA4_SA_EMAIL;
  const privateKeyRaw = process.env.GA4_SA_PRIVATE_KEY;
  if (!propertyId || !clientEmail || !privateKeyRaw) {
    return { configured: false };
  }
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
  const accessToken = await getGoogleAccessToken(clientEmail, privateKey);

  const [overview, daily, events] = await Promise.all([
    runReport(accessToken, propertyId, {
      dateRanges: [
        { startDate: "today", endDate: "today", name: "hoy" },
        { startDate: "yesterday", endDate: "yesterday", name: "ayer" },
        { startDate: "7daysAgo", endDate: "today", name: "ultimos7" },
      ],
      dimensions: [{ name: "dateRange" }],
      metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }],
    }),
    runReport(accessToken, propertyId, {
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "activeUsers" }],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    }),
    runReport(accessToken, propertyId, {
      dateRanges: [
        { startDate: "today", endDate: "today", name: "hoy" },
        { startDate: "7daysAgo", endDate: "today", name: "ultimos7" },
      ],
      dimensions: [{ name: "dateRange" }, { name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        filter: { fieldName: "eventName", inListFilter: { values: ["generate_lead", "whatsapp_click"] } },
      },
    }),
  ]);

  const ov = rowsToMap(overview, 1);
  const ev = rowsToMap(events, 2);

  return {
    configured: true,
    visitas: {
      hoy: (ov["hoy"] || [0, 0, 0])[0],
      ayer: (ov["ayer"] || [0, 0, 0])[0],
      ultimos7: (ov["ultimos7"] || [0, 0, 0])[0],
      sesionesHoy: (ov["hoy"] || [0, 0, 0])[1],
      paginasVistasHoy: (ov["hoy"] || [0, 0, 0])[2],
    },
    serieDiaria: (daily.rows || []).map((row) => ({
      fecha: row.dimensionValues[0].value,
      visitas: Number(row.metricValues[0].value),
    })),
    eventos: {
      whatsappHoy: (ev["hoy|whatsapp_click"] || [0])[0],
      whatsapp7dias: (ev["ultimos7|whatsapp_click"] || [0])[0],
      formularioHoy: (ev["hoy|generate_lead"] || [0])[0],
      formulario7dias: (ev["ultimos7|generate_lead"] || [0])[0],
    },
  };
}

async function getSupabaseSummary(serviceKey) {
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
  const todayIso = new Date();
  todayIso.setHours(0, 0, 0, 0);
  const todayFilter = `created_at=gte.${todayIso.toISOString()}`;

  const [compTotal, compHoy, subTotal, subHoy, users] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/comparaciones?select=id`, { headers: { ...headers, Prefer: "count=exact" } }),
    fetch(`${SUPABASE_URL}/rest/v1/comparaciones?select=id&${todayFilter}`, { headers: { ...headers, Prefer: "count=exact" } }),
    fetch(`${SUPABASE_URL}/rest/v1/suscriptores?select=id`, { headers: { ...headers, Prefer: "count=exact" } }),
    fetch(`${SUPABASE_URL}/rest/v1/suscriptores?select=id&${todayFilter}`, { headers: { ...headers, Prefer: "count=exact" } }),
    fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, { headers }),
  ]);

  function countFrom(res) {
    const range = res.headers.get("content-range") || "";
    const total = range.split("/")[1];
    return total && total !== "*" ? Number(total) : 0;
  }

  const usersJson = users.ok ? await users.json() : { users: [] };

  return {
    comparaciones: { total: countFrom(compTotal), hoy: countFrom(compHoy) },
    suscriptores: { total: countFrom(subTotal), hoy: countFrom(subHoy) },
    ejecutivos: { total: (usersJson.users || []).length },
  };
}

module.exports = async (req, res) => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    res.status(500).json({ error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en Vercel." });
    return;
  }

  const authHeader = req.headers.authorization || "";
  const accessToken = authHeader.replace(/^Bearer\s+/i, "");
  if (!accessToken) {
    res.status(401).json({ error: "Sesión no encontrada." });
    return;
  }

  try {
    const meRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${accessToken}`, apikey: SUPABASE_ANON_KEY },
    });
    const me = await meRes.json();
    if (!meRes.ok || !me.email || me.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      res.status(403).json({ error: "Solo el administrador puede ver este panel." });
      return;
    }

    const [supabaseSummary, ga4Summary] = await Promise.all([
      getSupabaseSummary(serviceKey),
      getGa4Summary().catch((err) => ({ configured: true, error: err.message })),
    ]);

    res.status(200).json({ supabase: supabaseSummary, ga4: ga4Summary });
  } catch (err) {
    res.status(500).json({ error: "Error inesperado generando el panel.", detail: err.message });
  }
};
