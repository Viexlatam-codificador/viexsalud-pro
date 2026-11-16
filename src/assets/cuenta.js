/* Cuentas y datos de Viex Salud sin Supabase.
   Expone window.VIEX_SUPABASE con las mismas funciones que usaban las páginas
   (auth.getSession, signInWithPassword, signUp, resetPasswordForEmail, updateUser,
   signOut, from(tabla).insert, storage.from().upload), pero todo pasa por
   /api/cuenta y /api/datos, que guardan en el Drive de viexlatam. */
(function () {
  "use strict";
  var cache = null;

  function aSesion(s) {
    if (!s) return null;
    return { access_token: "cookie", user: { id: s.email, email: s.email, user_metadata: { nombre: s.nombre } } };
  }

  function pedir(url, cuerpo) {
    return fetch(url, {
      method: cuerpo ? "POST" : "GET",
      credentials: "same-origin",
      headers: cuerpo ? { "Content-Type": "application/json" } : {},
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; });
    }).catch(function () {
      return { ok: false, j: { error: "No hay conexión. Revisa tu internet e intenta de nuevo." } };
    });
  }

  function conSesion(r) {
    if (!r.ok) return { data: { session: null }, error: { message: r.j.error || "Ocurrió un error. Intenta de nuevo." } };
    cache = Promise.resolve(r.j.sesion || null);
    return { data: { session: aSesion(r.j.sesion), user: r.j.sesion ? { email: r.j.sesion.email } : null }, error: null };
  }

  function tokenRecuperacion() {
    var m = location.hash.match(/[#&]t=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  }

  function aBase64(file) {
    return new Promise(function (ok, mal) {
      var lector = new FileReader();
      lector.onload = function () { ok(String(lector.result).split(",")[1] || ""); };
      lector.onerror = function () { mal(new Error("No se pudo leer el archivo.")); };
      lector.readAsDataURL(file);
    });
  }

  window.VIEX_SUPABASE = {
    auth: {
      getSession: function () {
        if (!cache) cache = pedir("/api/cuenta").then(function (r) { return r.ok ? r.j.sesion : null; });
        return cache.then(function (s) { return { data: { session: aSesion(s) }, error: null }; });
      },
      signInWithPassword: function (o) {
        return pedir("/api/cuenta", { accion: "entrar", email: o.email, clave: o.password }).then(conSesion);
      },
      signUp: function (o) {
        var meta = (o.options && o.options.data) || {};
        return pedir("/api/cuenta", { accion: "registro", email: o.email, clave: o.password, nombre: meta.nombre, telefono: meta.telefono }).then(conSesion);
      },
      resetPasswordForEmail: function (email) {
        return pedir("/api/cuenta", { accion: "olvide", email: email }).then(function (r) {
          return { error: r.ok ? null : { message: r.j.error || "No se pudo enviar el correo." } };
        });
      },
      updateUser: function (o) {
        return pedir("/api/cuenta", { accion: "restablecer", token: tokenRecuperacion(), clave: o.password }).then(conSesion);
      },
      signOut: function () {
        cache = Promise.resolve(null);
        return pedir("/api/cuenta", { accion: "salir" }).then(function () { return { error: null }; });
      },
    },
    from: function (tabla) {
      return {
        insert: function (fila) {
          return pedir("/api/datos", { tabla: tabla, fila: fila }).then(function (r) {
            return { error: r.ok ? null : { message: r.j.error || "No se pudo guardar." } };
          });
        },
      };
    },
    storage: {
      from: function () {
        return {
          upload: function (ruta, file) {
            if (file.size > 3 * 1024 * 1024) return Promise.resolve({ error: { message: "El archivo pesa más de 3 MB." } });
            return aBase64(file).then(function (b64) {
              return pedir("/api/datos", { archivo: { nombre: file.name, tipo: file.type, base64: b64 } });
            }).then(function (r) {
              return { data: r.ok ? { id: r.j.id } : null, error: r.ok ? null : { message: r.j.error || "No se pudo guardar el archivo." } };
            });
          },
        };
      },
    },
  };
})();
