// Elimina uno o varios archivos de preexistencias directamente del
// repositorio de GitHub. Solo funciona para el correo administrador
// (verificado contra Supabase) y usa un token de GitHub con permiso
// de escritura, guardado como variable de entorno (nunca en el navegador).
const SUPABASE_URL = "https://jniaoqcgpdryqrssntfp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_BCFzQF1HZw8EPsGsdNvXCQ_0ILWpQB6";
const ADMIN_EMAIL = "viexlatam@gmail.com";
const REPO = "Viexlatam-codificador/viexsalud-pro";
const BRANCH = "main";

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  const ghToken = process.env.GITHUB_PAT;
  if (!ghToken) {
    res.status(500).json({ error: "Falta configurar GITHUB_PAT en Vercel." });
    return;
  }

  const authHeader = req.headers.authorization || "";
  const accessToken = authHeader.replace(/^Bearer\s+/i, "");
  const { paths } = req.body || {};

  if (!accessToken) {
    res.status(401).json({ error: "Sesión no encontrada." });
    return;
  }
  if (!Array.isArray(paths) || !paths.length) {
    res.status(400).json({ error: "No se recibieron archivos para borrar." });
    return;
  }
  // Safety: only allow deleting files inside this one folder.
  const invalid = paths.find((p) => typeof p !== "string" || !p.startsWith("src/content/preexistencias/"));
  if (invalid) {
    res.status(400).json({ error: "Ruta no permitida: " + invalid });
    return;
  }

  try {
    const meRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${accessToken}`, apikey: SUPABASE_ANON_KEY },
    });
    const me = await meRes.json();
    if (!meRes.ok || !me.email || me.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      res.status(403).json({ error: "Solo el administrador puede borrar preexistencias." });
      return;
    }

    const results = [];
    for (const path of paths) {
      const getRes = await fetch(
        `https://api.github.com/repos/${REPO}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}?ref=${BRANCH}`,
        { headers: { Authorization: `Bearer ${ghToken}`, Accept: "application/vnd.github+json" } }
      );
      if (!getRes.ok) {
        results.push({ path, ok: false, error: "No encontrado en GitHub" });
        continue;
      }
      const fileInfo = await getRes.json();
      const delRes = await fetch(
        `https://api.github.com/repos/${REPO}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${ghToken}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `Delete preexistencia: ${path.split("/").pop()}`,
            sha: fileInfo.sha,
            branch: BRANCH,
          }),
        }
      );
      results.push({ path, ok: delRes.ok, error: delRes.ok ? null : "No se pudo borrar" });
    }

    res.status(200).json({ results });
  } catch (err) {
    res.status(500).json({ error: "Error inesperado.", detail: err.message });
  }
};
