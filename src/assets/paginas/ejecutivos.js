(function () {
  "use strict";
  var sb = window.VIEX_SUPABASE;

  var tabLogin = document.getElementById('tab-login');
  var tabSignup = document.getElementById('tab-signup');
  var panelLogin = document.getElementById('panel-login');
  var panelSignup = document.getElementById('panel-signup');
  var panelForgot = document.getElementById('panel-forgot');
  var panelReset = document.getElementById('panel-reset');
  var allPanels = [panelLogin, panelSignup, panelForgot, panelReset];

  function showTab(which) {
    var loginActive = which === 'login';
    var signupActive = which === 'signup';
    tabLogin.classList.toggle('active', loginActive);
    tabSignup.classList.toggle('active', signupActive);
    allPanels.forEach(function (p) { p.classList.remove('active'); });
    if (which === 'login') panelLogin.classList.add('active');
    else if (which === 'signup') panelSignup.classList.add('active');
    else if (which === 'forgot') panelForgot.classList.add('active');
    else if (which === 'reset') panelReset.classList.add('active');
  }
  tabLogin.addEventListener('click', function () { showTab('login'); });
  tabSignup.addEventListener('click', function () { showTab('signup'); });
  document.getElementById('forgot-link').addEventListener('click', function (e) { e.preventDefault(); showTab('forgot'); });
  document.getElementById('back-to-login-link').addEventListener('click', function (e) { e.preventDefault(); showTab('login'); });

  function showMsg(el, text, isError) {
    el.textContent = text;
    el.className = 'msg show ' + (isError ? 'error' : 'ok');
  }

  function friendlyError(err) {
    var m = (err && err.message) || '';
    if (m.indexOf('Invalid login credentials') !== -1) return 'Correo o contraseña incorrectos.';
    if (m.indexOf('already registered') !== -1 || m.indexOf('already exists') !== -1) return 'Ese correo ya tiene una cuenta. Prueba iniciar sesión.';
    if (m.indexOf('Password should be at least') !== -1) return 'La contraseña debe tener al menos 6 caracteres.';
    if (m.indexOf('Unable to validate email') !== -1 || m.indexOf('invalid') !== -1) return 'Revisa que el correo esté bien escrito.';
    return m || 'Ocurrió un error. Intenta de nuevo.';
  }

  var params = new URLSearchParams(window.location.search);
  var redirectTo = params.get('next') || '/recursos-ejecutivos/';
  var isRecovery = window.location.hash.indexOf('type=recovery') !== -1;

  if (isRecovery) {
    showTab('reset');
  } else {
    sb.auth.getSession().then(function (res) {
      if (res.data && res.data.session) {
        window.location.href = redirectTo;
      }
    });
  }

  document.getElementById('panel-forgot').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = document.getElementById('forgot-submit');
    var msg = document.getElementById('forgot-msg');
    msg.className = 'msg';
    btn.disabled = true;
    btn.textContent = 'Enviando...';

    sb.auth.resetPasswordForEmail(document.getElementById('forgot-email').value.trim(), {
      redirectTo: window.location.origin + '/ejecutivos/'
    }).then(function (res) {
      btn.disabled = false;
      btn.textContent = 'Enviar enlace';
      if (res.error) {
        showMsg(msg, friendlyError(res.error), true);
        return;
      }
      showMsg(msg, 'Listo. Revisa tu correo (y spam) para el enlace de recuperación.', false);
    });
  });

  document.getElementById('panel-reset').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = document.getElementById('reset-submit');
    var msg = document.getElementById('reset-msg');
    msg.className = 'msg';
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    sb.auth.updateUser({ password: document.getElementById('reset-password').value }).then(function (res) {
      if (res.error) {
        showMsg(msg, friendlyError(res.error), true);
        btn.disabled = false;
        btn.textContent = 'Guardar nueva contraseña';
        return;
      }
      showMsg(msg, 'Contraseña actualizada. Entrando...', false);
      setTimeout(function () { window.location.href = redirectTo; }, 1200);
    });
  });

  document.getElementById('panel-login').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = document.getElementById('login-submit');
    var msg = document.getElementById('login-msg');
    msg.className = 'msg';
    btn.disabled = true;
    btn.textContent = 'Entrando...';

    sb.auth.signInWithPassword({
      email: document.getElementById('login-email').value.trim(),
      password: document.getElementById('login-password').value
    }).then(function (res) {
      if (res.error) {
        showMsg(msg, friendlyError(res.error), true);
        btn.disabled = false;
        btn.textContent = 'Entrar';
        return;
      }
      window.location.href = redirectTo;
    });
  });

  document.getElementById('panel-signup').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = document.getElementById('signup-submit');
    var msg = document.getElementById('signup-msg');
    msg.className = 'msg';

    var nombre = document.getElementById('signup-nombre').value.trim();
    var telefono = document.getElementById('signup-telefono').value.trim();
    var email = document.getElementById('signup-email').value.trim();
    var pw1 = document.getElementById('signup-password').value;
    var pw2 = document.getElementById('signup-password2').value;

    if (pw1 !== pw2) {
      showMsg(msg, 'Las contraseñas no coinciden.', true);
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Creando...';

    sb.auth.signUp({ email: email, password: pw1, options: { data: { nombre: nombre, telefono: telefono } } }).then(function (res) {
      btn.disabled = false;
      btn.textContent = 'Crear cuenta';
      if (res.error) {
        showMsg(msg, friendlyError(res.error), true);
        return;
      }
      if (res.data && res.data.session) {
        window.location.href = redirectTo;
        return;
      }
      showMsg(msg, 'Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.', false);
    });
  });
})();
