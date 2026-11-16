// Exporta comparaciones, ejecutivos, suscriptores y formularios guardados en el Drive
// de viexlatam, como CSV. Solo para el correo administrador.
const { drive } = require("./_lib/drive");
const { leerSesion } = require("./_lib/sesion");

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
  const sesion = leerSesion(req);
  if (!sesion) { res.status(401).json({ error: "Sesión no encontrada." }); return; }
  if (!sesion.admin) { res.status(403).json({ error: "Solo el administrador puede exportar estos datos." }); return; }
  try {
    const [ejec, comp, subs, leads] = await Promise.all(
      ["Ejecutivos", "Comparaciones", "Suscriptores", "Leads"].map((hoja) => drive("listar", { hoja }).then((r) => (r.filas || []).reverse()))
    );
    const leadCols = leads.length ? Object.keys(leads[0]) : ["Fecha", "Origen", "Nombre", "Teléfono"];
    const csv =
      "EJECUTIVOS REGISTRADOS\n" +
      toCsv(ejec, ["nombre", "telefono", "email", "estado", "creado", "ultimo_ingreso"]) +
      "\n\nCOMPARACIONES\n" +
      toCsv(comp, ["created_at", "ejecutivo_nombre", "ejecutivo_email", "cliente_nombre", "prioridad", "familia", "plan_actual", "ofertas", "recomendado", "segunda_alternativa"]) +
      "\n\nSUSCRIPTORES DEL BLOG\n" +
      toCsv(subs, ["created_at", "email", "fuente"]) +
      "\n\nFORMULARIOS DEL SITIO\n" +
      toCsv(leads, leadCols);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="viexsalud-datos.csv"');
    res.status(200).send("\ufeff" + csv);
  } catch (err) {
    res.status(500).json({ error: "Error inesperado exportando datos.", detail: err.message });
  }
};
