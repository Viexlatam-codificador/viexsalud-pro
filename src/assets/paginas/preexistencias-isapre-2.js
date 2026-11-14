(function () {
  "use strict";
  var raw = [];
  try { raw = JSON.parse(document.getElementById('preex-data').textContent || '[]'); } catch (e) { raw = []; }

  var data = raw
    .filter(function (d) { return d && d.nombre; })
    .map(function (d) {
      return {
        nombre: d.nombre || '',
        isapre: d.isapre || 'Sin especificar',
        como_declarar: d.como_declarar || '',
        fecha: d.fecha || null
      };
    });

  var searchInput = document.getElementById('preex-search');
  var filterSelect = document.getElementById('preex-filter-isapre');
  var sortSelect = document.getElementById('preex-sort');
  var resultsEl = document.getElementById('preex-results');
  var countEl = document.getElementById('preex-count');
  var emptyEl = document.getElementById('preex-empty');

  function fmtFecha(iso) {
    if (!iso) return '';
    var meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    var p = iso.split('-');
    return 'Actualizado el ' + parseInt(p[2], 10) + ' de ' + meses[parseInt(p[1], 10) - 1] + ' de ' + p[0];
  }

  var isapres = Array.from(new Set(data.map(function (d) { return d.isapre; }))).sort(function (a, b) { return a.localeCompare(b, 'es'); });
  isapres.forEach(function (name) {
    var opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    filterSelect.appendChild(opt);
  });

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function render() {
    var qWords = searchInput.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    var isapreFilter = filterSelect.value;
    var sortBy = sortSelect.value;

    var filtered = data.filter(function (d) {
      var haystack = (d.nombre + ' ' + d.como_declarar + ' ' + d.isapre).toLowerCase();
      var matchesQuery = qWords.every(function (w) { return haystack.indexOf(w) !== -1; });
      var matchesIsapre = !isapreFilter || d.isapre === isapreFilter;
      return matchesQuery && matchesIsapre;
    });

    filtered.sort(function (a, b) {
      if (sortBy === 'fecha') return (b.fecha || '').localeCompare(a.fecha || '');
      return (a[sortBy] || '').localeCompare(b[sortBy] || '', 'es');
    });

    countEl.textContent = filtered.length + (filtered.length === 1 ? ' resultado' : ' resultados');
    resultsEl.innerHTML = filtered.map(function (d) {
      return '<div class="preex-card">' +
        '<div class="row1"><h3>' + escapeHtml(d.nombre) + '</h3><span class="isapre-badge">' + escapeHtml(d.isapre) + '</span></div>' +
        '<p>' + escapeHtml(d.como_declarar) + '</p>' +
        (d.fecha ? '<p class="fecha">' + escapeHtml(fmtFecha(d.fecha)) + '</p>' : '') +
        '</div>';
    }).join('');

    emptyEl.style.display = filtered.length === 0 ? 'block' : 'none';
  }

  searchInput.addEventListener('input', render);
  filterSelect.addEventListener('change', render);
  sortSelect.addEventListener('change', render);
  render();
})();
