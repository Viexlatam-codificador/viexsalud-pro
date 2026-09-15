/* Contentsquare — session replay / experience analytics.
   IIFE loader (buffers window._uxa calls until the tag script finishes loading). */
(function (c, s, q, u, a, r, e) {
  c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
  e = s.createElement(q);
  e.async = 1;
  e.src = u;
  r = s.getElementsByTagName(q)[0];
  r.parentNode.insertBefore(e, r);
})(window, document, "script", "https://t.contentsquare.net/uxa/2f2dacedf72db.js", "_uxa");
