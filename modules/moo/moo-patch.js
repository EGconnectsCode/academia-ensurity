/**
 * moo-patch.js — Supabase migration patch for moo-dashboard.html (Mutual of Omaha)
 */

(function () {
  'use strict';

  const MODULE_ID = 'moo';

  // ── Design system + UI overrides ──
  (function injectDesign() {
    const style = document.createElement('style');
    style.textContent = `
      #login-screen, #auth-screen { display: none !important; }

      .topbar-right { margin-left:auto!important; display:flex!important; align-items:center!important; gap:8px!important; }
      .admin-only { display:none!important; }
      body.is-admin .admin-only { display:none!important; }

      .az-topbar-signout { background:#DC2626!important; border:2px solid #ef4444!important;
        color:#fff!important; padding:8px 20px!important; border-radius:8px!important; font-size:.85rem!important;
        font-weight:700!important; cursor:pointer!important; font-family:inherit!important; transition:all .15s!important;
        white-space:nowrap!important; letter-spacing:.01em!important; box-shadow:0 2px 8px rgba(220,38,38,.4)!important; }
      .az-topbar-signout:hover { background:#b91c1c!important; border-color:#dc2626!important;
        box-shadow:0 4px 12px rgba(220,38,38,.5)!important; }

      .az-lang-toggle { display:flex!important; background:rgba(255,255,255,.08)!important;
        border:1px solid rgba(255,255,255,.15)!important; border-radius:8px!important; padding:3px!important; }
      .az-lb { background:transparent!important; border:none!important; color:rgba(255,255,255,.55)!important;
        border-radius:6px!important; padding:3px 9px!important; font-size:.75rem!important; font-weight:700!important;
        cursor:pointer!important; transition:all .15s!important; letter-spacing:.02em!important; }
      .az-lb.active { background:#fff!important; color:#0b1420!important; }
      .az-lb:hover:not(.active) { color:#fff!important; background:rgba(255,255,255,.1)!important; }
      .az-topbar-dark { background:transparent!important; border:1px solid rgba(255,255,255,.2)!important; color:#fff!important; width:28px!important; height:28px!important; border-radius:6px!important; cursor:pointer!important; font-size:.85rem!important; display:flex!important; align-items:center!important; justify-content:center!important; padding:0!important; flex-shrink:0!important; }
      .az-topbar-dark:hover { background:rgba(255,255,255,.1)!important; }
      .az-admin-back { background:rgba(212,175,55,.15)!important; border:1px solid rgba(212,175,55,.4)!important; color:#d4af37!important; padding:4px 12px!important; border-radius:6px!important; font-size:.75rem!important; font-weight:700!important; cursor:pointer!important; text-decoration:none!important; display:flex!important; align-items:center!important; white-space:nowrap!important; }
      .az-admin-back:hover { background:rgba(212,175,55,.25)!important; }

      .admin-only { display:none!important; }
      body.is-admin .admin-only { display:flex!important; }
      .sb-item[data-page="admin-users"],
      .sb-item[data-page="admin-activity"],
      .sb-item[data-page="admin-ranking"] { display:none!important; }
      #page-admin-users, #page-admin-activity, #page-admin-ranking { display:none!important; }
    `;
    document.head.appendChild(style);

    document.addEventListener('DOMContentLoaded', function () {
      var acts = document.querySelector('.topbar-right') || document.querySelector('#topbar') || document.querySelector('.topbar');
      if (acts) {
        var backBtn = document.createElement('a');
        backBtn.className = 'az-admin-back';
        backBtn.href = '/';
        backBtn.innerHTML = '<span class="en">← Dashboard</span><span class="es">← Inicio</span>';
        acts.insertBefore(backBtn, acts.firstChild);

        var div = document.createElement('div');
        div.className = 'az-lang-toggle';
        div.innerHTML =
          '<button class="az-lb" id="az-lb-en" onclick="window._azLang(\'en\')">EN</button>' +
          '<button class="az-lb" id="az-lb-es" onclick="window._azLang(\'es\')">ES</button>';
        acts.appendChild(div);

        window._azLang = function (lang) {
          document.getElementById('az-lb-en') && document.getElementById('az-lb-en').classList.toggle('active', lang === 'en');
          document.getElementById('az-lb-es') && document.getElementById('az-lb-es').classList.toggle('active', lang === 'es');
          if (window.setLang && window.LANG !== lang) window.setLang(lang);
        };
        window._azLang(window.LANG === 'es' ? 'es' : 'en');

        var darkBtn = document.createElement('button');
        darkBtn.className = 'az-topbar-dark';
        darkBtn.title = 'Dark mode / Modo noche';
        darkBtn.textContent = '🌙';
        darkBtn.onclick = function () { if (typeof window.toggleDark === 'function') window.toggleDark(); };
        acts.appendChild(darkBtn);

        var soBtn = document.createElement('button');
        soBtn.className = 'az-topbar-signout';
        soBtn.innerHTML = '<span class="en">Sign Out</span><span class="es">Cerrar Sesión</span>';
        soBtn.onclick = function () { if (window.doSignOut) window.doSignOut(); };
        acts.appendChild(soBtn);
      }
    });
  })();

  // ── PDF Preview Modal ──
  (function injectPdfPreview() {
    const s = document.createElement('style');
    s.textContent = `
      #az-pdf-modal { display:none; position:fixed; inset:0; z-index:10000; }
      #az-pdf-modal.active { display:flex; align-items:center; justify-content:center; }
      .az-pdf-backdrop { position:absolute; inset:0; background:rgba(0,0,0,.65); backdrop-filter:blur(3px); }
      .az-pdf-panel { position:relative; width:min(92vw,1100px); height:90vh; background:#fff; border-radius:14px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 25px 60px rgba(0,0,0,.35); }
      .az-pdf-header { display:flex; align-items:center; gap:12px; padding:12px 16px; background:#0b1420; color:#fff; flex-shrink:0; }
      .az-pdf-title { font-weight:600; font-size:.9rem; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .az-pdf-dl { background:#1c3d5a; color:#fff!important; padding:6px 14px; border-radius:8px; font-size:.8rem; font-weight:600; text-decoration:none; white-space:nowrap; }
      .az-pdf-dl:hover { background:#15304a; }
      .az-pdf-close { background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.2); color:#fff; width:32px; height:32px; border-radius:50%; cursor:pointer; font-size:1rem; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
      .az-pdf-close:hover { background:rgba(255,255,255,.2); }
      .az-pdf-frame { flex:1; width:100%; border:none; }
    `;
    document.head.appendChild(s);

    const modal = document.createElement('div');
    modal.id = 'az-pdf-modal';
    modal.innerHTML = `
      <div class="az-pdf-backdrop" onclick="window.closePdfPreview()"></div>
      <div class="az-pdf-panel">
        <div class="az-pdf-header">
          <span class="az-pdf-title" id="az-pdf-title">Documento</span>
          <a class="az-pdf-dl" id="az-pdf-dl" target="_blank" download><span class="en">&#8659; Download</span><span class="es">&#8659; Descargar</span></a>
          <button class="az-pdf-close" onclick="window.closePdfPreview()">&#10005;</button>
        </div>
        <iframe class="az-pdf-frame" id="az-pdf-frame" src="" frameborder="0"></iframe>
      </div>
    `;
    document.body.appendChild(modal);

    window.showPdfPreview = function (url, title) {
      document.getElementById('az-pdf-title').textContent = title || 'Documento';
      document.getElementById('az-pdf-frame').src = url;
      document.getElementById('az-pdf-dl').href = url;
      document.getElementById('az-pdf-modal').classList.add('active');
      document.body.style.overflow = 'hidden';
    };
    window.closePdfPreview = function () {
      document.getElementById('az-pdf-modal').classList.remove('active');
      document.getElementById('az-pdf-frame').src = '';
      document.body.style.overflow = '';
    };
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') window.closePdfPreview();
    });
  })();

  // ── Video Modal (inline playback, no new tab) ──
  (function injectVideoModal() {
    const s = document.createElement('style');
    s.textContent = `
      #az-vid-modal { display:none; position:fixed; inset:0; z-index:10001; align-items:center; justify-content:center; }
      #az-vid-modal.active { display:flex; }
      .az-vid-backdrop { position:absolute; inset:0; background:rgba(0,0,0,.82); backdrop-filter:blur(4px); cursor:pointer; }
      .az-vid-panel { position:relative; width:min(94vw,960px); background:#000; border-radius:14px; overflow:hidden; box-shadow:0 25px 60px rgba(0,0,0,.5); z-index:1; }
      .az-vid-header { display:flex; align-items:center; gap:12px; padding:10px 16px; background:#0b1420; color:#fff; }
      .az-vid-title { font-weight:600; font-size:.88rem; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .az-vid-close { background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.2); color:#fff; width:30px; height:30px; border-radius:50%; cursor:pointer; font-size:.9rem; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
      .az-vid-close:hover { background:rgba(255,255,255,.22); }
      .az-vid-frame-wrap { position:relative; padding-bottom:56.25%; height:0; }
      .az-vid-frame { position:absolute; inset:0; width:100%; height:100%; border:none; }
    `;
    document.head.appendChild(s);

    const modal = document.createElement('div');
    modal.id = 'az-vid-modal';
    modal.innerHTML = `
      <div class="az-vid-backdrop" onclick="window.azCloseVideo()"></div>
      <div class="az-vid-panel">
        <div class="az-vid-header">
          <span class="az-vid-title" id="az-vid-title">Video</span>
          <button class="az-vid-close" onclick="window.azCloseVideo()">&#10005;</button>
        </div>
        <div class="az-vid-frame-wrap">
          <iframe class="az-vid-frame" id="az-vid-frame" src="" frameborder="0"
            allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
        </div>
      </div>`;
    document.body.appendChild(modal);

    window.azShowVideo = function (url, title) {
      document.getElementById('az-vid-title').textContent = title || 'Video';
      document.getElementById('az-vid-frame').src = url;
      document.getElementById('az-vid-modal').classList.add('active');
      document.body.style.overflow = 'hidden';
    };
    window.azCloseVideo = function () {
      document.getElementById('az-vid-modal').classList.remove('active');
      document.getElementById('az-vid-frame').src = '';
      document.body.style.overflow = '';
    };
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') window.azCloseVideo();
    });

    window.openVideo = function (url, title) {
      var m = url.match(/player\.vimeo\.com\/video\/(\d+)/i);
      var embedUrl = url;
      if (m && url.indexOf('autoplay=1') === -1) {
        embedUrl += (url.indexOf('?') === -1 ? '?' : '&') + 'autoplay=1';
      }
      window.azShowVideo(embedUrl, title);
    };
  })();

  // Patch window.dl() to show preview for stored PDF URLs
  function _patchDl() {
    var _orig = window.dl;
    if (!_orig) return;
    window.dl = function (name, key, fname) {
      var el = document.getElementById('pdf_' + key);
      if (!el) { _orig(name, key, fname); return; }
      var content = el.textContent.trim();
      if (content.startsWith('http')) {
        window.showPdfPreview(content, name);
        if (window.trackDownload) window.trackDownload(fname || name);
      } else {
        try {
          var bin = atob(content);
          var arr = new Uint8Array(bin.length);
          for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
          window.showPdfPreview(URL.createObjectURL(new Blob([arr], { type: 'application/pdf' })), name);
          if (window.trackDownload) window.trackDownload(fname || name);
        } catch (e) { _orig(name, key, fname); }
      }
    };
  }

  function whenReady(fn) {
    if (window.AZ && window.AZ.Auth) { fn(); return; }
    var t = setInterval(function () { if (window.AZ && window.AZ.Auth) { clearInterval(t); fn(); } }, 50);
  }

  // ── OVERRIDE SIGN IN ──
  window.doSignIn = async function () {
    var emailEl = document.getElementById('li-email');
    var passEl  = document.getElementById('li-pass');
    var errEl   = document.getElementById('li-err-pass');
    if (!emailEl || !passEl) return;
    var email = emailEl.value.trim();
    var pass  = passEl.value;
    if (!email || !pass) { if (errEl) errEl.textContent = window.LANG === 'es' ? 'Campos requeridos' : 'Required'; return; }
    try {
      const { user, profile } = await AZ.Auth.signIn(email, pass);
      const hasAccess = await AZ.Modules.hasAccess(profile.id, MODULE_ID);
      const isAdmin   = ['admin', 'super_admin'].includes(profile.role);
      if (!hasAccess && !isAdmin) {
        await AZ.Auth.signOut();
        if (errEl) errEl.textContent = window.LANG === 'es' ? 'Sin acceso a este módulo' : 'No access to this module';
        return;
      }
      _applyUser(user, profile, isAdmin);
      await AZ.Activity.log(MODULE_ID, 'login');
    } catch (err) {
      if (errEl) errEl.textContent = window.LANG === 'es' ? 'Credenciales incorrectas' : 'Invalid credentials';
    }
  };

  // ── OVERRIDE SIGN OUT ──
  window.doSignOut = async function () {
    try { await AZ.Activity.log(MODULE_ID, 'logout'); } catch(e) {}
    await AZ.Auth.signOut();
    window.location.replace('/');
  };
  window.logout = window.doLogout = window.doSignOut;

  // ── OVERRIDE REGISTRATION ──
  window.doRegister = async function () {
    var nameEl  = document.getElementById('re-name');
    var emailEl = document.getElementById('re-email');
    var passEl  = document.getElementById('re-pass');
    if (!emailEl || !passEl) return;
    var name  = nameEl  ? nameEl.value.trim()  : '';
    var email = emailEl.value.trim();
    var pass  = passEl.value;
    var errEl = document.getElementById('re-err-pass') || document.getElementById('re-err-email');
    try {
      await AZ.Auth.signUp(email, pass, name);
      if (errEl) { errEl.style.color = ''; errEl.textContent = window.LANG === 'es' ? '¡Cuenta creada! Revisa tu correo.' : 'Account created! Check your email.'; }
    } catch (err) {
      var msg = err.message && err.message.includes('already') ?
        (window.LANG === 'es' ? 'Correo ya registrado.' : 'Email already registered.') : err.message;
      if (errEl) errEl.textContent = msg;
    }
  };

  // ── OVERRIDE PASSWORD RESET (simplified — full code flow lives on the main login page) ──
  window.doForgot = async function () {
    var emailEl = document.getElementById('fr-email');
    var msgEl   = document.getElementById('fr-msg');
    if (!emailEl) return;
    try {
      await AZ.Auth.sendPasswordReset(emailEl.value.trim());
      if (msgEl) msgEl.textContent = window.LANG === 'es' ? 'Enlace enviado. Revisa tu correo.' : 'Reset link sent. Check your email.';
    } catch (e) { console.error('[MOO Patch] Forgot error:', e.message); }
  };
  window.sendResetCode   = window.doForgot;
  window.verifyResetCode = window.doForgot;
  window.doResetPassword = window.doForgot;

  // ── OVERRIDE DOWNLOAD TRACKING ──
  var _origTrack = window.trackDownload;
  window.trackDownload = async function (fileName) {
    if (_origTrack) _origTrack.call(this, fileName);
    var session = await AZ.Auth.getSession();
    if (!session) return;
    await AZ.Downloads.record(session.user.id, MODULE_ID, fileName);
  };

  // ── OVERRIDE QUIZ COMPLETION ──
  var _origQz = window.qzFinish || window.finishQuiz || window.azFinishQuiz;
  window.qzFinish = window.azFinishQuiz = async function (mid, score, xpEarned) {
    if (_origQz) _origQz.call(this, mid, score, xpEarned);
    var session = await AZ.Auth.getSession();
    if (!session) return;
    try {
      await AZ.Progress.complete(session.user.id, MODULE_ID, mid, score, xpEarned || 0);
      await AZ.Activity.log(MODULE_ID, 'quiz_complete', { quiz: mid, score: score });
    } catch (e) { console.warn('[MOO Patch] qzFinish error:', e.message); }
  };

  // ── SUPPRESS LOCAL ADMIN/USER SEED (no local accounts — Supabase only) ──
  window.initAdminUser = function () {};
  window.getUsers      = function () { return []; };
  window.saveUsers     = function () {};

  // ── BLOCK MODULE-LEVEL LOGIN/REGISTER UI — auth is handled by academia-ensurity.html ──
  var _blockLogin = function () { window.location.replace('/'); };
  window.showLogin = window.showRegister = window.showAuth = _blockLogin;
  window.goToLogin = window.openLogin   = window.displayLogin = _blockLogin;

  function _applyUser(user, profile, isAdmin) {
    var name = profile.full_name || user.email;
    window.CUR_USER = { name: name, email: user.email, isAdmin: isAdmin };
    window.ST = window.ST || {};
    window.ST.xp = profile.xp || 0;

    var ls = document.getElementById('login-screen');
    if (ls) ls.style.display = 'none';
    var app = document.getElementById('app');
    if (app) { app.style.display = 'flex'; app.classList.add('visible'); }

    var sbName   = document.getElementById('sb-name');
    var sbAvatar = document.getElementById('sb-avatar');
    var tbAvatar = document.getElementById('tb-avatar');
    var tbName   = document.getElementById('tb-name');
    var homeName = document.getElementById('home-name');
    if (sbName)   sbName.textContent   = name;
    if (sbAvatar) sbAvatar.textContent = name.charAt(0).toUpperCase();
    if (tbAvatar) tbAvatar.textContent = name.charAt(0).toUpperCase();
    if (tbName)   tbName.textContent   = name;
    if (homeName) homeName.textContent = name.split(' ')[0];

    if (isAdmin) document.body.classList.add('is-admin');
    else         document.body.classList.remove('is-admin');

    _updateStats(profile.xp || 0);
    AZ.Downloads.getForUser(profile.id, MODULE_ID).then(function (dl) {
      _updateStats(profile.xp || 0, dl.length);
    }).catch(function () {});
  }

  function _updateStats(xp, downloads) {
    var dEl = document.getElementById('h-dls');
    var xEl = document.getElementById('h-xp');
    if (dEl && downloads !== undefined) dEl.textContent = downloads;
    if (xEl) xEl.textContent = xp;
  }

  // ── PREFERENCE SAVES ──
  var _origToggleDark = window.toggleDark;
  window.toggleDark = async function () {
    if (_origToggleDark) _origToggleDark.call(this);
    var session = await AZ.Auth.getSession();
    if (!session) return;
    await AZ.Prefs.save(session.user.id, { theme: document.body.classList.contains('dark') ? 'dark' : 'light' });
  };

  var _origSetLang = window.setLang;
  window.setLang = async function (l) {
    if (_origSetLang) _origSetLang.call(this, l);
    // Quiz question/options are plain rendered text — re-render so an open quiz
    // reflects the new language immediately.
    if (window.loadQuiz && window.trainCurrentQuiz && document.getElementById('page-quizzes') && document.getElementById('page-quizzes').classList.contains('active')) {
      window.loadQuiz(window.trainCurrentQuiz);
    }
    var session = await AZ.Auth.getSession();
    if (!session) return;
    await AZ.Prefs.save(session.user.id, { lang: l });
  };

  function _removeAdminUI() {
    document.querySelectorAll('.admin-only').forEach(function(el) { el.remove(); });
  }

  // ── Widget loader ──────────────────────────────────────────────────────────
  function _withWidgets(cb) {
    if (window.AZWidgets) { cb(); return; }
    var s = document.createElement('script');
    s.src = '../../shared/az-widgets.js';
    s.onload = cb;
    s.onerror = function () { console.warn('[MOO Patch] az-widgets.js could not load'); };
    document.head.appendChild(s);
  }

  var _ONBOARD_STEPS_EN = [
    { icon: '🏛', title: 'Welcome to the Mutual of Omaha AOR Portal',
      body: 'Here you will find training modules, product resources, and sales tools for Mutual of Omaha final expense and Medicare Supplement products.' },
    { icon: '📦', title: 'Products & Training',
      body: 'Explore Products, Training and Quizzes in the sidebar menu. Complete each quiz to earn XP and advance your level.' },
    { icon: '📄', title: 'Downloads & Forms',
      body: 'Resources and Sales & Marketing materials include agent guides and brochures. Use "Preview" to view or "Download" to save.' },
    { icon: '📊', title: 'Your Progress',
      body: 'Your XP and level update automatically when you complete quizzes. View your stats in the top navigation bar.' }
  ];

  var _ONBOARD_STEPS = [
    { icon: '🏛', title: 'Bienvenido al Portal AOR de Mutual of Omaha',
      body: 'Aquí encontrarás módulos de entrenamiento, recursos de productos y herramientas de venta para los productos de gastos finales y Medicare Supplement de Mutual of Omaha.' },
    { icon: '📦', title: 'Productos y Entrenamiento',
      body: 'Navega Productos, Entrenamiento y Quizzes en el menú lateral. Completa cada quiz para ganar XP y subir de nivel.' },
    { icon: '📄', title: 'Descargas y Formularios',
      body: 'Recursos y Ventas & Marketing incluyen guías de agente y folletos. Usa "Vista Previa" para ver o "Descargar" para guardar.' },
    { icon: '📊', title: 'Tu Progreso',
      body: 'Tu XP y nivel se actualizan automáticamente al completar los quizzes. Revisa tus estadísticas en la barra superior.' }
  ];

  var _CHAT_FAQS_EN = [
    { label: '📋 Forms',
      keywords: ['form', 'forms', 'application', 'document', 'file'],
      answer: 'Forms and documents are in the "Resources" section of the sidebar. Click "Preview" to view a file, or "Download" to save it.' },
    { label: '📚 Products & Training',
      keywords: ['module', 'course', 'training', 'lesson', 'product'],
      answer: 'Product information and training material are under "Products" and "Training" in the sidebar menu.' },
    { label: '🏆 My XP / Level',
      keywords: ['xp', 'level', 'points', 'progress', 'achievement'],
      answer: 'Your XP and level update automatically when you complete quizzes. View them in the top navigation bar.' },
    { label: '❓ Quiz / Assessment',
      keywords: ['quiz', 'assessment', 'exam', 'test', 'questions'],
      answer: 'Assessments are under "Quizzes" in the sidebar. Select your answers and submit — your result is saved automatically.' },
    { label: '🔐 Access / Password',
      keywords: ['password', 'login', 'access', 'forgot', 'reset'],
      answer: 'If you have trouble signing in, go to the main page and use "Forgot your password?". For access issues write to it@egconnects.com.' },
    { label: '📞 Technical Support',
      keywords: ['support', 'help', 'contact', 'email', 'problem', 'error'],
      answer: 'For technical support write to it@egconnects.com.' }
  ];

  var _CHAT_FAQS = [
    { label: '📋 Formularios',
      keywords: ['formulario', 'form', 'solicitud', 'aplicacion', 'aplicación', 'documentos'],
      answer: 'Los formularios están en la sección "Resources" del menú lateral. Haz clic en "Vista Previa" para verlos, o "Descargar" para guardarlos.' },
    { label: '📚 Productos y Entrenamiento',
      keywords: ['modulo', 'módulo', 'curso', 'entrenamiento', 'training', 'producto'],
      answer: 'La información de productos y el material de entrenamiento están en "Products" y "Training" del menú lateral.' },
    { label: '🏆 Mi XP / Nivel',
      keywords: ['xp', 'nivel', 'puntos', 'progreso', 'avance', 'logro'],
      answer: 'Tu XP y nivel se actualizan al completar los quizzes. Puedes verlos en la barra superior del dashboard.' },
    { label: '❓ Quiz / Evaluación',
      keywords: ['quiz', 'evaluacion', 'evaluación', 'examen', 'prueba', 'test', 'preguntas'],
      answer: 'Las evaluaciones están en "Quizzes" en el menú lateral. Selecciona tus respuestas y envía — tu resultado se guarda automáticamente.' },
    { label: '🔐 Acceso / Contraseña',
      keywords: ['contraseña', 'clave', 'password', 'acceso', 'sesion', 'sesión', 'login'],
      answer: 'Si tienes problemas para iniciar sesión, ve a la página principal y usa "¿Olvidaste tu contraseña?". Para problemas de acceso escribe a it@egconnects.com.' },
    { label: '📞 Soporte Técnico',
      keywords: ['soporte', 'ayuda', 'contacto', 'correo', 'email', 'problema', 'error'],
      answer: 'Para soporte técnico escribe a it@egconnects.com.' }
  ];

  // ── AUTO-LOGIN ──
  whenReady(async function () {
    _patchDl();
    _removeAdminUI();
    try {
      var current = await AZ.Auth.getCurrentUser();
      if (!current) { window.location.replace('/'); return; }
      var user    = current.user;
      var profile = current.profile;
      var hasAccess = await AZ.Modules.hasAccess(profile.id, MODULE_ID);
      var isAdmin   = ['admin', 'super_admin'].includes(profile.role);
      if (!hasAccess && !isAdmin) { await AZ.Auth.signOut(); window.location.replace('/'); return; }
      _applyUser(user, profile, isAdmin);
      // Apply saved preferences
      if (profile.theme === 'dark' && window.toggleDark) {
        if (!document.body.classList.contains('dark')) _origToggleDark && _origToggleDark();
      }
      if (profile.lang && profile.lang !== 'en' && window._azLang) {
        window._azLang(profile.lang);
      }
      _withWidgets(function () {
        var _faqs  = (window.LANG === 'en') ? _CHAT_FAQS_EN    : _CHAT_FAQS;
        var _steps = (window.LANG === 'en') ? _ONBOARD_STEPS_EN : _ONBOARD_STEPS;
        window.AZWidgets.initChat(_faqs, window.LANG);
        setTimeout(function () { window.AZWidgets.initOnboarding(_steps, window.LANG); }, 700);
      });
      await AZ.Activity.log(MODULE_ID, 'login');
    } catch (e) { console.warn('[MOO Patch] auto-login error:', e.message); }
  });

  console.log('[Academia Ensurity] MOO patch loaded ✓');
})();
