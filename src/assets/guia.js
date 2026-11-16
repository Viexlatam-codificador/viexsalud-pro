/* Página /guia: entrega la guía PDF a cambio de nombre y correo (con consentimiento).
   El contacto queda en la planilla de Drive (api/aviso.js) y llega el aviso por correo. */
(() => {
  "use strict";
  const form = document.getElementById("guia-form");
  if (!form) return;
  const inicio = Date.now();
  const estado = document.getElementById("guia-estado");
  const boton = document.getElementById("guia-enviar");
  const params = new URLSearchParams(location.search);
  const utm = ["utm_source", "utm_medium", "utm_campaign", "utm_content"].filter((k) => params.get(k))
    .map((k) => `${k}=${params.get(k).slice(0, 60)}`).join("&");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    estado.textContent = "";
    if (!form.reportValidity()) return;
    const f = new FormData(form);
    const v = (k) => String(f.get(k) || "").trim();
    if (v("web") || Date.now() - inicio < 2000) return; // anti-spam
    const tel = v("telefono").replace(/[\s()-]/g, "");
    if (tel && !/^(?:\+?56)?9\d{8}$/.test(tel)) {
      estado.textContent = "Revisa tu WhatsApp (ej: +56 9 1234 5678) o déjalo en blanco.";
      return;
    }
    boton.disabled = true;
    boton.textContent = "Preparando tu guía…";
    let ok = false;
    try {
      const r = await fetch("/api/aviso", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origen: "Guía 5 errores", nombre: v("nombre"), email: v("email"), telefono: tel,
          datos: [["Correo", v("email")], ["Pidió", "Guía 5 errores (PDF)"], ["Campaña", utm]] }),
      });
      ok = r.ok;
    } catch (err) { ok = false; }

    if (ok) {
      try {
        if (typeof gtag === "function") gtag("event", "generate_lead", { form_id: "guia-form" });
        if (typeof fbq === "function") fbq("track", "Lead", { content_name: "Guía 5 errores" });
      } catch (err) {}
      document.getElementById("guia-gracias-nombre").textContent = v("nombre").split(" ")[0];
      document.getElementById("guia-formulario").hidden = true;
      const g = document.getElementById("guia-gracias");
      g.hidden = false;
      g.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      boton.disabled = false;
      boton.textContent = "Descargar la guía gratis";
      estado.textContent = "No pudimos registrar tus datos. Intenta de nuevo en un minuto.";
    }
  });
})();
