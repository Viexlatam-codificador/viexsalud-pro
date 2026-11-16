/* Anuncio "Contrata ahora": aparece al abrir o recargar una página pública,
   se cierra solo a los 5 segundos o con la X / tecla Esc. No sale en las
   herramientas de ejecutivos, el panel ni la landing de anuncios. */
(function () {
  "use strict";
  if (/^\/(ejecutivos|recursos-ejecutivos|ads|admin)(\/|$)/.test(location.pathname)) return;

  var MENSAJE = "Hola, quiero contratar un plan de salud. ¿Me ayudan a cotizar?";
  var destino = "https://wa.me/56948627767?text=" + encodeURIComponent(MENSAJE);
  var DURACION = 5000;

  var fondo = document.createElement("div");
  fondo.className = "anuncio-fondo";
  fondo.innerHTML =
    '<div class="anuncio" role="dialog" aria-labelledby="anuncio-titulo" aria-describedby="anuncio-texto">' +
      '<button type="button" class="anuncio-cerrar" aria-label="Cerrar anuncio">×</button>' +
      '<p class="anuncio-kicker">Asesoría gratuita</p>' +
      '<h2 id="anuncio-titulo">Contrata ahora tu plan de salud</h2>' +
      '<p id="anuncio-texto">Te ayudamos a comparar planes según tu cobertura y tu familia. Escríbenos y te respondemos por WhatsApp, sin costo para ti.</p>' +
      '<a class="btn btn-primary anuncio-boton" href="' + destino + '" target="_blank" rel="noopener">Escríbenos por WhatsApp</a>' +
      '<div class="anuncio-barra" aria-hidden="true"><span></span></div>' +
    '</div>';

  var temporizador = null, restante = DURACION, inicio = 0;

  function cerrar() {
    clearTimeout(temporizador);
    document.removeEventListener("keydown", tecla);
    fondo.classList.remove("visible");
    setTimeout(function () { if (fondo.parentNode) fondo.parentNode.removeChild(fondo); }, 250);
  }
  function correr() {
    inicio = Date.now();
    fondo.classList.remove("pausado");
    temporizador = setTimeout(cerrar, restante);
  }
  function pausar() {
    clearTimeout(temporizador);
    restante -= Date.now() - inicio;
    fondo.classList.add("pausado");
  }
  function tecla(e) { if (e.key === "Escape") cerrar(); }

  fondo.querySelector(".anuncio-cerrar").addEventListener("click", cerrar);
  fondo.querySelector(".anuncio-boton").addEventListener("click", function () {
    try { if (typeof gtag === "function") gtag("event", "anuncio_contrata_click"); } catch (e) {}
    cerrar();
  });
  fondo.addEventListener("click", function (e) { if (e.target === fondo) cerrar(); });
  var caja = fondo.querySelector(".anuncio");
  caja.addEventListener("mouseenter", pausar);
  caja.addEventListener("mouseleave", correr);

  function mostrar() {
    document.body.appendChild(fondo);
    document.addEventListener("keydown", tecla);
    requestAnimationFrame(function () { fondo.classList.add("visible"); });
    correr();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mostrar);
  else mostrar();
})();
