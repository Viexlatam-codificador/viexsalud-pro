// Exporta todas las comparaciones guardadas y la lista de ejecutivos
// registrados, como CSV. Solo funciona para el correo administrador
// (verificado con la service_role key, nunca expuesta al navegador).
const SUPABASE_URL = "https://jniaoqcgpdryqrssntfp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_BCFzQF1HZw8EPsGsdNvXCQ_0ILWpQB6";
const ADMIN_EMAIL = "viexlatam@gmail.com";

function csvEscape(v) {
  if (v === null || v === undefined) return "";
  var s = typeof v === "object" ? JSON.stringify(v) : String(v);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function toCsv(rows, columns) {
  var lines = [columns.join(",")];
  rows.forEach(function (row) {
    lines.push(columns.map(function (c) { return csvEscape(row[c]); }).join(","));
  });
  return lines.join("\n");
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
      res.status(403).json({ error: "Solo el administrador puede exportar estos datos." });
      return;
    }

    const compRes = await fetch(
      `${SUPABASE_URL}/rest/v1/comparaciones?select=*&order=created_at.desc`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    );
    const comparaciones = await compRes.json();
    if (!compRes.ok) {
      res.status(502).json({ error: "No se pudo leer la tabla de comparaciones.", detail: comparaciones });
      return;
    }

    const usersRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    const usersJson = await usersRes.json();
    const users = (usersJson.users || []).map((u) => ({
      nombre: u.user_metadata && u.user_metadata.nombre,
      telefono: u.user_metadata && u.user_metadata.telefono,
      email: u.email,
      creado: u.created_at,
      ultimo_ingreso: u.last_sign_in_at,
    }));

    const csv =
      "EJECUTIVOS REGISTRADOS\n" +
      toCsv(users, ["nombre", "telefono", "email", "creado", "ultimo_ingreso"]) +
      "\n\nCOMPARACIONES\n" +
      toCsv(comparaciones, [
        "created_at",
        "ejecutivo_email",
        "cliente_nombre",
        "prioridad",
        "familia",
        "plan_actual",
        "ofertas",
        "recomendado",
        "segunda_alternativa",
      ]);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="viexsalud-comparaciones.csv"');
    res.status(200).send("﻿" + csv);
  } catch (err) {
    res.status(500).json({ error: "Error inesperado exportando datos.", detail: err.message });
  }
};
