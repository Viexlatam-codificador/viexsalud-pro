(function () {
  "use strict";
  var ADMIN_EMAIL = "viexlatam@gmail.com";
  var sb = window.VIEX_SUPABASE;
  var root = document.getElementById('isaprecalc-root');
  var session = null;

  function fmt(n) { return Number(n || 0).toLocaleString('es-CL'); }

  function card(label, value, sub) {
    return '<div class="card"><div class="label">' + label + '</div><div class="value">' + fmt(value) + '</div>' +
      (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div>';
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function render(data) {
    document.getElementById('visitas-cards').innerHTML =
      card('Visitas hoy', data.ga4.configured ? data.ga4.visitas.hoy : '—', data.ga4.configured ? (fmt(data.ga4.visitas.sesionesHoy) + ' sesiones') : null) +
      card('Visitas ayer', data.ga4.configured ? data.ga4.visitas.ayer : '—') +
      card('Últimos 7 días', data.ga4.configured ? data.ga4.visitas.ultimos7 : '—') +
      card('Últimos 30 días', data.ga4.configured ? data.ga4.visitas.ultimos30 : '—') +
      card('Páginas vistas hoy', data.ga4.configured ? data.ga4.visitas.paginasVistasHoy : '—');

    var tbody = document.querySelector('#tabla-diaria tbody');
    if (data.ga4.configured && data.ga4.serieDiaria) {
      tbody.innerHTML = data.ga4.serieDiaria.map(function (d) {
        var f = d.fecha.replace(/(\d{4})(\d{2})(\d{2})/, '$3-$2-$1');
        return '<tr><td>' + f + '</td><td>' + fmt(d.visitas) + '</td></tr>';
      }).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="2">Conecta Google Analytics para ver esta tabla.</td></tr>';
    }

    document.getElementById('eventos-cards').innerHTML = data.ga4.configured
      ? card('Clics a WhatsApp hoy', data.ga4.eventos.whatsappHoy) +
        card('Clics a WhatsApp (7 días)', data.ga4.eventos.whatsapp7dias) +
        card('Formularios enviados hoy', data.ga4.eventos.formularioHoy) +
        card('Formularios enviados (7 días)', data.ga4.eventos.formulario7dias)
      : card('Clics a WhatsApp', '—') + card('Formularios enviados', '—');

    document.getElementById('supabase-cards').innerHTML =
      card('Cotizaciones del formulario hoy', data.supabase.cotizaciones.hoy, fmt(data.supabase.cotizaciones.total) + ' en total') +
      card('Comparaciones hoy', data.supabase.comparaciones.hoy, fmt(data.supabase.comparaciones.total) + ' en total') +
      card('Suscriptores nuevos hoy', data.supabase.suscriptores.hoy, fmt(data.supabase.suscriptores.total) + ' en total') +
      card('Ejecutivos registrados', data.supabase.ejecutivos.total);

    var cotizBody = document.querySelector('#tabla-cotizaciones tbody');
    var cotizaciones = (data.supabase.cotizaciones && data.supabase.cotizaciones.recientes) || [];
    if (!cotizaciones.length) {
      cotizBody.innerHTML = '<tr><td colspan="5">Todavía no hay cotizaciones registradas.</td></tr>';
    } else {
      cotizBody.innerHTML = cotizaciones.map(function (c) {
        var fecha = c.created_at ? new Date(c.created_at).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
        var contacto = c.telefono || c.email || '';
        var cargasTxt = c.cargas === 'si' ? ('con cargas' + (c.cargas_edades ? ' (' + c.cargas_edades + ')' : '')) : '';
        var detalle = [c.edad ? c.edad + ' años' : '', c.sexo, c.region, cargasTxt, c.motivo].filter(Boolean).join(' · ');
        var telLimpio = (c.telefono || '').replace(/[^0-9]/g, '');
        var waLink = telLimpio ? '<a href="https://wa.me/' + telLimpio + '" target="_blank" rel="noopener" style="color:var(--blue); font-weight:700; text-decoration:none;">WhatsApp →</a>' : '';
        return '<tr><td>' + fecha + '</td><td>' + escapeHtml(c.nombre) + '</td><td>' + escapeHtml(contacto) + '</td><td>' + escapeHtml(detalle) + '</td><td>' + waLink + '</td></tr>';
      }).join('');
    }

    var notice = document.getElementById('ga4-notice');
    if (!data.ga4.configured) {
      notice.style.display = 'block';
      notice.innerHTML = '<div class="notice"><strong>Google Analytics no está conectado todavía.</strong> Las visitas del sitio se muestran como "—" hasta que se configure la cuenta de servicio de Google (GA4_PROPERTY_ID, GA4_SA_EMAIL, GA4_SA_PRIVATE_KEY) en Vercel.</div>';
    } else if (data.ga4.error) {
      notice.style.display = 'block';
      notice.innerHTML = '<div class="notice"><strong>No se pudo leer Google Analytics:</strong> ' + data.ga4.error + '</div>';
    } else {
      notice.style.display = 'none';
    }
  }

  sb.auth.getSession().then(function (res) {
    session = res.data && res.data.session;
    if (!session) {
      window.location.href = '/ejecutivos/?next=' + encodeURIComponent(window.location.pathname);
      return;
    }
    root.style.visibility = 'visible';
    if ((session.user.email || '').toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      document.getElementById('not-admin-msg').style.display = 'block';
      return;
    }
    document.getElementById('panel-area').style.display = 'block';
    document.getElementById('loading-msg').style.display = 'block';

    fetch('/api/dashboard-summary', { headers: { Authorization: 'Bearer ' + session.access_token } })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
      .then(function (res) {
        document.getElementById('loading-msg').style.display = 'none';
        if (!res.ok) {
          document.getElementById('error-msg').style.display = 'block';
          document.getElementById('error-msg').textContent = res.body.error || 'No se pudo cargar el panel.';
          return;
        }
        render(res.body);
      })
      .catch(function (err) {
        document.getElementById('loading-msg').style.display = 'none';
        document.getElementById('error-msg').style.display = 'block';
        document.getElementById('error-msg').textContent = err.message;
      });
  });

  document.getElementById('logout-link').addEventListener('click', function (e) {
    e.preventDefault();
    sb.auth.signOut().then(function () { window.location.href = '/ejecutivos/'; });
  });
})();
