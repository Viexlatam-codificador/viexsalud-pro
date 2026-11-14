(function () {
  "use strict";

  var fmtCurrency = function (n) {
    return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
  };
  var fmtPercent = function (n) {
    return n.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
  };
  var fmtNumber = function (n, decimals) {
    return n.toLocaleString('es-CL', { minimumFractionDigits: decimals || 0, maximumFractionDigits: decimals || 0 });
  };
  var parseLocaleNumber = function (str) {
    if (!str) return NaN;
    var cleaned = String(str).replace(/[^0-9,.-]/g, '');
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned);
  };
  var clamp = function (n, min, max) { return Math.max(min, Math.min(max, n)); };

  function printBrandedResult(opts) {
    document.getElementById('print-title').textContent = opts.title;
    document.getElementById('print-big-label').textContent = opts.bigLabel;
    document.getElementById('print-big').textContent = opts.bigValue;
    document.getElementById('print-explain').textContent = opts.explain;
    var table = document.getElementById('print-table');
    table.innerHTML = opts.rows.map(function (r) {
      return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>';
    }).join('');
    window.print();
  }

  function breakdownToRows(containerId) {
    var rows = [];
    var el = document.getElementById(containerId);
    Array.prototype.forEach.call(el.querySelectorAll('.row'), function (row) {
      var spans = row.querySelectorAll('span');
      rows.push([spans[0].textContent, spans[1].textContent]);
    });
    return rows;
  }

  // ---------- NOVENOS ----------
  var modeAuto = document.getElementById('mode-auto');
  var modeManual = document.getElementById('mode-manual');
  var panelAuto = document.getElementById('panel-auto');
  var panelManual = document.getElementById('panel-manual');

  function syncMode() {
    var auto = modeAuto.checked;
    panelAuto.style.display = auto ? '' : 'none';
    panelManual.style.display = auto ? 'none' : '';
  }
  modeAuto.addEventListener('change', syncMode);
  modeManual.addEventListener('change', syncMode);

  var fechaInicio = document.getElementById('fecha-inicio');
  var fechaParto = document.getElementById('fecha-parto');
  var mesesManual = document.getElementById('meses-manual');
  var coberturaPlan = document.getElementById('cobertura-plan');
  var errorNovenos = document.getElementById('error-novenos');
  var resultNovenos = document.getElementById('result-novenos');

  function showErrorNovenos(msg) {
    errorNovenos.textContent = msg;
    errorNovenos.classList.add('show');
    resultNovenos.classList.remove('show');
  }
  function clearErrorNovenos() {
    errorNovenos.classList.remove('show');
    errorNovenos.textContent = '';
  }

  function fullMonthsBetween(start, end) {
    var months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (end.getDate() < start.getDate()) months -= 1;
    return months;
  }

  document.getElementById('calc-novenos').addEventListener('click', function () {
    clearErrorNovenos();
    var meses, rawMeses, noteExtra = '';

    if (modeAuto.checked) {
      if (!fechaInicio.value || !fechaParto.value) {
        showErrorNovenos('Ingresa ambas fechas: inicio de contrato y fecha probable de parto.');
        return;
      }
      var d1 = new Date(fechaInicio.value + 'T00:00:00');
      var d2 = new Date(fechaParto.value + 'T00:00:00');
      if (d2 <= d1) {
        showErrorNovenos('La fecha probable de parto debe ser posterior a la fecha de inicio del contrato.');
        return;
      }
      rawMeses = fullMonthsBetween(d1, d2);
      if (rawMeses > 9) {
        noteExtra = 'El contrato estará vigente ' + rawMeses + ' meses antes del parto (más de los 9 del embarazo), por lo que la cobertura no queda restringida por novenos.';
        meses = 9;
      } else {
        meses = clamp(rawMeses, 0, 9);
      }
    } else {
      if (mesesManual.value === '') {
        showErrorNovenos('Ingresa cuántos meses alcanzará a tener vigente el plan (0 a 9).');
        return;
      }
      rawMeses = parseFloat(mesesManual.value);
      if (isNaN(rawMeses) || rawMeses < 0 || rawMeses > 9) {
        showErrorNovenos('El número de meses debe estar entre 0 y 9.');
        return;
      }
      meses = rawMeses;
    }

    var planPctRaw = coberturaPlan.value === '' ? null : parseFloat(coberturaPlan.value);
    if (planPctRaw !== null && (isNaN(planPctRaw) || planPctRaw < 0 || planPctRaw > 100)) {
      showErrorNovenos('La cobertura del plan debe ser un porcentaje entre 0 y 100.');
      return;
    }

    var baseFraction = meses / 9;
    var basePct = baseFraction * 100;
    var efectivaPct = planPctRaw !== null ? planPctRaw * baseFraction : null;

    var mainPct = efectivaPct !== null ? efectivaPct : basePct;
    document.getElementById('novenos-result-label').textContent = efectivaPct !== null ? 'Cobertura efectiva del parto' : 'Cobertura del parto (novenos)';
    document.getElementById('novenos-big').textContent = fmtPercent(mainPct);
    document.getElementById('novenos-bar').style.width = clamp(mainPct, 0, 100) + '%';

    var rows = [];
    rows.push(['Meses de vigencia considerados', fmtNumber(meses, meses % 1 === 0 ? 0 : 1) + ' de 9']);
    rows.push(['Cobertura por novenos (meses / 9)', fmtPercent(basePct)]);
    if (planPctRaw !== null) {
      rows.push(['Cobertura del plan', fmtPercent(planPctRaw)]);
      rows.push(['Cobertura efectiva estimada', fmtPercent(efectivaPct)]);
    }
    document.getElementById('novenos-breakdown').innerHTML = rows.map(function (r) {
      return '<div class="row"><span>' + r[0] + '</span><span>' + r[1] + '</span></div>';
    }).join('');

    var explain = 'El cálculo de novenos corresponde a la proporción del tiempo que el plan de salud estará vigente durante los nueve meses del embarazo. Mientras más meses tenga vigente el contrato antes del parto, mayor será la cobertura efectiva.';
    if (noteExtra) explain = noteExtra + ' ' + explain;
    document.getElementById('novenos-explain').textContent = explain;

    resultNovenos.classList.add('show');

    resultNovenos.dataset.summary =
      'Cálculo de Novenos — Cobertura de Parto\n' +
      'Meses de vigencia considerados: ' + fmtNumber(meses, meses % 1 === 0 ? 0 : 1) + ' de 9\n' +
      'Cobertura por novenos: ' + fmtPercent(basePct) + '\n' +
      (planPctRaw !== null ? 'Cobertura del plan: ' + fmtPercent(planPctRaw) + '\nCobertura efectiva estimada: ' + fmtPercent(efectivaPct) + '\n' : '') +
      '\n' + explain + '\n\nCálculo referencial, sujeto a las condiciones del plan y normativa vigente.';
  });

  document.getElementById('clear-novenos').addEventListener('click', function () {
    fechaInicio.value = '';
    fechaParto.value = '';
    mesesManual.value = '';
    coberturaPlan.value = '';
    clearErrorNovenos();
    resultNovenos.classList.remove('show');
  });

  document.getElementById('copy-novenos').addEventListener('click', function () {
    var text = resultNovenos.dataset.summary || '';
    if (!text) return;
    navigator.clipboard.writeText(text).then(function () {
      var btn = document.getElementById('copy-novenos');
      var old = btn.textContent;
      btn.textContent = 'Copiado ✓';
      setTimeout(function () { btn.textContent = old; }, 1500);
    });
  });
  document.getElementById('print-novenos').addEventListener('click', function () {
    if (!resultNovenos.classList.contains('show')) return;
    printBrandedResult({
      title: 'Cobertura por Novenos',
      bigLabel: document.getElementById('novenos-result-label').textContent,
      bigValue: document.getElementById('novenos-big').textContent,
      rows: breakdownToRows('novenos-breakdown'),
      explain: document.getElementById('novenos-explain').textContent
    });
  });

  document.getElementById('whatsapp-novenos').addEventListener('click', function () {
    var text = resultNovenos.dataset.summary || '';
    if (!text) return;
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
  });

  // ---------- 7% LEGAL ----------
  var ufInput = document.getElementById('valor-uf');
  var topeInput = document.getElementById('tope-uf');
  var errorSiete = document.getElementById('error-siete');
  var resultSiete = document.getElementById('result-siete');
  var ufNote = document.getElementById('uf-note');
  var rentaInputsContainer = document.getElementById('renta-inputs-container');
  var rentaInputsLabel = document.getElementById('renta-inputs-label');

  function liveFormatCurrencyField(input) {
    input.addEventListener('input', function () {
      var digits = input.value.replace(/[^0-9]/g, '');
      if (!digits) { input.value = ''; return; }
      input.value = parseInt(digits, 10).toLocaleString('es-CL');
    });
  }
  function currentMesesCount() {
    var checked = document.querySelector('input[name="meses-count"]:checked');
    return checked ? parseInt(checked.value, 10) : 1;
  }

  function renderRentaInputs(n, preserved) {
    rentaInputsContainer.innerHTML = '';
    rentaInputsLabel.textContent = n === 1 ? 'Renta imponible mensual' : 'Renta imponible de cada uno de los últimos ' + n + ' meses';
    for (var i = 0; i < n; i++) {
      var row = document.createElement('div');
      row.className = 'renta-mes-row';
      var tag = document.createElement('span');
      tag.className = 'renta-mes-tag';
      tag.textContent = n === 1 ? '' : 'Mes ' + (i + 1);
      var input = document.createElement('input');
      input.type = 'text';
      input.inputMode = 'numeric';
      input.placeholder = '$ 1.250.000';
      input.className = 'renta-mes-input';
      if (preserved && preserved[i]) input.value = preserved[i];
      liveFormatCurrencyField(input);
      row.appendChild(tag);
      row.appendChild(input);
      rentaInputsContainer.appendChild(row);
    }
  }
  renderRentaInputs(1);

  Array.prototype.forEach.call(document.querySelectorAll('input[name="meses-count"]'), function (radio) {
    radio.addEventListener('change', function () {
      var preserved = Array.prototype.map.call(rentaInputsContainer.querySelectorAll('.renta-mes-input'), function (i) { return i.value; });
      renderRentaInputs(currentMesesCount(), preserved);
    });
  });

  function showErrorSiete(msg) {
    errorSiete.textContent = msg;
    errorSiete.classList.add('show');
    resultSiete.classList.remove('show');
  }
  function clearErrorSiete() {
    errorSiete.classList.remove('show');
    errorSiete.textContent = '';
  }

  document.getElementById('reset-tope').addEventListener('click', function () {
    topeInput.value = '90';
  });

  document.getElementById('fetch-uf').addEventListener('click', function () {
    ufNote.textContent = 'Consultando mindicador.cl…';
    ufNote.className = 'uf-note';
    fetch('https://mindicador.cl/api/uf')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var valor = data && data.serie && data.serie[0] && data.serie[0].valor;
        if (!valor) throw new Error('sin datos');
        ufInput.value = valor.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        ufNote.textContent = 'UF actualizada: ' + (data.serie[0].fecha ? data.serie[0].fecha.slice(0, 10) : 'hoy') + '.';
        ufNote.className = 'uf-note ok';
      })
      .catch(function () {
        ufNote.textContent = 'No se pudo obtener el valor automáticamente. Ingresa el valor UF manualmente.';
        ufNote.className = 'uf-note err';
      });
  });

  document.getElementById('calc-siete').addEventListener('click', function () {
    clearErrorSiete();
    var n = currentMesesCount();
    var mesInputs = rentaInputsContainer.querySelectorAll('.renta-mes-input');
    var rentas = [];
    for (var i = 0; i < mesInputs.length; i++) {
      var v = parseLocaleNumber(mesInputs[i].value);
      if (isNaN(v) || v <= 0) {
        showErrorSiete(n === 1
          ? 'Ingresa una renta imponible válida, mayor a 0.'
          : 'Ingresa una renta imponible válida (mayor a 0) para cada uno de los ' + n + ' meses.');
        return;
      }
      rentas.push(v);
    }
    var renta = rentas.reduce(function (a, b) { return a + b; }, 0) / rentas.length;

    var uf = parseLocaleNumber(ufInput.value);
    var tope = parseLocaleNumber(topeInput.value);

    if (isNaN(uf) || uf <= 0) {
      showErrorSiete('Ingresa un valor UF válido, mayor a 0.');
      return;
    }
    if (isNaN(tope) || tope <= 0) {
      showErrorSiete('Ingresa un tope legal (en UF) válido, mayor a 0.');
      return;
    }

    var topePesos = uf * tope;
    var superaTope = renta > topePesos;
    var base = superaTope ? topePesos : renta;
    var cotizacion = base * 0.07;

    document.getElementById('siete-big').textContent = fmtCurrency(cotizacion);

    var rentaLabel = n === 1 ? 'Renta imponible' : 'Renta promedio (' + n + ' meses)';
    var rows = [];
    if (n > 1) {
      rentas.forEach(function (r, idx) {
        rows.push(['Mes ' + (idx + 1), fmtCurrency(r)]);
      });
    }
    rows.push([rentaLabel, fmtCurrency(renta)]);
    rows.push(['Tope legal (' + fmtNumber(tope, tope % 1 === 0 ? 0 : 1) + ' UF)', fmtCurrency(topePesos)]);
    rows.push(['Base de cálculo utilizada', fmtCurrency(base)]);
    document.getElementById('siete-breakdown').innerHTML = rows.map(function (r) {
      return '<div class="row"><span>' + r[0] + '</span><span>' + r[1] + '</span></div>';
    }).join('');

    var baseExplain = superaTope
      ? 'Como la renta imponible supera el tope legal mensual (' + fmtNumber(tope, tope % 1 === 0 ? 0 : 1) + ' UF), el cálculo del 7% se realizó sobre dicho límite y no sobre la totalidad de la remuneración.'
      : 'La renta imponible no supera el tope legal mensual, por lo que el 7% se calculó sobre el total de la renta.';
    var explain = n > 1
      ? 'El cálculo se realizó sobre el promedio de renta imponible de los últimos ' + n + ' meses, según el criterio definido por la Isapre. ' + baseExplain
      : baseExplain;
    document.getElementById('siete-explain').textContent = explain;

    resultSiete.classList.add('show');

    resultSiete.dataset.summary =
      'Cálculo 7% Legal de Salud (Calculadora Isapre — Viex Salud)\n' +
      (n > 1 ? rentas.map(function (r, idx) { return 'Mes ' + (idx + 1) + ': ' + fmtCurrency(r); }).join('\n') + '\n' : '') +
      rentaLabel + ': ' + fmtCurrency(renta) + '\n' +
      'Valor UF: ' + fmtCurrency(uf) + '\n' +
      'Tope legal: ' + fmtNumber(tope, tope % 1 === 0 ? 0 : 1) + ' UF = ' + fmtCurrency(topePesos) + '\n' +
      'Base de cálculo: ' + fmtCurrency(base) + '\n' +
      'Cotización obligatoria (7%): ' + fmtCurrency(cotizacion) + '\n\n' +
      explain + '\n\nCálculo referencial, verifica el tope imponible vigente con Previred.';
  });

  document.getElementById('clear-siete').addEventListener('click', function () {
    document.getElementById('mc-1').checked = true;
    renderRentaInputs(1);
    ufInput.value = '';
    topeInput.value = '90';
    ufNote.textContent = '';
    ufNote.className = 'uf-note';
    clearErrorSiete();
    resultSiete.classList.remove('show');
  });

  document.getElementById('copy-siete').addEventListener('click', function () {
    var text = resultSiete.dataset.summary || '';
    if (!text) return;
    navigator.clipboard.writeText(text).then(function () {
      var btn = document.getElementById('copy-siete');
      var old = btn.textContent;
      btn.textContent = 'Copiado ✓';
      setTimeout(function () { btn.textContent = old; }, 1500);
    });
  });
  document.getElementById('print-siete').addEventListener('click', function () {
    if (!resultSiete.classList.contains('show')) return;
    printBrandedResult({
      title: 'Cálculo del 7% Legal',
      bigLabel: 'Cotización obligatoria (7%)',
      bigValue: document.getElementById('siete-big').textContent,
      rows: breakdownToRows('siete-breakdown'),
      explain: document.getElementById('siete-explain').textContent
    });
  });

  document.getElementById('whatsapp-siete').addEventListener('click', function () {
    var text = resultSiete.dataset.summary || '';
    if (!text) return;
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
  });
})();
