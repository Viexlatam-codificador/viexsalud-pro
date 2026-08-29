// Step 2 of the GitHub OAuth flow: GitHub redirects here with a ?code=...
// We exchange it for an access token and hand it back to the /admin popup
// via postMessage, using the handshake Decap CMS's client expects.
module.exports = async (req, res) => {
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  const url = new URL(req.url, `https://${req.headers.host}`);
  const code = url.searchParams.get("code");

  if (!clientId || !clientSecret) {
    res.status(500).send("Falta configurar OAUTH_CLIENT_ID / OAUTH_CLIENT_SECRET en Vercel.");
    return;
  }
  if (!code) {
    res.status(400).send("Falta el parámetro 'code' de GitHub.");
    return;
  }

  let token;
  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const tokenJson = await tokenRes.json();
    if (tokenJson.error || !tokenJson.access_token) {
      res.status(400).send("Error de GitHub: " + (tokenJson.error_description || tokenJson.error || "sin token"));
      return;
    }
    token = tokenJson.access_token;
  } catch (err) {
    res.status(500).send("No se pudo contactar a GitHub: " + err.message);
    return;
  }

  // Safely embed the token as a JS string literal inside the generated script.
  const tokenLiteral = JSON.stringify(token);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`<!doctype html>
<html><body>
<script>
(function () {
  var payload = { token: ${tokenLiteral}, provider: "github" };
  var replied = false;

  if (!window.opener) {
    document.getElementById("cms-auth-msg").textContent =
      "No se detectó la ventana original que abrió este login. Cierra esta pestaña y vuelve a intentar desde /admin.";
    return;
  }

  function receiveMessage(e) {
    if (replied) return;
    replied = true;
    clearInterval(pingInterval);
    window.opener.postMessage("authorization:github:success:" + JSON.stringify(payload), e.origin);
    window.removeEventListener("message", receiveMessage, false);
    setTimeout(function () { window.close(); }, 300);
  }
  window.addEventListener("message", receiveMessage, false);

  // The main window's listener may not be ready the instant we redirect back,
  // so keep pinging until it actually acknowledges (real fix for the race
  // condition, instead of assuming success after a single fixed delay).
  var pingInterval = setInterval(function () {
    if (replied) { clearInterval(pingInterval); return; }
    try { window.opener.postMessage("authorizing:github", "*"); }
    catch (e) { clearInterval(pingInterval); }
  }, 250);

  setTimeout(function () {
    if (!replied) {
      clearInterval(pingInterval);
      document.getElementById("cms-auth-msg").textContent =
        "La pestaña principal no respondió. Cierra esta ventana y recarga la pestaña de /admin (sin volver a hacer clic en Login), luego intenta de nuevo.";
    }
  }, 15000);
})();
</script>
<span id="cms-auth-msg">Autenticado. Podés cerrar esta ventana si no se cierra sola.</span>
</body></html>`);
};
