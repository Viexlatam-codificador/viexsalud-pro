(function () {
  "use strict";
  var ADMIN_EMAIL = "viexlatam@gmail.com";
  var sb = window.VIEX_SUPABASE;
  var root = document.getElementById('isaprecalc-root');
  var session = null;

  sb.auth.getSession().then(function (res) {
    session = res.data && res.data.session;
    if (!session) {
      window.location.href = '/ejecutivos/?next=' + encodeURIComponent(window.location.pathname);
      return;
    }
    root.style.visibility = 'visible';
    if ((session.user.email || '').toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      document.getElementById('not-admin-msg').style.display = 'block';
    } else {
      document.getElementById('admin-area').style.display = 'block';
      init();
    }
  });

  document.getElementById('logout-link').addEventListener('click', function (e) {
    e.preventDefault();
    sb.auth.signOut().then(function () { window.location.href = '/ejecutivos/'; });
  });

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function init() {
    var raw = [];
    try { raw = JSON.parse(document.getElementById('preex-data').textContent || '[]'); } catch (e) { raw = []; }
    var data = raw.filter(function (d) { return d && d.nombre; })
      .sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); });

    var listEl = document.getElementById('list');
    var searchEl = document.getElementById('search');
    var isapreEl = document.getElementById('filter-isapre');
    var countEl = document.getElementById('count');
    var selCountEl = document.getElementById('sel-count');
    var deleteBtn = document.getElementById('delete-btn');
    var statusEl = document.getElementById('status');
    var checked = {};

    Array.from(new Set(data.map(function (d) { return d.isapre; })))
      .sort(function (a, b) { return a.localeCompare(b, 'es'); })
      .forEach(function (name) {
        var opt = document.createElement('option');
        opt.value = name; opt.textContent = name;
        isapreEl.appendChild(opt);
      });

    function slugFromPath(path) {
      return path.replace('src/content/preexistencias/', '').replace(/\.md$/, '');
    }

    function updateSelCount() {
      var n = Object.keys(checked).filter(function (k) { return checked[k]; }).length;
      selCountEl.textContent = n;
      deleteBtn.disabled = n === 0;
    }

    function render() {
      var q = searchEl.value.trim().toLowerCase();
      var isapreFilter = isapreEl.value;
      var filtered = data.filter(function (d) {
        var matchesQuery = !q || (d.nombre + ' ' + d.isapre).toLowerCase().indexOf(q) !== -1;
        var matchesIsapre = !isapreFilter || d.isapre === isapreFilter;
        return matchesQuery && matchesIsapre;
      });
      countEl.textContent = filtered.length + (filtered.length === 1 ? ' preexistencia' : ' preexistencias');
      listEl.innerHTML = filtered.map(function (d, i) {
        var isChecked = !!checked[d.path];
        var editUrl = '/admin/#/collections/preexistencias/entries/' + encodeURIComponent(slugFromPath(d.path));
        return '<label class="row">' +
          '<input type="checkbox" data-path="' + escapeHtml(d.path) + '" ' + (isChecked ? 'checked' : '') + '>' +
          '<div class="info" style="flex:1;"><h3>' + (i + 1) + '. ' + escapeHtml(d.nombre) + '</h3>' +
          '<div class="meta">' + escapeHtml(d.isapre) + (d.fecha ? ' · ' + escapeHtml(d.fecha) : '') + '</div></div>' +
          '<a href="' + editUrl + '" target="_blank" rel="noopener" class="btn-ghost" style="text-decoration:none; align-self:center;">Editar</a>' +
          '</label>';
      }).join('');
      Array.prototype.forEach.call(listEl.querySelectorAll('input[type="checkbox"]'), function (cb) {
        cb.addEventListener('change', function () {
          checked[cb.getAttribute('data-path')] = cb.checked;
          updateSelCount();
        });
      });
    }

    document.getElementById('select-all').addEventListener('click', function () {
      data.forEach(function (d) { checked[d.path] = true; });
      render(); updateSelCount();
    });
    document.getElementById('select-none').addEventListener('click', function () {
      checked = {};
      render(); updateSelCount();
    });
    isapreEl.addEventListener('change', render);
    searchEl.addEventListener('input', render);

    deleteBtn.addEventListener('click', function () {
      var paths = Object.keys(checked).filter(function (k) { return checked[k]; });
      if (!paths.length) return;
      if (!confirm('¿Borrar ' + paths.length + ' preexistencia(s)? Esta acción no se puede deshacer.')) return;

      deleteBtn.disabled = true;
      statusEl.textContent = 'Borrando...';
      statusEl.className = 'status';

      fetch('/api/delete-preexistencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token },
        body: JSON.stringify({ paths: paths })
      })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
        .then(function (res) {
          if (!res.ok) {
            statusEl.textContent = res.body.error || 'No se pudo completar el borrado.';
            statusEl.className = 'status error';
            deleteBtn.disabled = false;
            return;
          }
          var failed = (res.body.results || []).filter(function (r) { return !r.ok; });
          data = data.filter(function (d) { return !paths.includes(d.path) || failed.some(function (f) { return f.path === d.path; }); });
          checked = {};
          render(); updateSelCount();
          statusEl.textContent = failed.length
            ? 'Se borraron algunas, pero fallaron: ' + failed.map(function (f) { return f.path; }).join(', ')
            : 'Listo. Recarga la página para ver el listado actualizado del todo el sitio.';
          statusEl.className = failed.length ? 'status error' : 'status ok';
        })
        .catch(function (err) {
          statusEl.textContent = err.message;
          statusEl.className = 'status error';
          deleteBtn.disabled = false;
        });
    });

    render();
  }
})();
