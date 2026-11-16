// Puente con la planilla "Leads Viex Salud" (Apps Script en el Drive de viexlatam).
// Reemplaza a Supabase. Variables en Vercel: LEADS_SHEET_URL (URL /exec) y DRIVE_CLAVE.
async function drive(accion, datos) {
  const url = process.env.LEADS_SHEET_URL;
  const clave = process.env.DRIVE_CLAVE;
  if (!url || !clave) throw new Error("Falta configurar LEADS_SHEET_URL o DRIVE_CLAVE en Vercel.");
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    signal: AbortSignal.timeout(25000),
    body: JSON.stringify(Object.assign({ accion, clave }, datos || {})),
  });
  const texto = await r.text();
  let j;
  try { j = JSON.parse(texto); } catch (e) { throw new Error("Drive respondió algo inesperado (" + r.status + ")."); }
  if (!j.ok) throw new Error("Drive: " + (j.motivo || "error"));
  return j;
}

module.exports = { drive };
