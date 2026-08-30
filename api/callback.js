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

  function markDone() {
    replied = true;
    document.getElementById("cms-auth-msg").textContent = "Autenticado. Cerrando...";
    setTimeout(function () { window.close(); }, 400);
  }

  // Primary channel: localStorage + the "storage" event, which fires in the
  // OTHER tab of the same site regardless of window.opener. Chrome severs
  // window.opener when the popup round-trips through github.com, so relying
  // only on postMessage(window.opener, ...) silently fails for many users.
  try {
    localStorage.setItem("decap-cms-auth-token", JSON.stringify(payload));
    markDone();
  } catch (e) {}

  // Backup channel in case localStorage is blocked (private mode, etc).
  try {
    var bc = new BroadcastChannel("decap-cms-auth");
    bc.postMessage(payload);
    bc.close();
  } catch (e) {}

  // Best-effort classic postMessage too, for browsers where opener survives.
  if (window.opener) {
    function receiveMessage(e) {
      if (replied) return;
      window.opener.postMessage("authorization:github:success:" + JSON.stringify(payload), e.origin);
      window.removeEventListener("message", receiveMessage, false);
      markDone();
    }
    window.addEventListener("message", receiveMessage, false);
    window.opener.postMessage("authorizing:github", "*");
  }

  setTimeout(function () {
    if (!replied) {
      document.getElementById("cms-auth-msg").textContent =
        "Autenticado, pero esta ventana no pudo confirmarlo sola. Ciérrala y recarga la pestaña de /admin.";
    }
  }, 4000);
})();
</script>
<span id="cms-auth-msg">Autenticado. Podés cerrar esta ventana si no se cierra sola.</span>
</body></html>`);
};
