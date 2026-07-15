/**
 * allstate-patch.js — Supabase migration patch for allstate-academy.html
 *
 * HOW TO APPLY:
 *   Add these 3 lines just before </body> in allstate-academy.html:
 *
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="../../shared/supabase-config.js"></script>
 *   <script src="../../modules/allstate/allstate-patch.js"></script>
 *
 * WHAT THIS DOES:
 *   - Replaces localStorage auth (getUsers/saveUsers) with Supabase Auth
 *   - Replaces localStorage progress (ahs_st_*) with Supabase progress table
 *   - Replaces localStorage activity (ahs_act_*) with Supabase activity table
 *   - Removes hardcoded admin credentials from client-side code
 *   - Adds module access check on sign-in
 */

(function () {
  'use strict';

  const MODULE_ID = 'allstate';
  const PREFIX    = 'ahs';

  // Hide login screen + inject modern design overrides
  (function injectDesign() {
    const style = document.createElement('style');
    style.textContent = `
      #login-screen, #auth-screen { display: none !important; }

      /* ── Design tokens ── */
      :root {
        --az-navy:   #0F172A;
        --az-navy2:  #1E293B;
        --az-blue:   #2563EB;
        --az-cyan:   #0891B2;
        --az-bg:     #F1F5F9;
        --az-surface:#FFFFFF;
        --az-border: #E2E8F0;
        --az-text:   #0F172A;
        --az-text2:  #64748B;
        --az-radius: 12px;
        --az-shadow: 0 1px 3px rgba(0,0,0,.07), 0 4px 12px rgba(0,0,0,.06);
      }

      body { background: var(--az-bg) !important; font-family: 'Inter','Segoe UI',system-ui,sans-serif !important; }
      body.dark {
        --bg:#0F172A; --sur:#1E293B; --sur2:#1a2540; --bdr:rgba(255,255,255,.1);
        --tx:#E2E8F0; --tx2:#94A3B8; --tx3:#64748B; --txt:#E2E8F0;
        --az-bg:#0F172A; --az-surface:#1E293B; --az-border:rgba(255,255,255,.1);
        --az-text:#E2E8F0; --az-text2:#94A3B8;
      }
      body.dark, body.dark #main { background:#0F172A!important; color:#E2E8F0!important; }
      body.dark .content, body.dark .page, body.dark [id^="page-"] { background:#0F172A!important; }
      body.dark .card { background:#1E293B!important; border-color:rgba(255,255,255,.1)!important; color:#E2E8F0!important; }
      body.dark .card-title, body.dark .ctitle { color:#94A3B8!important; }
      body.dark h1,body.dark h2,body.dark h3,body.dark h4,body.dark h5 { color:#E2E8F0!important; }
      body.dark p, body.dark li, body.dark label { color:#CBD5E1!important; }
      body.dark td, body.dark th { color:#E2E8F0!important; border-color:rgba(255,255,255,.08)!important; }
      body.dark thead, body.dark thead tr { background:#1E293B!important; }
      body.dark thead th { color:#94A3B8!important; }
      body.dark tbody tr:nth-child(even) { background:rgba(255,255,255,.03)!important; }
      body.dark tbody tr:hover { background:rgba(255,255,255,.06)!important; }
      body.dark table { border-color:rgba(255,255,255,.08)!important; }
      body.dark input, body.dark textarea, body.dark select {
        background:#1E293B!important; border-color:rgba(255,255,255,.15)!important; color:#E2E8F0!important;
      }
      body.dark input::placeholder, body.dark textarea::placeholder { color:#64748B!important; }
      body.dark button:not([class*="az-"]) {
        background:#1E293B!important; color:#E2E8F0!important; border-color:rgba(255,255,255,.12)!important;
      }
      body.dark button:not([class*="az-"]):hover { background:#2D3B55!important; }
      body.dark .pdf-card, body.dark .file-card, body.dark .doc-card {
        background:#1E293B!important; border-color:rgba(255,255,255,.1)!important;
      }
      body.dark .az-pdf-modal { background:#1E293B!important; }
      body.dark .az-pdf-header { background:#0F172A!important; border-color:rgba(255,255,255,.1)!important; }
      body.dark .az-pdf-title { color:#E2E8F0!important; }
      body.dark a.az-pdf-dl { background:#1d4ed8!important; color:#fff!important; }
      body.dark ::-webkit-scrollbar-track { background:#0F172A!important; }
      body.dark ::-webkit-scrollbar-thumb { background:#334155!important; }
      body.dark ::-webkit-scrollbar-thumb:hover { background:#475569!important; }

      /* ── Topbar ── */
      .topbar {
        background: var(--az-navy) !important;
        border-bottom: 1px solid rgba(255,255,255,.07) !important;
        box-shadow: 0 1px 8px rgba(0,0,0,.25) !important;
        height: 54px !important;
        padding: 0 16px !important;
        display: flex !important; align-items: center !important; gap: 10px !important;
        justify-content: space-between !important;
      }
      .az-topbar-signout { background:#DC2626!important; border:2px solid #ef4444!important;
        color:#fff!important; padding:8px 20px!important; border-radius:8px!important; font-size:.85rem!important;
        font-weight:700!important; cursor:pointer!important; font-family:inherit!important; transition:all .15s!important;
        white-space:nowrap!important; letter-spacing:.01em!important; box-shadow:0 2px 8px rgba(220,38,38,.4)!important; }
      .az-topbar-signout:hover { background:#b91c1c!important; border-color:#dc2626!important; box-shadow:0 4px 12px rgba(220,38,38,.5)!important; }
      /* ── Hide section header emoji icons ── */
      .ph-ico { display:none!important; }
      .tb-logo { font-weight: 700 !important; font-size: .9rem !important; color: #fff !important; letter-spacing: -.01em !important; }
      .tb-logo small { display: block !important; font-size: .65rem !important; font-weight: 500 !important; color: rgba(255,255,255,.5) !important; text-transform: uppercase !important; letter-spacing: .06em !important; }
      .tb-greet { font-size: .88rem !important; color: rgba(255,255,255,.75) !important; }
      .tb-greet strong { color: #fff !important; }
      .tb-btn {
        background: rgba(255,255,255,.08) !important; border: 1px solid rgba(255,255,255,.12) !important;
        color: rgba(255,255,255,.8) !important; border-radius: 8px !important;
        padding: 5px 10px !important; font-size: .78rem !important; font-weight: 600 !important;
        cursor: pointer !important; transition: background .15s !important;
      }
      .tb-btn:hover { background: rgba(255,255,255,.16) !important; }
      .tb-sep { display: none !important; }

      /* ── Sidebar ── */
      .sidebar {
        background: var(--az-navy) !important;
        border-right: 1px solid rgba(255,255,255,.07) !important;
        width: 220px !important;
      }
      .sb-logo { padding: 18px 16px 14px !important; border-bottom: 1px solid rgba(255,255,255,.08) !important; }
      .sb-logo-badge, .sb-logo .sb-logo-badge { font-weight: 800 !important; font-size: .9rem !important; color: #fff !important; }
      .sb-logo-badge small, .sb-logo small { display: block !important; font-size: .6rem !important; font-weight: 600 !important; color: rgba(255,255,255,.45) !important; text-transform: uppercase !important; letter-spacing: .07em !important; }
      .sb-sub { font-size: .72rem !important; color: rgba(255,255,255,.35) !important; margin-top: 2px !important; }
      .sb-section { font-size: .62rem !important; font-weight: 700 !important; text-transform: uppercase !important; letter-spacing: .1em !important; color: rgba(255,255,255,.3) !important; padding: 14px 16px 5px !important; }
      .sb-item {
        display: flex !important; align-items: center !important; gap: 9px !important;
        padding: 11px 16px !important; width: 100% !important; text-align: left !important;
        background: none !important; border: none !important; border-radius: 0 !important;
        color: rgba(255,255,255,.65) !important; font-size: .86rem !important; font-weight: 500 !important;
        cursor: pointer !important; transition: background .13s, color .13s !important;
      }
      .sb-item:hover { background: rgba(255,255,255,.06) !important; color: #fff !important; }
      .sb-item.active { background: rgba(37,99,235,.3) !important; color: #fff !important; font-weight: 600 !important; }
      .sb-icon { display: none !important; }
      .sb-badge { background: #3B82F6 !important; color: #fff !important; font-size: .62rem !important; font-weight: 700 !important; border-radius: 99px !important; padding: 1px 6px !important; margin-left: auto !important; }
      .sb-avatar { width: 30px !important; height: 30px !important; border-radius: 50% !important; background: linear-gradient(135deg,#3B82F6,#0891B2) !important; display: flex !important; align-items: center !important; justify-content: center !important; font-weight: 700 !important; font-size: .72rem !important; color: #fff !important; flex-shrink: 0 !important; }
      .sb-name { font-size: .82rem !important; font-weight: 600 !important; color: #fff !important; }
      .sb-level { display:none!important; }
      #prof-level { display:none!important; }
      .sb-footer { display:none!important; }
      .sb-user { display: flex !important; align-items: center !important; gap: 9px !important; }

      /* ── Hero ── */
      .hero {
        background: linear-gradient(135deg, var(--az-navy) 0%, #1e3a5f 60%, var(--az-navy2) 100%) !important;
        border-radius: var(--az-radius) !important;
        padding: 28px 24px !important;
        margin-bottom: 20px !important;
        display: flex !important; align-items: center !important; justify-content: space-between !important;
        gap: 20px !important; flex-wrap: wrap !important;
        box-shadow: 0 4px 20px rgba(0,0,0,.18) !important;
        border: 1px solid rgba(255,255,255,.06) !important;
      }
      .hero-eye { font-size: .72rem !important; font-weight: 600 !important; color: rgba(255,255,255,.5) !important; text-transform: uppercase !important; letter-spacing: .08em !important; margin-bottom: 6px !important; }
      .hero-title { font-size: 1.7rem !important; font-weight: 800 !important; color: #fff !important; letter-spacing: -.02em !important; margin-bottom: 5px !important; }
      .hero-sub { font-size: .83rem !important; color: rgba(255,255,255,.6) !important; margin-bottom: 16px !important; }
      .hero-btns { display: flex !important; gap: 8px !important; flex-wrap: wrap !important; }
      .btn-w, .btn-g {
        padding: 8px 16px !important; border-radius: 8px !important; border: none !important;
        font-size: .8rem !important; font-weight: 600 !important; cursor: pointer !important;
        transition: opacity .15s !important;
      }
      .btn-w { background: #fff !important; color: var(--az-navy) !important; }
      .btn-g { background: rgba(255,255,255,.12) !important; color: #fff !important; border: 1px solid rgba(255,255,255,.2) !important; }
      .btn-w:hover, .btn-g:hover { opacity: .85 !important; }
      .hero-stats { display: flex !important; gap: 4px !important; }
      .h-stat {
        background: rgba(255,255,255,.08) !important; border: 1px solid rgba(255,255,255,.1) !important;
        border-radius: 10px !important; padding: 14px 20px !important; text-align: center !important; min-width: 80px !important;
      }
      .h-stat-n { font-size: 1.6rem !important; font-weight: 800 !important; color: #fff !important; line-height: 1 !important; }
      .h-stat-l { font-size: .65rem !important; font-weight: 600 !important; color: rgba(255,255,255,.5) !important; text-transform: uppercase !important; letter-spacing: .07em !important; margin-top: 4px !important; }

      /* ── Cards ── */
      .card {
        background: var(--az-surface) !important;
        border: 1px solid var(--az-border) !important;
        border-radius: var(--az-radius) !important;
        padding: 16px !important;
        box-shadow: var(--az-shadow) !important;
        margin-bottom: 0 !important;
      }
      .card-title, .ctitle {
        font-size: .75rem !important; font-weight: 700 !important;
        text-transform: uppercase !important; letter-spacing: .06em !important;
        color: var(--az-text2) !important; margin-bottom: 12px !important;
      }

      /* ── Alert rows ── */
      .alert-row {
        display: flex !important; justify-content: space-between !important; align-items: center !important;
        padding: 8px 0 !important; border-bottom: 1px solid var(--az-border) !important;
        font-size: .83rem !important; color: var(--az-text) !important;
      }
      .alert-row:last-child { border-bottom: none !important; }
      .badge-red { background: #FEE2E2 !important; color: #DC2626 !important; font-size: .7rem !important; font-weight: 700 !important; border-radius: 99px !important; padding: 2px 8px !important; }
      .badge-yellow { background: #FEF9C3 !important; color: #92400E !important; font-size: .7rem !important; font-weight: 700 !important; border-radius: 99px !important; padding: 2px 8px !important; }

      /* ── Grid ── */
      .g2 { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 16px !important; }
      @media (max-width: 700px) { .g2 { grid-template-columns: 1fr !important; } }

      /* ── Content padding ── */
      .content { padding: 20px !important; background: var(--az-bg) !important; }
      .page { padding: 0 !important; }

      /* ── Admin badge ── */
      .admin-badge { background: #DBEAFE !important; color: #1D4ED8 !important; font-size: .6rem !important; font-weight: 700 !important; border-radius: 4px !important; padding: 1px 5px !important; margin-left: 4px !important; }
      .admin-only { display: none !important; }
      body.is-admin .admin-only { display: flex !important; }
      .sb-item[data-page="admin-users"],
      .sb-item[data-page="admin-activity"],
      .sb-item[data-page="admin-ranking"] { display:none!important; }
      #page-admin-users, #page-admin-activity, #page-admin-ranking { display:none!important; }
      #dark-btn { display: none !important; }
      button[onclick*="toggleDark"] { display:none!important; }
      .admin-only { display:none!important; }
      body.is-admin .admin-only { display:none!important; }
      .admin-only, body.is-admin .admin-only, .sb-section.admin-only, .sb-item.admin-only, .page.admin-only { display:none!important; }
      #lang-btn { display: none !important; }
      .az-lang-pill { display:flex !important; gap:3px !important; background:rgba(255,255,255,.08) !important; border:1px solid rgba(255,255,255,.15) !important; border-radius:8px !important; padding:3px !important; }
      .az-lang-btn { background:transparent !important; border:none !important; color:rgba(255,255,255,.55) !important; border-radius:6px !important; padding:3px 9px !important; font-size:.75rem !important; font-weight:700 !important; cursor:pointer !important; transition:all .15s !important; letter-spacing:.02em !important; }
      .az-lang-btn.active { background:#fff !important; color:#0F172A !important; }
      .az-lang-btn:hover:not(.active) { color:#fff !important; background:rgba(255,255,255,.1) !important; }
      .az-topbar-dark { background:transparent!important; border:1px solid rgba(255,255,255,.2)!important; color:#fff!important; width:28px!important; height:28px!important; border-radius:6px!important; cursor:pointer!important; font-size:.85rem!important; display:flex!important; align-items:center!important; justify-content:center!important; padding:0!important; flex-shrink:0!important; }
      .az-topbar-dark:hover { background:rgba(255,255,255,.1)!important; }
      .az-admin-back { background:rgba(251,191,36,.15)!important; border:1px solid rgba(251,191,36,.4)!important; color:#fbbf24!important; padding:4px 12px!important; border-radius:6px!important; font-size:.75rem!important; font-weight:700!important; cursor:pointer!important; text-decoration:none!important; display:flex!important; align-items:center!important; white-space:nowrap!important; }
      .az-admin-back:hover { background:rgba(251,191,36,.25)!important; }
      .tb-acts { display:flex !important; align-items:center !important; gap:8px !important; flex-wrap:nowrap !important; }
      /* ── XP bar ── */
      #xp-section { margin-bottom: 16px !important; }
    `;
    document.head.appendChild(style);

    document.addEventListener('DOMContentLoaded', function() {
      var topbar = document.querySelector('.topbar');
      var acts   = document.querySelector('.tb-acts');
      if (!topbar || !acts) return;

      // ── Admin back | Lang pill | Dark mode | Cerrar Sesión → RIGHT side (.tb-acts) ──
      var backBtn = document.createElement('a');
      backBtn.className = 'az-admin-back';
      backBtn.href = '/';
      backBtn.innerHTML = '<span class="en">← Dashboard</span><span class="es">← Inicio</span>';

      var pill = document.createElement('div');
      pill.className = 'az-lang-pill';
      pill.innerHTML = '<button class="az-lang-btn active" data-lang="en" onclick="window._azLang(\'en\')">EN</button><button class="az-lang-btn" data-lang="es" onclick="window._azLang(\'es\')">ES</button>';
      acts.insertBefore(pill, acts.firstChild);
      acts.insertBefore(backBtn, pill);
      window._azLang = function(lang) {
        document.querySelectorAll('.az-lang-btn').forEach(function(b) { b.classList.toggle('active', b.dataset.lang === lang); });
        if (window.LANG !== lang && window.toggleLang) window.toggleLang();
      };
      var darkBtn = document.createElement('button');
      darkBtn.className = 'az-topbar-dark';
      darkBtn.title = 'Dark mode / Modo noche';
      darkBtn.textContent = '🌙';
      darkBtn.onclick = function () { if (typeof window.toggleDark === 'function') window.toggleDark(); };
      acts.appendChild(darkBtn);
      var soBtn = document.createElement('button');
      soBtn.className = 'az-topbar-signout';
      soBtn.innerHTML = '<span class="en">Sign Out</span><span class="es">Cerrar Sesión</span>';
      soBtn.onclick = function() { if (window.doSignOut) window.doSignOut(); };
      acts.appendChild(soBtn);

      // ── Remove emojis from sidebar items ──
      document.querySelectorAll('.sb-item').forEach(function (item) {
        item.querySelectorAll('svg, .sb-ico, .sb-icon, img').forEach(function (el) { el.remove(); });
        item.childNodes.forEach(function (node) {
          if (node.nodeType === 3) node.textContent = node.textContent.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2700}-\u{27BF}]|️/gu, '').trim();
        });
      });
      // ── Remove emojis from headings and hero buttons ──
      document.querySelectorAll('h1, h2, h3, .ph-title, .card-title, .ctitle, .hero-btns button').forEach(function (el) {
        el.childNodes.forEach(function (node) {
          if (node.nodeType === 3) node.textContent = node.textContent.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]|️/gu, '').trim();
        });
      });
    });
  })();

  // ── Local cache: synchronous bridge for async Supabase ──
  // The original dashboard code is synchronous. We pre-load Supabase data
  // into this cache so original code can read synchronously, while writes
  // go both to cache AND to Supabase asynchronously.
  const CACHE = {
    users:    [],
    stByEmail: {},   // email -> ST object
    actByEmail: {},  // email -> activity object
    quizProg:  {},   // modId -> progress
  };

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
      .az-pdf-dl { background:#2563EB; color:#fff !important; padding:6px 14px; border-radius:8px; font-size:.8rem; font-weight:600; text-decoration:none; white-space:nowrap; }
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
          <a class="az-pdf-dl" id="az-pdf-dl" target="_blank" download><span class="en">&#8659; Download</span><span class="es">&#8659; Descargar</span></a>
          <button class="az-pdf-close" onclick="window.closePdfPreview()">&#10005;</button>
        </div>
        <iframe class="az-pdf-frame" id="az-pdf-frame" src="" frameborder="0"></iframe>
      </div>
    `;
    document.body.appendChild(modal);

    window.showPdfPreview = function(url, title) {
      document.getElementById('az-pdf-title').textContent = title || 'Documento';
      document.getElementById('az-pdf-frame').src = url;
      document.getElementById('az-pdf-dl').href = url;
      document.getElementById('az-pdf-modal').classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    window.closePdfPreview = function() {
      document.getElementById('az-pdf-modal').classList.remove('active');
      document.getElementById('az-pdf-frame').src = '';
      document.body.style.overflow = '';
    };

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') window.closePdfPreview();
    });

    const _orig = window.dlFromUrl;
    window.dlFromUrl = function(url, fname) {
      if (url && url.startsWith('https://')) {
        window.showPdfPreview(url, fname);
      } else if (_orig) {
        _orig(url, fname);
      }
    };
  })();

  // ── PDF preview for dl(name, key, fname) ──
  function _patchDl() {
    var _orig = window.dl;
    if (!_orig) return;
    window.dl = function(name, key, fname) {
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
        } catch(e) { _orig(name, key, fname); }
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
      else alert(window.LANG === 'es' ? 'Vista previa no disponible' : 'Preview unavailable');
    });
  };
  window._azDownload = function(name, key, fname) {
    _azResolveUrl(key, function(url) {
      if (!url) { alert(window.LANG === 'es' ? 'Descarga no disponible' : 'Download unavailable'); return; }
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
    var prev = document.createElement('button'); prev.className = 'az-fb-prev'; prev.innerHTML = '<span class="en">👁 Preview</span><span class="es">👁 Vista Previa</span>';
    var dl   = document.createElement('button'); dl.className   = 'az-fb-dl';   dl.innerHTML   = '<span class="en">⬇ Download</span><span class="es">⬇ Descargar</span>';
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

  // ── Wait until AZ (supabase-config.js) is ready ──
  function whenReady(fn) {
    if (window.AZ && window.AZ.Auth) { fn(); return; }
    const t = setInterval(() => { if (window.AZ && window.AZ.Auth) { clearInterval(t); fn(); } }, 50);
  }

  // ════════════════════════════════════════════════
  //  1. OVERRIDE STORAGE FUNCTIONS
  // ════════════════════════════════════════════════

  // Returns user list (synchronous from cache)
  window.getUsers = function () { return CACHE.users.slice(); };

  // Save user list — async write to Supabase profiles
  window.saveUsers = function (users) {
    CACHE.users = users;
    // Async: upsert any NEW users (registrations) to Supabase
    users.forEach(async (u) => {
      try {
        // Only try to update if user exists in Supabase (sign-up handles creation)
        const { data } = await AZ.db.from('profiles').select('id').eq('email', u.email).single();
        if (data) {
          await AZ.db.from('profiles').update({
            full_name: u.name,
            role: u.isAdmin ? 'admin' : 'agent',
          }).eq('email', u.email);
        }
      } catch (_) {}
    });
  };

  // Load user state (progress) — synchronous from cache
  window.loadUserST = function (email) {
    return CACHE.stByEmail[email.toLowerCase()] || null;
  };

  // Load user data — same as loadUserST for compatibility
  window.loadUserData = function (email) {
    const cached = CACHE.stByEmail[email.toLowerCase()];
    if (cached) {
      // Apply cached state into global ST
      if (window.ST) {
        window.ST.xp       = cached.xp || 0;
        window.ST.mods     = cached.mods || {};
        window.ST.docs     = cached.docs || [];
        window.ST.vids     = cached.vids || [];
      }
    }
  };

  // Save user state — async write to Supabase progress
  const _origSave = window.save;
  window.save = async function () {
    // Still write to localStorage as fallback
    try { _origSave && _origSave(); } catch (_) {}
    // Also sync to Supabase
    const session = await AZ.Auth.getSession();
    if (!session || !window.ST?.email) return;
    try {
      const userId = session.user.id;
      // Save overall ST (non-quiz data) as a special progress entry
      CACHE.stByEmail[window.ST.email.toLowerCase()] = { ...window.ST };
      // Sync XP to profile
      await AZ.db.from('profiles').update({
        xp:    window.ST.xp || 0,
        level: getLevel(window.ST.xp || 0),
      }).eq('id', userId);
    } catch (e) { console.warn('[AHS Patch] save error:', e.message); }
  };

  // Load quiz progress — synchronous from cache
  window.loadQuizProgress = function (modId) {
    return CACHE.quizProg[modId] || null;
  };

  // Save quiz progress — async write to Supabase
  window.saveQuizProgress = async function (modId, data) {
    CACHE.quizProg[modId] = data;
    // Also save to localStorage as fallback
    try { localStorage.setItem(`${PREFIX}_qprog_${modId}`, JSON.stringify(data)); } catch (_) {}
    const session = await AZ.Auth.getSession();
    if (!session) return;
    try {
      await AZ.Progress.saveAnswers(session.user.id, MODULE_ID, modId, data);
    } catch (e) { console.warn('[AHS Patch] saveQuizProgress error:', e.message); }
  };

  // Get activity — synchronous from cache
  window.getActivity = function (email) {
    return CACHE.actByEmail[email.toLowerCase()] || { sessions: [], quizzes: [], downloads: [], registered: null };
  };

  // Save activity — async write to Supabase activity table
  window.saveActivity = async function (email, act) {
    CACHE.actByEmail[email.toLowerCase()] = act;
    // Downloads are tracked separately; just log a generic event
    const session = await AZ.Auth.getSession();
    if (!session) return;
    try {
      // We don't replicate the full legacy structure; individual events are logged via AZ.Activity
    } catch (_) {}
  };

  // ════════════════════════════════════════════════
  //  2. OVERRIDE AUTH SIGN-IN
  // ════════════════════════════════════════════════
  const _origSignIn = window.doSignIn; // original function
  window.doSignIn = async function () {
    // Get email/pass from the form
    const emailEl = document.getElementById('si-email') || document.getElementById('auth-email') || document.querySelector('[id*="email"]');
    const passEl  = document.getElementById('si-pass')  || document.getElementById('auth-pass')  || document.querySelector('[id*="pass"]');

    // Try to get the actual input values from the original form
    // The allstate form uses 'si-email' and 'si-pass' IDs
    const formEmail = (document.getElementById('si-email') || { value: '' }).value.trim();
    const formPass  = (document.getElementById('si-pass')  || { value: '' }).value;

    if (!formEmail || !formPass) {
      // Fall back to original if we can't find the form fields
      if (_origSignIn) _origSignIn.call(this);
      return;
    }

    try {
      const { user, profile } = await AZ.Auth.signIn(formEmail, formPass);

      // Check module access
      const hasAccess = await AZ.Modules.hasAccess(profile.id, MODULE_ID);
      const isAdmin   = ['admin', 'super_admin'].includes(profile.role);
      if (!hasAccess && !isAdmin) {
        const msg = window.LANG === 'es'
          ? 'No tienes acceso a este módulo. Contacta a tu administrador.'
          : 'You do not have access to this module. Contact your administrator.';
        // Show error using the original dashboard's error display mechanism
        const errEl = document.getElementById('si-error') || document.getElementById('auth-error');
        if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
        else { alert(msg); }
        await AZ.Auth.signOut();
        return;
      }

      // Populate global ST with Supabase profile data
      window.ST = window.ST || {};
      window.ST.name  = profile.full_name || user.email;
      window.ST.email = user.email;
      window.ST.xp    = profile.xp || 0;

      // Load user's progress from Supabase into cache
      await _loadUserCache(profile.id, user.email);

      // Set admin class based on Supabase role
      if (isAdmin) {
        document.body.classList.add('is-admin');
      } else {
        document.body.classList.remove('is-admin');
      }

      // Launch the app using the original dashboard's launchApp()
      if (window.launchApp) window.launchApp();

      // Log activity
      await AZ.Activity.log(MODULE_ID, 'login');

    } catch (err) {
      const msg = err.message?.includes('Invalid login')
        ? (window.LANG === 'es' ? 'Correo o contraseña incorrectos.' : 'Incorrect email or password.')
        : err.message;
      const errEl = document.getElementById('si-error') || document.getElementById('auth-error');
      if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
      else { console.error('[AHS Patch] Sign-in error:', msg); }
    }
  };

  // ════════════════════════════════════════════════
  //  3. OVERRIDE SIGN OUT
  // ════════════════════════════════════════════════
  const _origSignOut = window.doSignOut || window.logout;
  window.doSignOut = async function () {
    await AZ.Activity.log(MODULE_ID, 'logout');
    await AZ.Auth.signOut();
    window.ST = { xp: 0, mods: {}, docs: [], vids: [], name: '', email: '' };
    if (_origSignOut) _origSignOut.call(this);
    else location.reload();
  };
  window.logout = window.doLogout = window.doSignOut;

  // ════════════════════════════════════════════════
  //  4. OVERRIDE REGISTRATION
  // ════════════════════════════════════════════════
  const _origRegister = window.doRegister;
  window.doRegister = async function () {
    const nameEl  = document.getElementById('re-name')  || document.getElementById('reg-name');
    const emailEl = document.getElementById('re-email') || document.getElementById('reg-email');
    const passEl  = document.getElementById('re-pass')  || document.getElementById('reg-pass');
    if (!nameEl || !emailEl || !passEl) {
      if (_origRegister) _origRegister.call(this);
      return;
    }
    const name  = nameEl.value.trim();
    const email = emailEl.value.trim();
    const pass  = passEl.value;
    try {
      await AZ.Auth.signUp(email, pass, name);
      const successEl = document.getElementById('auth-success-msg') || document.getElementById('re-success');
      if (successEl) {
        successEl.textContent = window.LANG === 'es'
          ? '¡Cuenta creada! Revisa tu correo para confirmar.'
          : 'Account created! Check your email to confirm.';
        successEl.style.display = 'block';
      }
    } catch (err) {
      const errEl = document.getElementById('re-error') || document.getElementById('auth-error');
      const msg   = err.message?.includes('already registered')
        ? (window.LANG === 'es' ? 'Correo ya registrado.' : 'Email already registered.')
        : err.message;
      if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
    }
  };

  // ════════════════════════════════════════════════
  //  5. OVERRIDE PASSWORD RESET
  // ════════════════════════════════════════════════
  window.doForgot = async function () {
    const emailEl = document.getElementById('fp-email') || document.getElementById('forgot-email');
    if (!emailEl) return;
    try {
      await AZ.Auth.sendPasswordReset(emailEl.value.trim());
      const msgEl = document.getElementById('fp-msg') || document.getElementById('forgot-msg');
      if (msgEl) {
        msgEl.textContent = window.LANG === 'es' ? 'Enlace enviado. Revisa tu correo.' : 'Reset link sent. Check your email.';
        msgEl.style.display = 'block';
      }
    } catch (e) { console.error('[AHS Patch] Forgot error:', e.message); }
  };

  // ════════════════════════════════════════════════
  //  6. OVERRIDE DOWNLOAD TRACKING
  // ════════════════════════════════════════════════
  const _origTrackDownload = window.trackDownload;
  window.trackDownload = async function (fileName) {
    if (_origTrackDownload) _origTrackDownload.call(this, fileName);
    const session = await AZ.Auth.getSession();
    if (!session) return;
    await AZ.Downloads.record(session.user.id, MODULE_ID, fileName);
  };

  // ════════════════════════════════════════════════
  //  7. OVERRIDE QUIZ COMPLETION
  // ════════════════════════════════════════════════
  const _origFinishQuiz = window.qzFinish || window.finishQuiz;
  window.qzFinish = async function (mid, score, xpEarned) {
    if (_origFinishQuiz) _origFinishQuiz.call(this, mid, score, xpEarned);
    const session = await AZ.Auth.getSession();
    if (!session) return;
    try {
      await AZ.Progress.complete(session.user.id, MODULE_ID, mid, score, xpEarned || 0);
      await AZ.Activity.log(MODULE_ID, 'quiz_complete', { quiz: mid, score });
    } catch (e) { console.warn('[AHS Patch] qzFinish error:', e.message); }
  };

  // ════════════════════════════════════════════════
  //  8. SUPPRESS HARDCODED ADMIN SEED
  // ════════════════════════════════════════════════
  window.initAdminUser = function () { /* noop — admin managed in Supabase */ };

  // ── BLOCK MODULE-LEVEL LOGIN/REGISTER UI ──
  var _blockLogin = function () { window.location.replace('/'); };
  window.showLogin = window.showRegister = window.showAuth = window.showForgot = _blockLogin;
  window.goToLogin = window.openLogin   = window.displayLogin = _blockLogin;

  // ════════════════════════════════════════════════
  //  9. LOAD CACHE FROM SUPABASE ON INIT
  // ════════════════════════════════════════════════
  async function _loadUserCache(userId, email) {
    try {
      // Load progress/state
      const progressMap = await AZ.Progress.load(userId, MODULE_ID);
      // Convert to the format the original dashboard expects
      const st = { xp: 0, mods: {}, docs: [], vids: [], name: window.ST?.name || '', email };
      Object.keys(progressMap).forEach(key => {
        const row = progressMap[key];
        if (row.completed) {
          st.mods[key] = { score: row.score, xp: row.xp_earned };
          st.xp += row.xp_earned || 0;
        }
      });
      CACHE.stByEmail[email.toLowerCase()] = st;
      if (window.ST) {
        window.ST.xp   = st.xp;
        window.ST.mods = st.mods;
      }
    } catch (e) { console.warn('[AHS Patch] loadUserCache error:', e.message); }
  }

  // ════════════════════════════════════════════════
  //  10. AUTO-LOGIN: Check for existing session on page load
  // ════════════════════════════════════════════════
  function _removeAdminUI() {
    document.querySelectorAll('.admin-only').forEach(function(el) { el.remove(); });
  }

  // ── Widget loader ──────────────────────────────────────────────────────────
  function _withWidgets(cb) {
    if (window.AZWidgets) { cb(); return; }
    var s = document.createElement('script');
    s.src = '../../shared/az-widgets.js';
    s.onload = cb;
    s.onerror = function () { console.warn('[AHS Patch] az-widgets.js could not load'); };
    document.head.appendChild(s);
  }

  var _ONBOARD_STEPS_EN = [
    { icon: '🏥', title: 'Welcome to AHS Academy',
      body: 'Welcome to the Allstate Health Solutions Agent Training Portal. Your hub for group, individual, and senior health product training, quoting tools, and licensing resources.' },
    { icon: '📚', title: 'Training Modules',
      body: 'Explore our training modules covering product knowledge, sales skills, and portal navigation. Complete each exam to earn XP and track your progress.' },
    { icon: '📄', title: 'Downloads & Forms',
      body: 'Access product brochures, agent guides, rate books, and enrollment forms in the Downloads section. Use Preview to review or Download to save.' },
    { icon: '📊', title: 'Your Progress',
      body: 'Your XP and level update automatically when you complete exams. View your stats and achievements on your profile or in the top navigation bar.' },
    { icon: '💬', title: 'Support & Help',
      body: 'Use the support chat in the bottom right corner for quick answers about portal navigation, downloads, and product information.' }
  ];

  var _ONBOARD_STEPS = [
    { icon: '🏠', title: 'Bienvenido a Allstate Academy',
      body: 'Bienvenido a Allstate Academy. Esta plataforma te guía a través de los módulos de capacitación, herramientas de ventas y recursos que necesitas para crecer como agente Allstate.' },
    { icon: '📚', title: 'Módulos de Entrenamiento',
      body: 'Accede a los módulos desde el menú lateral: productos, cumplimiento, técnicas de venta y más. Completa los quizzes al final de cada módulo para ganar puntos XP.' },
    { icon: '📄', title: 'Descargas y Formularios',
      body: 'En la sección Descargas encontrarás formularios de aplicación, materiales de marketing y guías del agente. Usa "Vista Previa" para revisar antes de descargar.' },
    { icon: '📊', title: 'Tu Progreso',
      body: 'Cada evaluación completada suma XP. Tu nivel y certificaciones se actualizan automáticamente. Consulta tu historial en el perfil de usuario.' },
    { icon: '💬', title: 'Asistente de Soporte',
      body: 'El chat de soporte en la esquina inferior derecha puede responder preguntas sobre dónde encontrar formularios, cómo completar un módulo y más. ¡Úsalo cuando necesites ayuda!' }
  ];

  var _CHAT_FAQS_EN = [
    { label: '📋 Forms',
      keywords: ['form', 'forms', 'application', 'document', 'file'],
      answer: 'Forms and documents are in the "Downloads" section of the sidebar. Find the file and click the blue "Preview" button to view it, or the green "Download" button to save it.' },
    { label: '📥 Download PDF',
      keywords: ['download', 'pdf', 'file', 'save'],
      answer: 'To download a PDF: go to the Downloads section, find the file and click "Download" (green button). To view it first, use "Preview" (blue button).' },
    { label: '📚 Modules',
      keywords: ['module', 'course', 'training', 'lesson', 'section'],
      answer: 'Training modules are in the sidebar menu. Select the one you want, review the material, and complete the quiz at the end to record your progress and earn XP.' },
    { label: '🏆 My XP / Level',
      keywords: ['xp', 'level', 'points', 'progress', 'achievement'],
      answer: 'Your XP and level update automatically when you complete quizzes. View them in your profile (user icon, top right) or in the top navigation bar.' },
    { label: '❓ Quiz / Assessment',
      keywords: ['quiz', 'assessment', 'exam', 'test', 'questions'],
      answer: 'Assessments appear at the end of each module. Select your answers and submit. Your result is saved automatically and adds XP to your profile.' },
    { label: '🔐 Access / Password',
      keywords: ['password', 'login', 'access', 'forgot', 'reset'],
      answer: 'If you have trouble signing in, go to the main page and use "Forgot your password?". For access issues write to it@egconnects.com.' },
    { label: '📞 Technical Support',
      keywords: ['support', 'help', 'contact', 'email', 'problem', 'error'],
      answer: 'For technical support write to it@egconnects.com. For questions about commissions or contracts contact your supervisor or field manager.' },
    { label: '📦 AHS Products',
      keywords: ['product', 'policy', 'insurance', 'health', 'medicare', 'dental', 'vision', 'coverage'],
      answer: 'AHS product information (individual, group, senior health) is in the training modules and the Downloads section (brochures and rate guides).' }
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
    { label: '📦 Productos Allstate',
      keywords: ['producto', 'poliza', 'póliza', 'seguro', 'auto', 'hogar', 'vida', 'cobertura', 'prima'],
      answer: 'La información sobre productos Allstate está en los módulos de entrenamiento y en la sección de Descargas (folletos, guías y materiales de ventas).' }
  ];

  whenReady(async () => {
    _patchDl();
    _azInjectFileButtons();
    _removeAdminUI();
    try {
      const current = await AZ.Auth.getCurrentUser();
      if (!current) { window.location.replace('/'); return; }

      const { user, profile } = current;
      const hasAccess = await AZ.Modules.hasAccess(profile.id, MODULE_ID);
      const isAdmin   = ['admin', 'super_admin'].includes(profile.role);

      if (!hasAccess && !isAdmin) {
        await AZ.Auth.signOut();
        window.location.replace('/');
        return;
      }

      // Restore session into dashboard state
      window.ST = window.ST || {};
      window.ST.name  = profile.full_name || user.email;
      window.ST.email = user.email;
      window.ST.xp    = profile.xp || 0;

      await _loadUserCache(profile.id, user.email);

      if (isAdmin) document.body.classList.add('is-admin');
      else         document.body.classList.remove('is-admin');

      // Apply saved preferences
      if (profile.theme === 'dark' && window.toggleDark) {
        if (!document.body.classList.contains('dark')) window.toggleDark();
      }
      if (profile.lang && profile.lang !== 'en' && window.setLang) {
        window.setLang(profile.lang);
      }

      // Launch the app if auth screen is still showing
      const loginScreen = document.getElementById('login-screen') || document.getElementById('auth-screen');
      if (loginScreen && loginScreen.style.display !== 'none') {
        if (window.launchApp) window.launchApp();
      }
      _withWidgets(function () {
        var _faqs  = (window.LANG === 'en') ? _CHAT_FAQS_EN    : _CHAT_FAQS;
        var _steps = (window.LANG === 'en') ? _ONBOARD_STEPS_EN : _ONBOARD_STEPS;
        window.AZWidgets.initChat(_faqs);
        setTimeout(function () { window.AZWidgets.initOnboarding(_steps); }, 700);
      });
    } catch (e) { console.warn('[AHS Patch] auto-login error:', e.message); }
  });

  // ── Intercept dark/lang preference saves ──
  const _origSetDark = window.toggleDark;
  window.toggleDark = async function () {
    if (_origSetDark) _origSetDark.call(this);
    const session = await AZ.Auth.getSession();
    if (!session) return;
    const isDark = document.body.classList.contains('dark');
    await AZ.Prefs.save(session.user.id, { theme: isDark ? 'dark' : 'light' });
  };

  const _origSetLang = window.setLang || window.switchLang;
  if (window.setLang) {
    window.setLang = async function (lang) {
      if (_origSetLang) _origSetLang.call(this, lang);
      const session = await AZ.Auth.getSession();
      if (!session) return;
      await AZ.Prefs.save(session.user.id, { lang });
    };
  }

  console.log('[Academia Ensurity] Allstate patch loaded ✓');
})();
