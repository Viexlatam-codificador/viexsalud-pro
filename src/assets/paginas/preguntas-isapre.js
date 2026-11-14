(function () {
  "use strict";
  var canalRadios = document.querySelectorAll('input[name="ask-canal"]');
  var contactoLabel = document.getElementById('ask-contacto-label');
  var contactoInput = document.getElementById('ask-contacto');

  function syncContactoLabel() {
    var checked = document.querySelector('input[name="ask-canal"]:checked');
    if (checked && checked.value === 'Correo') {
      contactoLabel.textContent = 'Tu correo electrónico';
      contactoInput.type = 'email';
      contactoInput.placeholder = 'tucorreo@ejemplo.com';
    } else {
      contactoLabel.textContent = 'Tu número de WhatsApp';
      contactoInput.type = 'text';
      contactoInput.placeholder = '+56 9 1234 5678';
    }
  }
  canalRadios.forEach(function (r) { r.addEventListener('change', syncContactoLabel); });

  document.getElementById('ask-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var nombre = document.getElementById('ask-nombre').value.trim();
    var pregunta = document.getElementById('ask-pregunta').value.trim();
    var canal = document.querySelector('input[name="ask-canal"]:checked').value;
    var contacto = document.getElementById('ask-contacto').value.trim();
    if (!nombre || !pregunta || !contacto) return;

    var texto = 'Nueva pregunta desde viexsalud.cl\n\n' +
      'Nombre: ' + nombre + '\n' +
      'Pregunta: ' + pregunta + '\n' +
      'Prefiere respuesta por: ' + canal + '\n' +
      'Contacto (' + canal + '): ' + contacto;

    window.open('https://wa.me/56948627767?text=' + encodeURIComponent(texto), '_blank', 'noopener');
  });
})();
