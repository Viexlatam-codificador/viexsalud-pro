// Analiza un documento de plan de Isapre (PDF o imagen) ya subido a Supabase
// Storage. Descarga el archivo usando el token del ejecutivo que hizo la
// solicitud (respeta las políticas de acceso del bucket, sin usar una llave
// privilegiada), lo sube a OpenAI y pide un análisis breve del plan.
const SUPABASE_URL = "https://jniaoqcgpdryqrssntfp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_BCFzQF1HZw8EPsGsdNvXCQ_0ILWpQB6";
const BUCKET = "comparador-archivos";

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    res.status(500).json({ error: "Falta configurar OPENAI_API_KEY en Vercel." });
    return;
  }

  const authHeader = req.headers.authorization || "";
  const accessToken = authHeader.replace(/^Bearer\s+/i, "");
  const { path, label } = req.body || {};

  if (!accessToken) {
    res.status(401).json({ error: "Sesión no encontrada. Vuelve a iniciar sesión." });
    return;
  }
  if (!path) {
    res.status(400).json({ error: "Falta la ruta del archivo." });
    return;
  }

  try {
    const fileRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
      headers: { Authorization: `Bearer ${accessToken}`, apikey: SUPABASE_ANON_KEY },
    });
    if (!fileRes.ok) {
      res.status(400).json({ error: "No se pudo leer el archivo subido." });
      return;
    }
    const fileBuffer = Buffer.from(await fileRes.arrayBuffer());
    const contentType = fileRes.headers.get("content-type") || "application/octet-stream";
    const fileName = path.split("/").pop() || "documento";

    const uploadForm = new FormData();
    uploadForm.append("file", new Blob([fileBuffer], { type: contentType }), fileName);
    uploadForm.append("purpose", "user_data");

    const uploadRes = await fetch("https://api.openai.com/v1/files", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}` },
      body: uploadForm,
    });
    const uploadJson = await uploadRes.json();
    if (!uploadRes.ok) {
      res.status(502).json({ error: "Error subiendo el archivo a OpenAI.", detail: uploadJson.error?.message });
      return;
    }

    const prompt =
      "Eres un asesor experto en Isapres chilenas, revisando el documento de un " +
      (label || "plan de salud") +
      " para un ejecutivo de una correduría de seguros. Analiza el documento adjunto y entrega, en español, en viñetas breves y profesionales:\n" +
      "1. Isapre y nombre del plan (si se identifican).\n" +
      "2. Coberturas principales: ambulatoria, hospitalaria, dental si aplica.\n" +
      "3. Topes, deducibles o restricciones relevantes.\n" +
      "4. Alertas importantes para el cliente (preexistencias, carencias, exclusiones, red de prestadores limitada).\n" +
      "Máximo 200 palabras. Si el documento no es legible o no corresponde a un plan de salud, dilo claramente en vez de inventar datos.";

    const modelName = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const analysisRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelName,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              { type: "input_file", file_id: uploadJson.id },
            ],
          },
        ],
      }),
    });
    const analysisJson = await analysisRes.json();
    if (!analysisRes.ok) {
      res.status(502).json({ error: "Error analizando el documento con IA.", detail: analysisJson.error?.message });
      return;
    }

    const text =
      analysisJson.output_text ||
      analysisJson.output?.[0]?.content?.[0]?.text ||
      "No se pudo generar el análisis.";

    res.status(200).json({ analysis: text });
  } catch (err) {
    res.status(500).json({ error: "Error inesperado analizando el documento.", detail: err.message });
  }
};
