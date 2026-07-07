/**
 * lb-patch.js — Supabase migration patch for liberty-bankers.html (Liberty Bankers Life)
 */

(function () {
  'use strict';

  const MODULE_ID = 'liberty-bankers';

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

      .topbar { background:var(--az-navy)!important; border-bottom:1px solid rgba(255,255,255,.07)!important;
        box-shadow:0 1px 8px rgba(0,0,0,.25)!important; height:54px!important; padding:0 16px!important;
        display:flex!important; align-items:center!important; justify-content:space-between!important; }
      .topbar-disc { font-weight:700!important; font-size:.88rem!important; color:#fff!important;
        background:none!important; border:none!important; display:flex!important; align-items:center!important; }
      .topbar-disc .td-ico, .topbar-disc .td-txt, .topbar-disc .td-link { display:none!important; }
      .topbar-right { margin-left:auto!important; display:flex!important; align-items:center!important; gap:8px!important; }
      .tb-lang-btn { display:none!important; }
      .tb-dark-btn { display:none!important; }
      .tb-user { display:none!important; }

      .sb-bottom { display:none!important; }

      /* Admin panel pages hidden */
      .sb-item[data-page="admin-users"],
      .sb-item[data-page="admin-activity"],
      .sb-item[data-page="admin-ranking"] { display:none!important; }
      #page-admin-users, #page-admin-activity, #page-admin-ranking { display:none!important; }
      .admin-only { display:none!important; }
      body.is-admin .admin-only { display:flex!important; }

      /* Lang pill */
      .az-lang-toggle { display:flex!important; background:rgba(255,255,255,.08)!important;
        border:1px solid rgba(255,255,255,.15)!important; border-radius:8px!important; padding:3px!important; }
      .az-lb { background:transparent!important; border:none!important; color:rgba(255,255,255,.55)!important;
        border-radius:6px!important; padding:3px 9px!important; font-size:.75rem!important; font-weight:700!important;
        cursor:pointer!important; transition:all .15s!important; letter-spacing:.02em!important; }
      .az-lb.active { background:#fff!important; color:#0F172A!important; }
      .az-lb:hover:not(.active) { color:#fff!important; background:rgba(255,255,255,.1)!important; }

      /* Cerrar Sesión */
      .az-topbar-signout { background:#DC2626!important; border:2px solid #ef4444!important;
        color:#fff!important; padding:8px 20px!important; border-radius:8px!important; font-size:.85rem!important;
        font-weight:700!important; cursor:pointer!important; font-family:inherit!important; transition:all .15s!important;
        white-space:nowrap!important; letter-spacing:.01em!important; box-shadow:0 2px 8px rgba(220,38,38,.4)!important; }
      .az-topbar-signout:hover { background:#b91c1c!important; border-color:#dc2626!important;
        box-shadow:0 4px 12px rgba(220,38,38,.5)!important; }

      /* Sidebar */
      .sidebar, #sidebar { background:var(--az-navy)!important; border-right:1px solid rgba(255,255,255,.07)!important; }
      .sb-item { color:rgba(255,255,255,.65)!important; font-size:.86rem!important; }
      .sb-item:hover { background:rgba(255,255,255,.06)!important; color:#fff!important; }
      .sb-item.active { background:rgba(37,99,235,.3)!important; color:#fff!important; font-weight:600!important; }

      /* Hero: hide hardcoded stat boxes, inject dynamic ones */
      .hero-stat-box { display:none!important; }
      .az-hero-stats { display:flex!important; gap:6px!important; flex-wrap:wrap!important; }
      .az-h-stat { background:rgba(255,255,255,.08)!important; border:1px solid rgba(255,255,255,.1)!important;
        border-radius:10px!important; padding:12px 18px!important; text-align:center!important; min-width:70px!important; }
      .az-h-stat-n { font-size:1.5rem!important; font-weight:800!important; color:#fff!important; line-height:1!important; }
      .az-h-stat-l { font-size:.62rem!important; font-weight:600!important; color:rgba(255,255,255,.5)!important;
        text-transform:uppercase!important; letter-spacing:.07em!important; margin-top:4px!important; }

      body { background:var(--az-bg)!important; font-family:'Inter','Segoe UI',system-ui,sans-serif!important; }
    `;
    document.head.appendChild(style);

    document.addEventListener('DOMContentLoaded', function () {
      var acts = document.querySelector('.topbar-right');
      if (acts) {
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

        var soBtn = document.createElement('button');
        soBtn.className = 'az-topbar-signout';
        soBtn.textContent = 'Cerrar Sesión';
        soBtn.onclick = function () { if (window.doSignOut) window.doSignOut(); };
        acts.appendChild(soBtn);
      }

      // Inject dynamic hero stats to replace hardcoded ones
      var hero = document.querySelector('.home-hero, .hero');
      if (hero && !hero.querySelector('.az-hero-stats')) {
        var statsWrap = document.createElement('div');
        statsWrap.className = 'az-hero-stats';
        statsWrap.innerHTML =
          '<div class="az-h-stat"><div class="az-h-stat-n" id="az-lb-dls">—</div><div class="az-h-stat-l">Docs</div></div>' +
          '<div class="az-h-stat"><div class="az-h-stat-n" id="az-lb-xp">0</div><div class="az-h-stat-l">XP</div></div>';
        hero.appendChild(statsWrap);
      }

      // Strip emojis from hero buttons
      document.querySelectorAll('.hero-btn').forEach(function (btn) {
        btn.childNodes.forEach(function (node) {
          if (node.nodeType === 3) {
            node.textContent = node.textContent.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]|️/gu, '').trim();
          }
        });
      });
    });
  })();

  function whenReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // ── OVERRIDE SIGN IN ──
  window.doSignIn = async function () {
    var emailEl = document.getElementById('li-email');
    var passEl  = document.getElementById('li-pass');
    var errEl   = document.getElementById('li-err-pass');
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
    window.CB_AUTH = { email: '', name: '', isAdmin: false };
    document.body.classList.remove('is-admin');
    var app = document.getElementById('app');
    if (app) { app.style.display = 'none'; app.classList.remove('visible'); }
    var ls = document.getElementById('login-screen');
    if (ls) ls.style.display = 'flex';
  };
  window.logout = window.doLogout = window.doSignOut;

  function _applyUser(user, profile, isAdmin) {
    var name = profile.full_name || user.email;
    window.CB_AUTH = { email: user.email, name: name, isAdmin: isAdmin };

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
    var dEl = document.getElementById('az-lb-dls');
    var xEl = document.getElementById('az-lb-xp');
    if (dEl) dEl.textContent = downloads;
    if (xEl) xEl.textContent = xp;
  }

  window.initAdminUser = function () {};
  window.getUsers      = function () { return []; };
  window.saveUsers     = function () {};
  window.seedAdminUser = function () {};

  // ── AUTO-LOGIN ──
  whenReady(async function () {
    if (typeof AZ === 'undefined') return;
    try {
      var current = await AZ.Auth.getCurrentUser();
      if (!current) { window.location.replace('/'); return; }
      var user    = current.user;
      var profile = current.profile;
      var hasAccess = await AZ.Modules.hasAccess(profile.id, MODULE_ID);
      var isAdmin   = ['admin', 'super_admin'].includes(profile.role);
      if (!hasAccess && !isAdmin) { await AZ.Auth.signOut(); window.location.replace('/'); return; }
      _applyUser(user, profile, isAdmin);
      await AZ.Activity.log(MODULE_ID, 'login');
    } catch (e) { console.warn('[LB Patch] auto-login error:', e.message); }
  });

  console.log('[Academia Ensurity] Liberty Bankers patch loaded ✓');
})();
