/* Formulario de /ads: valida, guarda la solicitud en Supabase (cotizaciones_web),
   avisa al WhatsApp de Viex y solo muestra "gracias" si quedó guardada o avisada. Si no se puede guardar,
   ofrece WhatsApp con los datos para no perder el contacto. */
(() => {
  "use strict";
  const WHATSAPP = "56948627767";
  const form = document.getElementById("ads-form");
  if (!form) return;

  const inicio = Date.now();
  const estado = document.getElementById("ads-estado");
  const boton = document.getElementById("ads-enviar");
  const campoCargas = document.getElementById("ads-campo-cargas");
  const inputCargas = document.getElementById("ads-cargas-edades");

  // Origen del anuncio (utm_*) para saber qué campaña trajo cada solicitud.
  const params = new URLSearchParams(location.search);
  const utm = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]
    .filter((k) => params.get(k))
    .map((k) => `${k}=${params.get(k).slice(0, 60)}`)
    .join("&");
  const fuente = "/ads" + (utm ? "?" + utm : "");

  form.querySelectorAll('input[name="cargas"]').forEach((r) =>
    r.addEventListener("change", () => {
      const si = form.querySelector('input[name="cargas"]:checked')?.value === "si";
      campoCargas.hidden = !si;
      if (si) inputCargas.setAttribute("required", "");
      else { inputCargas.removeAttribute("required"); inputCargas.value = ""; }
    })
  );

  const telefono = document.getElementById("ads-telefono");
  telefono.addEventListener("input", () => telefono.setCustomValidity(""));

  function track(gaName, metaName) {
    try {
      if (typeof gtag === "function") gtag("event", gaName, { form_id: "ads-form" });
      if (typeof fbq === "function") fbq("track", metaName, { content_name: "Formulario ads" });
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: gaName, form_id: "ads-form" });
    } catch (e) { /* la medición nunca rompe el formulario */ }
  }

  function valido() {
    const tel = telefono.value.replace(/[\s()-]/g, "");
    telefono.setCustomValidity(/^(?:\+?56)?9\d{8}$/.test(tel) ? "" : "Ingresa un celular chileno válido, por ejemplo +56 9 1234 5678.");
    for (const f of form.querySelectorAll("[required]")) {
      if (f.type === "radio") {
        if (!form.querySelector(`[name="${f.name}"]:checked`)) { f.reportValidity(); return false; }
      } else if (!f.checkValidity() || (f.type !== "checkbox" && !f.value.trim())) {
        f.reportValidity(); f.focus(); return false;
      }
    }
    return true;
  }

  function mensajeWhatsApp(d) {
    return [
      "Hola, completé el formulario y quiero una comparativa de planes de salud.",
      `Nombre: ${d.nombre}`,
      `Edad: ${d.edad}`,
      `Región: ${d.region}`,
      `Cargas: ${d.cargas === "si" ? "Sí (" + d.cargas_edades + ")" : "Solo yo"}`,
    ].join("\n");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    estado.textContent = "";
    if (!valido()) return;

    const f = new FormData(form);
    const v = (k) => String(f.get(k) || "").trim();
    if (v("web") || Date.now() - inicio < 2500) return; // anti-spam

    const cargas = v("cargas");
    const extra = [
      "Campaña /ads",
      v("sistema") && `Hoy en: ${v("sistema")}`,
      v("paga") && `Paga hoy: ${v("paga")}`,
      v("clinica") && `Clínica: ${v("clinica")}`,
      v("mensaje") && `Mensaje: ${v("mensaje")}`,
    ].filter(Boolean).join(" · ");

    const datos = {
      nombre: v("nombre"),
      telefono: v("telefono"),
      edad: v("edad"),
      region: v("region"),
      cargas,
      cargas_edades: cargas === "si" ? v("cargasEdades") : "",
      motivo: extra.slice(0, 900),
      fuente,
    };

    boton.disabled = true;
    boton.textContent = "Enviando…";
    let guardado = false;
    try {
      if (window.VIEX_SUPABASE) {
        const res = await window.VIEX_SUPABASE.from("cotizaciones_web").insert(datos);
        guardado = !res.error;
        if (res.error) console.warn("No se pudo guardar la solicitud:", res.error.message);
      }
    } catch (err) { guardado = false; }

    // Aviso inmediato al WhatsApp de Viex (api/aviso.js), sin que la persona apriete nada.
    let avisado = false;
    try {
      const r = await fetch("/api/aviso", {
        method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true,
        body: JSON.stringify({ origen: "Anuncios /ads", nombre: datos.nombre, telefono: datos.telefono, datos: [
          ["Edad", datos.edad], ["Región", datos.region], ["Cargas", cargas === "si" ? "Sí (" + datos.cargas_edades + ")" : "Solo yo"],
          ["Hoy en", v("sistema")], ["Paga hoy", v("paga")], ["Clínica", v("clinica")], ["Mensaje", v("mensaje")], ["Campaña", utm]] }),
      });
      avisado = r.ok;
    } catch (err) { avisado = false; }

    const wa = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensajeWhatsApp(datos))}`;
    if (guardado || avisado) {
      track("generate_lead", "Lead");
      document.getElementById("ads-gracias-nombre").textContent = datos.nombre.split(" ")[0];
      document.getElementById("ads-gracias-wa").href = wa;
      document.getElementById("ads-formulario").hidden = true;
      const g = document.getElementById("ads-gracias");
      g.hidden = false;
      g.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      boton.disabled = false;
      boton.textContent = "Quiero que me contacten";
      estado.innerHTML = 'No pudimos guardar tu solicitud. <a href="' + wa + '" target="_blank" rel="noopener">Envíanos tus datos por WhatsApp aquí</a>.';
      track("ads_form_error", "Contact");
    }
  });
})();
