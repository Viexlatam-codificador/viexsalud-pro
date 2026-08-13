/* Viex Salud — Analítica y píxeles de seguimiento
   Google Analytics 4 (gtag.js) + Meta Pixel
   Cargado como archivo propio (mismo origen) para respetar la Content-Security-Policy
   del sitio (script-src 'self') sin necesitar 'unsafe-inline'. */

(function () {
  // ---- Google Analytics 4 ----
  var GA_MEASUREMENT_ID = "G-C6J6SFWGD4";

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID);

  var gaScript = document.createElement("script");
  gaScript.async = true;
  gaScript.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
  document.head.appendChild(gaScript);

  // ---- Meta Pixel ----
  var META_PIXEL_ID = "1995302337788179";

  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

  fbq("init", META_PIXEL_ID);
  fbq("track", "PageView");
})();
