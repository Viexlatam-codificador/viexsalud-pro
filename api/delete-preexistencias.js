// Elimina uno o varios archivos de preexistencias directamente del
// repositorio de GitHub. Solo funciona para el correo administrador
// (con la sesión de ejecutivos de Viex) y usa un token de GitHub con permiso
// de escritura, guardado como variable de entorno (nunca en el navegador).
const { leerSesion } = require("./_lib/sesion");
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

  const sesion = leerSesion(req);
  const { paths } = req.body || {};

  if (!sesion) {
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
    if (!sesion.admin) {
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
