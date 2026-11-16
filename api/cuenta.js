// Cuentas de ejecutivos guardadas en el Drive de viexlatam (hoja "Ejecutivos"), sin Supabase.
// GET  -> sesión actual.  POST {accion: entrar | registro | salir | olvide | restablecer}
const { drive } = require("./_lib/drive");
const S = require("./_lib/sesion");

const intentos = new Map(); // límite por IP + correo (por instancia)
const HOJA = "Ejecutivos";

function limpio(v, max) { return String(v == null ? "" : v).replace(/[\r\n\t]+/g, " ").trim().slice(0, max); }
const emailValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

function frenar(clave) {
  const ahora = Date.now();
  const lista = (intentos.get(clave) || []).filter((t) => ahora - t < 15 * 60000);
  lista.push(ahora);
  intentos.set(clave, lista);
  return lista.length > 8;
}

function origenPermitido(req) {
  const o = req.headers.origin || "";
  return !o || /^https:\/\/(www\.)?viexsalud\.cl$/.test(o) || /^https:\/\/viexsalud-pro-[a-z0-9-]+\.vercel\.app$/.test(o) || /^http:\/\/localhost:\d+$/.test(o);
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET") return res.status(200).json({ sesion: S.leerSesion(req) });
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido." });
  if (!origenPermitido(req)) return res.status(403).json({ error: "Origen no permitido." });

  let d = req.body || {};
  if (typeof d === "string") { try { d = JSON.parse(d); } catch (e) { d = {}; } }
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "x";
  const email = limpio(d.email, 120).toLowerCase();

  try {
    switch (d.accion) {
      case "salir":
        S.cerrarSesion(res);
        return res.status(200).json({ ok: true });

      case "entrar": {
        if (frenar(ip + "|" + email)) return res.status(429).json({ error: "Demasiados intentos. Espera 15 minutos." });
        const u = emailValido(email) ? (await drive("buscar", { hoja: HOJA, campo: "email", valor: email })).fila : null;
        if (u && !u.clave_hash) return res.status(400).json({ error: "Tu cuenta pasó al nuevo sistema de Viex Salud. Toca \"¿Olvidaste tu contraseña?\" para crear una nueva." });
        if (!u || !S.verificarClave(d.clave, u.clave_hash)) return res.status(401).json({ error: "Correo o contraseña incorrectos." });
        if (String(u.estado).toLowerCase() === "bloqueado") return res.status(403).json({ error: "Tu acceso está desactivado. Escribe a Viex Salud." });
        S.abrirSesion(res, email, u.nombre);
        drive("actualizar", { hoja: HOJA, campo: "email", valor: email, cambios: { ultimo_ingreso: new Date().toISOString() } }).catch(() => {});
        return res.status(200).json({ ok: true, sesion: { email, nombre: u.nombre || "", admin: email === S.ADMIN_EMAIL } });
      }

      case "registro": {
        if (frenar(ip + "|registro")) return res.status(429).json({ error: "Demasiados intentos. Espera 15 minutos." });
        const nombre = limpio(d.nombre, 80), telefono = limpio(d.telefono, 30);
        if (nombre.length < 2) return res.status(400).json({ error: "Escribe tu nombre." });
        if (!emailValido(email)) return res.status(400).json({ error: "Revisa que el correo esté bien escrito." });
        if (String(d.clave || "").length < 8) return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres." });
        const existe = (await drive("buscar", { hoja: HOJA, campo: "email", valor: email })).fila;
        if (existe && existe.clave_hash) return res.status(409).json({ error: "Ese correo ya tiene una cuenta. Prueba iniciar sesión." });
        if (existe) return res.status(409).json({ error: "Ese correo ya estaba registrado. Toca \"¿Olvidaste tu contraseña?\" para crear una nueva." });
        await drive("agregar", { hoja: HOJA, fila: {
          creado: new Date().toISOString(), nombre, telefono, email, estado: "activo",
          clave_hash: S.hashClave(d.clave), ultimo_ingreso: new Date().toISOString(), origen: "Registro en el sitio",
        } });
        S.abrirSesion(res, email, nombre);
        return res.status(200).json({ ok: true, sesion: { email, nombre, admin: email === S.ADMIN_EMAIL } });
      }

      case "olvide": {
        if (frenar(ip + "|olvide")) return res.status(429).json({ error: "Demasiados intentos. Espera 15 minutos." });
        const u = emailValido(email) ? (await drive("buscar", { hoja: HOJA, campo: "email", valor: email })).fila : null;
        if (u && String(u.estado).toLowerCase() !== "bloqueado") {
          const token = S.firmar({ r: email, h: String(u.clave_hash || "").slice(-12) }, 3600);
          const enlace = "https://www.viexsalud.cl/ejecutivos/#type=recovery&t=" + encodeURIComponent(token);
          await drive("correo", {
            para: email,
            asunto: "Crea tu nueva contraseña · Viex Salud",
            texto: "Hola " + (u.nombre || "") + ",\n\nPara crear tu nueva contraseña de las herramientas para ejecutivos de Viex Salud, abre este enlace (dura 1 hora):\n\n" +
              enlace + "\n\nSi no lo pediste tú, ignora este correo.\n\nViex Salud",
          });
        }
        return res.status(200).json({ ok: true }); // misma respuesta exista o no la cuenta
      }

      case "restablecer": {
        const t = S.leerFirmado(d.token);
        if (!t || !t.r) return res.status(400).json({ error: "El enlace venció o no es válido. Pide uno nuevo." });
        if (String(d.clave || "").length < 8) return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres." });
        const u = (await drive("buscar", { hoja: HOJA, campo: "email", valor: t.r })).fila;
        if (!u || String(u.clave_hash || "").slice(-12) !== t.h) return res.status(400).json({ error: "El enlace ya se usó. Pide uno nuevo." });
        await drive("actualizar", { hoja: HOJA, campo: "email", valor: t.r, cambios: { clave_hash: S.hashClave(d.clave), ultimo_ingreso: new Date().toISOString() } });
        S.abrirSesion(res, t.r, u.nombre);
        return res.status(200).json({ ok: true, sesion: { email: t.r, nombre: u.nombre || "", admin: t.r === S.ADMIN_EMAIL } });
      }

      default:
        return res.status(400).json({ error: "Acción no válida." });
    }
  } catch (e) {
    console.error("cuenta:", e.message);
    return res.status(502).json({ error: "No pudimos conectar con la base de datos. Intenta en un minuto." });
  }
};
