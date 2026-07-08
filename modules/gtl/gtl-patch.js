/**
 * gtl-patch.js — Supabase migration patch for gtl-dashboard.html (Guarantee Trust Life)
 */

(function () {
  'use strict';

  const MODULE_ID = 'gtl';

  // ── Design system + UI overrides ──
  (function injectDesign() {
    const style = document.createElement('style');
    style.textContent = `
      #login-screen, #auth-screen { display: none !important; }

      :root {
        --az-navy:#0F172A; --az-navy2:#1E293B; --az-blue:#2563EB; --az-cyan:#0891B2;
        --az-bg:#F1F5F9; --az-surface:#FFFFFF; --az-border:#E2E8F0;
        --az-text:#0F172A; --az-text2:#64748B; --az-radius:12px;
        --az-shadow:0 1px 3px rgba(0,0,0,.07),0 4px 12px rgba(0,0,0,.06);
      }

      body { background:var(--az-bg)!important; font-family:'Inter','Segoe UI',system-ui,sans-serif!important; }

      .topbar { background:var(--az-navy)!important; border-bottom:1px solid rgba(255,255,255,.07)!important;
        box-shadow:0 1px 8px rgba(0,0,0,.25)!important; height:54px!important; padding:0 16px!important;
        display:flex!important; align-items:center!important; justify-content:space-between!important; }
      .topbar-logo { font-weight:700!important; font-size:.88rem!important; color:#fff!important; }
      .topbar-banner { display:none!important; }
      .topbar-right { margin-left:auto!important; display:flex!important; align-items:center!important; gap:8px!important; }
      .tb-lang-btn { display:none!important; }
      .tb-dark-btn { display:none!important; }
      button[onclick*="toggleDark"] { display:none!important; }
      .admin-only { display:none!important; }
      body.is-admin .admin-only { display:none!important; }
      .tb-user { display:none!important; }

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
      .az-lb.active { background:#fff!important; color:#0F172A!important; }
      .az-lb:hover:not(.active) { color:#fff!important; background:rgba(255,255,255,.1)!important; }
      .az-topbar-dark { background:transparent!important; border:1px solid rgba(255,255,255,.2)!important; color:#fff!important; width:28px!important; height:28px!important; border-radius:6px!important; cursor:pointer!important; font-size:.85rem!important; display:flex!important; align-items:center!important; justify-content:center!important; padding:0!important; flex-shrink:0!important; }
      .az-topbar-dark:hover { background:rgba(255,255,255,.1)!important; }
      .az-admin-back { background:rgba(251,191,36,.15)!important; border:1px solid rgba(251,191,36,.4)!important; color:#fbbf24!important; padding:4px 12px!important; border-radius:6px!important; font-size:.75rem!important; font-weight:700!important; cursor:pointer!important; text-decoration:none!important; display:none!important; align-items:center!important; white-space:nowrap!important; }
      .az-admin-back:hover { background:rgba(251,191,36,.25)!important; }
      body.is-admin .az-admin-back { display:flex!important; }

      .sidebar, #sidebar { background:var(--az-navy)!important; border-right:1px solid rgba(255,255,255,.07)!important; }
      .sb-item { color:rgba(255,255,255,.65)!important; font-size:.86rem!important; }
      .sb-item:hover { background:rgba(255,255,255,.06)!important; color:#fff!important; }
      .sb-item.active { background:rgba(37,99,235,.3)!important; color:#fff!important; font-weight:600!important; }
      .sb-bottom { display:none!important; }

      .admin-only { display:none!important; }
      body.is-admin .admin-only { display:flex!important; }
      .sb-item[data-page="admin-users"],
      .sb-item[data-page="admin-activity"],
      .sb-item[data-page="admin-ranking"] { display:none!important; }
      #page-admin-users, #page-admin-activity, #page-admin-ranking { display:none!important; }

      .card { background:var(--az-surface)!important; border:1px solid var(--az-border)!important;
        border-radius:var(--az-radius)!important; padding:16px!important; box-shadow:var(--az-shadow)!important; }
      .card-title, .ctitle { font-size:.75rem!important; font-weight:700!important;
        text-transform:uppercase!important; letter-spacing:.06em!important; color:var(--az-text2)!important; margin-bottom:12px!important; }
      .g2 { display:grid!important; grid-template-columns:1fr 1fr!important; gap:16px!important; }
      @media (max-width:700px) { .g2 { grid-template-columns:1fr!important; } }
      .content { padding:20px!important; background:var(--az-bg)!important; }
      .page { padding:0!important; }
    `;
    document.head.appendChild(style);

    document.addEventListener('DOMContentLoaded', function () {
      var acts = document.querySelector('.topbar-right');
      if (acts) {
        var backBtn = document.createElement('a');
        backBtn.className = 'az-admin-back';
        backBtn.href = '/';
        backBtn.textContent = '← Dashboard';
        acts.insertBefore(backBtn, acts.firstChild);

        var div = document.createElement('div');
        div.className = 'az-lang-toggle';
        div.innerHTML =
          '<button class="az-lb active" id="az-lb-en" onclick="window._azLang(\'en\')">EN</button>' +
          '<button class="az-lb" id="az-lb-es" onclick="window._azLang(\'es\')">ES</button>';
        acts.appendChild(div);

        window._azLang = function (lang) {
          document.getElementById('az-lb-en') && document.getElementById('az-lb-en').classList.toggle('active', lang === 'en');
          document.getElementById('az-lb-es') && document.getElementById('az-lb-es').classList.toggle('active', lang === 'es');
          if (window.toggleLang && window.LANG !== lang) window.toggleLang();
        };

        var darkBtn = document.createElement('button');
        darkBtn.className = 'az-topbar-dark';
        darkBtn.title = 'Dark mode / Modo noche';
        darkBtn.textContent = '🌙';
        darkBtn.onclick = function () { if (typeof window.toggleDark === 'function') window.toggleDark(); };
        acts.appendChild(darkBtn);

        var soBtn = document.createElement('button');
        soBtn.className = 'az-topbar-signout';
        soBtn.textContent = 'Cerrar Sesión';
        soBtn.onclick = function () { if (window.doSignOut) window.doSignOut(); };
        acts.appendChild(soBtn);
      }

      // Remove emojis from sidebar items
      document.querySelectorAll('.sb-item').forEach(function (item) {
        item.querySelectorAll('svg, .sb-ico, .sb-icon, img').forEach(function (el) { el.remove(); });
        item.childNodes.forEach(function (node) {
          if (node.nodeType === 3) node.textContent = node.textContent.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2700}-\u{27BF}]|️/gu, '').trim();
        });
      });
      document.querySelectorAll('h1,h2,h3,.card-title,.ctitle,.hero-btn').forEach(function (el) {
        el.childNodes.forEach(function (node) {
          if (node.nodeType === 3) node.textContent = node.textContent.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]|️/gu, '').trim();
        });
      });
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
      .az-pdf-header { display:flex; align-items:center; gap:12px; padding:12px 16px; background:#0F172A; color:#fff; flex-shrink:0; }
      .az-pdf-title { font-weight:600; font-size:.9rem; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .az-pdf-dl { background:#2563EB; color:#fff!important; padding:6px 14px; border-radius:8px; font-size:.8rem; font-weight:600; text-decoration:none; white-space:nowrap; }
      .az-pdf-dl:hover { background:#1d4ed8; }
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
          <a class="az-pdf-dl" id="az-pdf-dl" target="_blank" download>&#8659; Descargar</a>
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

    var _origDlFromUrl = window.dlFromUrl;
    window.dlFromUrl = function (url, fname) {
      if (url && url.startsWith('https://')) {
        window.showPdfPreview(url, fname);
      } else if (_origDlFromUrl) {
        _origDlFromUrl(url, fname);
      }
    };
  })();

  // Patch window.dl() to show preview
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

  // ── Preview + Download buttons ──
  function _azResolveUrl(key, cb) {
    var el = document.getElementById('pdf_' + key);
    if (!el) { cb(null); return; }
    var content = el.textContent.trim();
    if (content.startsWith('http')) { cb(content); return; }
    try {
      var bin = atob(content), arr = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      cb(URL.createObjectURL(new Blob([arr], { type: 'application/pdf' })));
    } catch(e) { cb(null); }
  }
  window._azPreview = function(name, key) {
    _azResolveUrl(key, function(url) {
      if (url && window.showPdfPreview) window.showPdfPreview(url, name);
      else alert('Preview unavailable');
    });
  };
  window._azDownload = function(name, key, fname) {
    _azResolveUrl(key, function(url) {
      if (!url) { alert('Download unavailable'); return; }
      var trigger = function(blobUrl) {
        var a = document.createElement('a');
        a.href = blobUrl; a.download = (fname || name) + '.pdf';
        document.body.appendChild(a); a.click();
        setTimeout(function() { if (a.parentNode) a.parentNode.removeChild(a); }, 200);
        if (window.trackDownload) window.trackDownload(name);
      };
      if (url.startsWith('blob:')) { trigger(url); return; }
      fetch(url).then(function(r) { return r.blob(); })
        .then(function(b) { var u = URL.createObjectURL(b); trigger(u); setTimeout(function() { URL.revokeObjectURL(u); }, 500); })
        .catch(function() { window.open(url, '_blank'); if (window.trackDownload) window.trackDownload(name); });
    });
  };
  function _azMakeButtons(name, key, fname) {
    var wrap = document.createElement('div'); wrap.className = 'az-fb';
    var prev = document.createElement('button'); prev.className = 'az-fb-prev'; prev.textContent = '👁 Preview';
    var dl   = document.createElement('button'); dl.className   = 'az-fb-dl';   dl.textContent   = '⬇ Download';
    prev.addEventListener('click', function(e) { e.stopPropagation(); window._azPreview(name, key); });
    dl.addEventListener('click',   function(e) { e.stopPropagation(); window._azDownload(name, key, fname); });
    wrap.appendChild(prev); wrap.appendChild(dl); return wrap;
  }
  function _azInjectFileButtons() {
    if (!document.getElementById('az-fb-css')) {
      var s = document.createElement('style'); s.id = 'az-fb-css';
      s.textContent = '.az-fb{display:flex;gap:6px;width:100%;margin-top:8px}' +
        '.az-fb-prev,.az-fb-dl{flex:1;padding:7px 6px;border:none;border-radius:8px;font-size:.76rem;font-weight:700;cursor:pointer;font-family:inherit;transition:background .15s;white-space:nowrap;text-align:center}' +
        '.az-fb-prev{background:#1e40af;color:#fff}.az-fb-prev:hover{background:#1d4ed8}' +
        '.az-fb-dl{background:#059669;color:#fff}.az-fb-dl:hover{background:#047857}' +
        '.fcard[data-azp]{cursor:default!important}.pdf-card[data-azp]{cursor:default!important}';
      document.head.appendChild(s);
    }
    var dlPat = /dl\('([^']+)',\s*'([^']+)',\s*'([^']*)'\)/;
    function patchEl(card, btnSel) {
      if (card.hasAttribute('data-azp')) return;
      var oc = card.getAttribute('onclick') || '';
      var m = oc.match(dlPat);
      if (!m && btnSel) { var b = card.querySelector(btnSel); if (b) m = (b.getAttribute('onclick') || '').match(dlPat); }
      if (!m) return;
      card.setAttribute('data-azp', '1'); card.removeAttribute('onclick');
      var btns = _azMakeButtons(m[1], m[2], m[3]);
      var old = card.querySelector((btnSel || '') + ',.az-fb');
      if (old) old.replaceWith(btns); else card.appendChild(btns);
    }
    document.querySelectorAll('.fcard').forEach(function(c) { patchEl(c, '.fbtn'); });
    document.querySelectorAll('.pdf-card').forEach(function(c) { patchEl(c, '.pdf-dl'); });
    document.querySelectorAll('[onclick]').forEach(function(el) {
      if (el.hasAttribute('data-azp') || el.classList.contains('fcard') || el.classList.contains('pdf-card')) return;
      var m = (el.getAttribute('onclick') || '').match(dlPat);
      if (!m) return;
      el.setAttribute('data-azp', '1'); el.removeAttribute('onclick');
      var btns = _azMakeButtons(m[1], m[2], m[3]);
      el.parentNode.replaceChild(btns, el);
    });
  }

  function whenReady(fn) {
    if (window.AZ && window.AZ.Auth) { fn(); return; }
    var t = setInterval(function () { if (window.AZ && window.AZ.Auth) { clearInterval(t); fn(); } }, 50);
  }

  // ── OVERRIDE SIGN IN ──
  window.doSignIn = async function () {
    var emailEl = document.getElementById('li-email') || document.querySelector('[id*="email"]');
    var passEl  = document.getElementById('li-pass')  || document.querySelector('[id*="pass"]');
    var errEl   = document.getElementById('li-err-pass') || document.getElementById('li-error');
    if (!emailEl || !passEl) return;
    var email = emailEl.value.trim();
    var pass  = passEl.value;
    if (!email || !pass) { if (errEl) errEl.textContent = 'Required'; return; }
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
    await AZ.Activity.log(MODULE_ID, 'logout');
    await AZ.Auth.signOut();
    window.CUR_USER = null; window.ST = {};
    document.body.classList.remove('is-admin');
    var app = document.getElementById('app');
    if (app) { app.style.display = 'none'; app.classList.remove('visible'); }
    var ls = document.getElementById('login-screen');
    if (ls) ls.style.display = 'flex';
  };
  window.logout = window.doLogout = window.doSignOut;

  // ── OVERRIDE REGISTRATION ──
  window.doRegister = async function () {
    var nameEl  = document.getElementById('re-name')  || document.getElementById('reg-name')  || document.getElementById('li-name');
    var emailEl = document.getElementById('re-email') || document.getElementById('reg-email') || document.getElementById('li-email2');
    var passEl  = document.getElementById('re-pass')  || document.getElementById('reg-pass')  || document.getElementById('li-pass2');
    var errEl   = document.getElementById('re-error') || document.getElementById('reg-error');
    if (!emailEl || !passEl) return;
    var name  = nameEl  ? nameEl.value.trim()  : '';
    var email = emailEl.value.trim();
    var pass  = passEl.value;
    try {
      await AZ.Auth.signUp(email, pass, name);
      var okEl = document.getElementById('re-success') || document.getElementById('reg-success');
      if (okEl) {
        okEl.textContent = window.LANG === 'es' ? '¡Cuenta creada! Revisa tu correo.' : 'Account created! Check your email.';
        okEl.style.display = 'block';
      }
    } catch (err) {
      var msg = err.message && err.message.includes('already') ?
        (window.LANG === 'es' ? 'Correo ya registrado.' : 'Email already registered.') : err.message;
      if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
    }
  };

  // ── OVERRIDE PASSWORD RESET ──
  window.doForgot = async function () {
    var emailEl = document.getElementById('fp-email') || document.getElementById('forgot-email') || document.getElementById('reset-email');
    if (!emailEl) return;
    try {
      await AZ.Auth.sendPasswordReset(emailEl.value.trim());
      var msgEl = document.getElementById('fp-msg') || document.getElementById('forgot-msg');
      if (msgEl) { msgEl.textContent = window.LANG === 'es' ? 'Enlace enviado. Revisa tu correo.' : 'Reset link sent. Check your email.'; msgEl.style.display = 'block'; }
    } catch (e) { console.error('[GTL Patch] Forgot error:', e.message); }
  };
  window.sendResetCode   = window.doForgot;
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
    } catch (e) { console.warn('[GTL Patch] qzFinish error:', e.message); }
  };

  // ── SUPPRESS ADMIN SEED ──
  window.initAdminUser = function () {};
  window.getUsers      = function () { return []; };
  window.saveUsers     = function () {};
  window.seedAdminUser = function () {};

  // ── BLOCK MODULE-LEVEL LOGIN/REGISTER UI ──
  var _blockLogin = function () { window.location.replace('/'); };
  window.showLogin = window.showRegister = window.showAuth = window.showForgot = _blockLogin;
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

    _updateStats(profile.xp || 0, 0);
    AZ.Downloads.getForUser(profile.id, MODULE_ID).then(function (dl) {
      _updateStats(profile.xp || 0, dl.length);
    }).catch(function () {});
  }

  function _updateStats(xp, downloads) {
    var dEl = document.getElementById('h-dls');
    var xEl = document.getElementById('h-xp');
    if (dEl) dEl.textContent = downloads;
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

  var _origToggleLang = window.toggleLang;
  window.toggleLang = async function () {
    if (_origToggleLang) _origToggleLang.call(this);
    var session = await AZ.Auth.getSession();
    if (!session) return;
    await AZ.Prefs.save(session.user.id, { lang: window.LANG || 'en' });
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
    s.onerror = function () { console.warn('[GTL Patch] az-widgets.js could not load'); };
    document.head.appendChild(s);
  }

  var _ONBOARD_STEPS = [
    { icon: '🛡️', title: 'Bienvenido a Guarantee Trust Life',
      body: 'Bienvenido al portal de entrenamiento de GTL. Aquí encontrarás módulos de capacitación sobre seguros de vida y suplementarios, formularios y recursos de ventas.' },
    { icon: '📚', title: 'Módulos de Entrenamiento',
      body: 'Explora los módulos en el menú lateral: Medicare Supplement, Cancer Coverage y más. Completa las evaluaciones al final de cada módulo para ganar XP.' },
    { icon: '📄', title: 'Descargas y Formularios',
      body: 'En Descargas encontrarás formularios de aplicación, brochures y guías de campo. Usa el botón azul "Vista Previa" para revisar o el verde "Descargar" para guardar.' },
    { icon: '📊', title: 'Tu Progreso',
      body: 'Tu progreso se guarda automáticamente. Cada quiz completado suma XP a tu perfil. Mira tu nivel y logros en la barra superior o en tu perfil de usuario.' },
    { icon: '💬', title: '¿Necesitas Ayuda?',
      body: 'El chat de soporte en la esquina inferior derecha responde preguntas rápidas sobre dónde encontrar formularios, cómo descargar archivos y mucho más.' }
  ];

  var _CHAT_FAQS = [
    { label: '📋 Formularios',
      keywords: ['formulario', 'form', 'solicitud', 'aplicacion', 'aplicación', 'documentos'],
      answer: 'Los formularios están en la sección "Descargas" del menú lateral. Localiza el documento y haz clic en el botón azul "Vista Previa" para revisarlo, o el verde "Descargar" para guardarlo.' },
    { label: '📥 Descargar PDF',
      keywords: ['descargar', 'download', 'pdf', 'archivo', 'guardar', 'bajar'],
      answer: 'Para descargar un PDF: ve a la sección Descargas, encuentra el archivo y haz clic en "Descargar" (botón verde). Para solo visualizarlo, usa "Vista Previa" (botón azul).' },
    { label: '📚 Módulos',
      keywords: ['modulo', 'módulo', 'curso', 'entrenamiento', 'training', 'capacitacion', 'lección', 'leccion'],
      answer: 'Los módulos están en el menú lateral. Selecciona el que deseas, revisa el material y completa el quiz al final para registrar tu progreso y ganar XP.' },
    { label: '🏆 Mi XP / Nivel',
      keywords: ['xp', 'nivel', 'puntos', 'progreso', 'avance', 'certificado', 'logro'],
      answer: 'Tu XP y nivel se actualizan al completar quizzes. Puedes verlos en tu perfil (ícono de usuario arriba a la derecha) o en la barra superior del dashboard.' },
    { label: '❓ Quiz / Evaluación',
      keywords: ['quiz', 'evaluacion', 'evaluación', 'examen', 'prueba', 'test', 'preguntas'],
      answer: 'Las evaluaciones aparecen al finalizar cada módulo. Selecciona tus respuestas y envía el formulario. Tu resultado se guarda automáticamente y suma XP a tu perfil.' },
    { label: '🔐 Acceso / Contraseña',
      keywords: ['contraseña', 'clave', 'password', 'acceso', 'sesion', 'sesión', 'login'],
      answer: 'Si tienes problemas para iniciar sesión, ve a la página principal y usa "¿Olvidaste tu contraseña?". Para problemas de acceso escribe a it@egconnects.com.' },
    { label: '📞 Soporte Técnico',
      keywords: ['soporte', 'ayuda', 'contacto', 'correo', 'email', 'problema', 'error'],
      answer: 'Para soporte técnico escribe a it@egconnects.com. Para preguntas sobre comisiones o contratos contacta a tu supervisor o manager de campo.' },
    { label: '📦 Productos GTL',
      keywords: ['producto', 'poliza', 'póliza', 'seguro', 'medicare', 'supplement', 'cancer', 'cobertura'],
      answer: 'La información sobre productos GTL (Medicare Supplement, Cancer Coverage, etc.) está en los módulos de entrenamiento y en la sección de Descargas (folletos y guías del agente).' }
  ];

  // ── AUTO-LOGIN ──
  whenReady(async function () {
    _patchDl();
    _azInjectFileButtons();
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
      if (profile.theme === 'dark' && _origToggleDark && !document.body.classList.contains('dark')) {
        _origToggleDark();
      }
      if (profile.lang && profile.lang !== 'en' && window._azLang) {
        window._azLang(profile.lang);
      }
      _withWidgets(function () {
        window.AZWidgets.initChat(_CHAT_FAQS);
        setTimeout(function () { window.AZWidgets.initOnboarding(_ONBOARD_STEPS); }, 700);
      });
      await AZ.Activity.log(MODULE_ID, 'login');
    } catch (e) { console.warn('[GTL Patch] auto-login error:', e.message); }
  });

  console.log('[Academia Ensurity] GTL patch loaded ✓');
})();
