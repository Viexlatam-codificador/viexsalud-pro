// Step 1 of the GitHub OAuth flow used by the Decap CMS admin panel (/admin).
// The CMS opens this endpoint in a popup; we redirect straight to GitHub's
// authorize screen. GitHub redirects back to /api/callback when the user approves.
module.exports = (req, res) => {
  const clientId = process.env.OAUTH_CLIENT_ID;
  if (!clientId) {
    res.status(500).send("Falta configurar OAUTH_CLIENT_ID en Vercel.");
    return;
  }

  const proto = req.headers["x-forwarded-proto"] || "https";
  const redirectUri = `${proto}://${req.headers.host}/api/callback`;
  const state = Math.random().toString(36).slice(2);

  const authorizeUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent("repo,user")}` +
    `&state=${encodeURIComponent(state)}`;

  res.writeHead(302, { Location: authorizeUrl });
  res.end();
};
