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
  var sent = false;

  function send(origin) {
    if (sent) return;
    try {
      window.opener.postMessage("authorization:github:success:" + JSON.stringify(payload), origin || "*");
      sent = true;
      setTimeout(function () { window.close(); }, 300);
    } catch (e) {
      document.getElementById("cms-auth-msg").textContent =
        "No se pudo comunicar con la ventana original (" + e.message + "). Cierra esta pestaña y vuelve a intentar desde /admin, sin recargar esta página.";
    }
  }

  if (!window.opener) {
    document.getElementById("cms-auth-msg").textContent =
      "No se detectó la ventana original que abrió este login. Cierra esta pestaña y vuelve a intentar desde /admin (haz clic en 'Login with GitHub' y no recargues esta página mientras carga).";
    return;
  }

  window.addEventListener("message", function receiveMessage(e) {
    send(e.origin);
    window.removeEventListener("message", receiveMessage, false);
  }, false);
  window.opener.postMessage("authorizing:github", "*");
  // Fallback for browsers/extensions that swallow the reply message.
  setTimeout(function () { send("*"); }, 800);
})();
</script>
<span id="cms-auth-msg">Autenticado. Podés cerrar esta ventana si no se cierra sola.</span>
</body></html>`);
};
