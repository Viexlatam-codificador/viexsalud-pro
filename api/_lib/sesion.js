// Sesión de ejecutivos sin Supabase: contraseña con scrypt y cookie firmada (HMAC).
// Variable en Vercel: SESION_SECRETO (texto largo al azar).
const crypto = require("crypto");

const COOKIE = "viex_sesion";
const DURACION = 7 * 24 * 3600; // 7 días
const ADMIN_EMAIL = "viexlatam@gmail.com";

function secreto() {
  const s = process.env.SESION_SECRETO;
  if (!s || s.length < 32) throw new Error("Falta configurar SESION_SECRETO en Vercel.");
  return s;
}

const b64 = (buf) => Buffer.from(buf).toString("base64url");

function hashClave(clave) {
  const sal = crypto.randomBytes(16);
  const h = crypto.scryptSync(String(clave), sal, 32, { N: 16384, r: 8, p: 1 });
  return "s1$" + b64(sal) + "$" + b64(h);
}

function verificarClave(clave, guardado) {
  const partes = String(guardado || "").split("$");
  if (partes.length !== 3 || partes[0] !== "s1") return false;
  const h = crypto.scryptSync(String(clave), Buffer.from(partes[1], "base64url"), 32, { N: 16384, r: 8, p: 1 });
  const esperado = Buffer.from(partes[2], "base64url");
  return esperado.length === h.length && crypto.timingSafeEqual(h, esperado);
}

function firmar(datos, segundos) {
  const cuerpo = b64(JSON.stringify(Object.assign({}, datos, { exp: Math.floor(Date.now() / 1000) + segundos })));
  const firma = b64(crypto.createHmac("sha256", secreto()).update(cuerpo).digest());
  return cuerpo + "." + firma;
}

function leerFirmado(token) {
  const [cuerpo, firma] = String(token || "").split(".");
  if (!cuerpo || !firma) return null;
  const esperada = b64(crypto.createHmac("sha256", secreto()).update(cuerpo).digest());
  if (esperada.length !== firma.length || !crypto.timingSafeEqual(Buffer.from(esperada), Buffer.from(firma))) return null;
  try {
    const d = JSON.parse(Buffer.from(cuerpo, "base64url").toString());
    return d.exp > Date.now() / 1000 ? d : null;
  } catch (e) { return null; }
}

function leerSesion(req) {
  const m = String(req.headers.cookie || "").match(new RegExp("(?:^|;\\s*)" + COOKIE + "=([^;]+)"));
  const d = m ? leerFirmado(decodeURIComponent(m[1])) : null;
  if (!d || !d.e) return null;
  return { email: d.e, nombre: d.n || "", admin: d.e.toLowerCase() === ADMIN_EMAIL };
}

function abrirSesion(res, email, nombre) {
  const token = firmar({ e: String(email).toLowerCase(), n: nombre || "" }, DURACION);
  res.setHeader("Set-Cookie", `${COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${DURACION}; HttpOnly; Secure; SameSite=Lax`);
}

function cerrarSesion(res) {
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
}

module.exports = { hashClave, verificarClave, firmar, leerFirmado, leerSesion, abrirSesion, cerrarSesion, ADMIN_EMAIL };
