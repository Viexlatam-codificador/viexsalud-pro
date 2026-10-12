var Tawk_API = Tawk_API || {};
var Tawk_LoadStart = new Date();
(function () {
  if (!/^(www\.)?viexsalud\.cl$/.test(location.hostname) || /^\/(admin|ejecutivos|recursos-ejecutivos)(\/|$)/.test(location.pathname)) return;
  // Mobile uses the direct WhatsApp link, never an overlay chat.
  var mobile = window.matchMedia('(max-width: 900px)');
  if (mobile.matches) return;
  Tawk_API.onLoad = function () {
    if (mobile.matches || document.querySelector('.nav-links.open')) Tawk_API.hideWidget();
  };
  mobile.addEventListener('change', function (event) {
    if (event.matches && typeof Tawk_API.hideWidget === 'function') {
      if (typeof Tawk_API.minimize === 'function') Tawk_API.minimize();
      Tawk_API.hideWidget();
    }
  });
  var s1 = document.createElement('script'),
    s0 = document.getElementsByTagName('script')[0];
  s1.async = true;
  s1.src = 'https://embed.tawk.to/6aa96f1090823a344652ba24/1k2itjmli';
  s1.charset = 'UTF-8';
  s1.setAttribute('crossorigin', '*');
  s0.parentNode.insertBefore(s1, s0);
})();
