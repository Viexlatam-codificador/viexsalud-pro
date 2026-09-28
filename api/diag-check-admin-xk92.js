// Diagnóstico temporal: confirma si existe la cuenta admin en Supabase Auth.
// Se borra apenas se usa una vez. Protegido por una clave de un solo uso
// (no relacionada a ninguna cuenta real) para no exponer nada públicamente.
const SUPABASE_URL = "https://jniaoqcgpdryqrssntfp.supabase.co";
const DIAG_KEY = "0460b6f268369f686435dd2140d5e680";
const ADMIN_EMAIL = "viexlatam@gmail.com";

module.exports = async (req, res) => {
  if (req.headers["x-diag-key"] !== DIAG_KEY) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    res.status(500).json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY" });
    return;
  }
  try {
    const r = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    );
    const json = await r.json();
    const users = json.users || [];
    const admin = users.find((u) => (u.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase());
    res.status(200).json({
      totalUsuarios: users.length,
      todosLosCorreos: users.map((u) => u.email),
      adminExiste: !!admin,
      adminDetalle: admin
        ? {
            email: admin.email,
            creado: admin.created_at,
            ultimoIngreso: admin.last_sign_in_at,
            emailConfirmado: !!admin.email_confirmed_at,
            baneado: admin.banned_until || null,
          }
        : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message, cause: err.cause ? String(err.cause) : null, stack: err.stack });
  }
};
