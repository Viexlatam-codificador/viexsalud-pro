(function () {
  "use strict";
  var sb = window.VIEX_SUPABASE;
  var root = document.getElementById('isaprecalc-root');

  sb.auth.getSession().then(function (res) {
    if (!res.data || !res.data.session) {
      window.location.href = '/ejecutivos/?next=' + encodeURIComponent(window.location.pathname);
      return;
    }
    root.style.visibility = 'visible';
    if ((res.data.session.user.email || '').toLowerCase() === 'viexlatam@gmail.com') {
      document.querySelectorAll('.admin-only').forEach(function (el) { el.style.display = ''; });
    }
  });

  var logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', function (e) {
      e.preventDefault();
      sb.auth.signOut().then(function () { window.location.href = '/ejecutivos/'; });
    });
  }
})();
