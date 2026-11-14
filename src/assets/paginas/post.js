(function () {
  "use strict";
  var sb = supabase.createClient(
    "https://jniaoqcgpdryqrssntfp.supabase.co",
    "sb_publishable_BCFzQF1HZw8EPsGsdNvXCQ_0ILWpQB6"
  );
  document.getElementById('subscribe-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = document.getElementById('subscribe-btn');
    var msg = document.getElementById('subscribe-msg');
    var email = document.getElementById('subscribe-email').value.trim();
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    sb.from('suscriptores').insert({ email: email, fuente: window.location.pathname }).then(function (res) {
      btn.disabled = false;
      btn.textContent = 'Suscribirme';
      if (res.error && res.error.code !== '23505') {
        msg.textContent = 'No se pudo suscribir, intenta de nuevo.';
        msg.className = 'subscribe-msg error';
        return;
      }
      msg.textContent = '¡Listo! Ya estás suscrito.';
      msg.className = 'subscribe-msg ok';
      document.getElementById('subscribe-form').reset();
    });
  });
})();
