/**
 * corebr-patch.js — Supabase migration patch for COREBR_1.html (Corebridge Financial)
 */

(function () {
  'use strict';

  const MODULE_ID = 'corebr';

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
      body.dark button:not([class*="az-"]):not(.sb-item):not(.et-tab):not(.st-tab) {
        background:#1E293B!important; color:#E2E8F0!important; border-color:rgba(255,255,255,.12)!important;
      }
      body.dark button:not([class*="az-"]):not(.sb-item):not(.et-tab):not(.st-tab):hover { background:#2D3B55!important; }
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
      #sb-level,.sb-user-level { display:none!important; }

      .topbar { background:var(--az-navy)!important; border-bottom:1px solid rgba(255,255,255,.07)!important;
        box-shadow:0 1px 8px rgba(0,0,0,.25)!important; height:54px!important; padding:0 16px!important;
        display:flex!important; align-items:center!important; justify-content:space-between!important; }
      .topbar-logo { font-weight:700!important; font-size:.88rem!important; color:#fff!important; }
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
      .az-admin-back { background:rgba(251,191,36,.15)!important; border:1px solid rgba(251,191,36,.4)!important; color:#fbbf24!important; padding:4px 12px!important; border-radius:6px!important; font-size:.75rem!important; font-weight:700!important; cursor:pointer!important; text-decoration:none!important; display:flex!important; align-items:center!important; white-space:nowrap!important; }
      .az-admin-back:hover { background:rgba(251,191,36,.25)!important; }

      .sidebar, #sidebar { background:var(--az-navy)!important; border-right:1px solid rgba(255,255,255,.07)!important; }
      .sb-brand img { filter:brightness(0) invert(1)!important; opacity:.88!important; }
      .sb-brand .sb-main, .sb-brand .sb-logo-text .sb-main { color:#fff!important; }
      .sb-brand .sb-sub, .sb-brand .sb-logo-text .sb-sub { color:rgba(255,255,255,.5)!important; }
      .sb-user-row { display:none!important; }
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

      /* ── Active sub-tab (et-tab/st-tab) — dark mode contrast ──
         The generic "body.dark button:not([class*='az-'])" rule above would otherwise
         paint every tab (active or not) with the same flat color, hiding which is selected. */
      body.dark .et-tab.active, body.dark .st-tab.active {
        background: linear-gradient(135deg,#0033A0,#0057B8) !important;
        color: #fff !important;
        box-shadow: 0 4px 14px rgba(0,51,160,.4) !important;
      }
    `;
    document.head.appendChild(style);

    document.addEventListener('DOMContentLoaded', function () {
      var acts = document.querySelector('.topbar-right');
      if (acts) {
        var backBtn = document.createElement('a');
        backBtn.className = 'az-admin-back';
        backBtn.href = '/';
        backBtn.innerHTML = '<span class="en">← Dashboard</span><span class="es">← Inicio</span>';
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
        soBtn.innerHTML = '<span class="en">Sign Out</span><span class="es">Cerrar Sesión</span>';
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

    var _origDlFromUrl = window.dlFromUrl;
    window.dlFromUrl = function (url, fname) {
      if (url && url.startsWith('https://')) {
        window.showPdfPreview(url, fname);
      } else if (_origDlFromUrl) {
        _origDlFromUrl(url, fname);
      }
    };
  })();

  // ── Video Modal (inline playback, no new tab) ──
  (function injectVideoModal() {
    const s = document.createElement('style');
    s.textContent = `
      #az-vid-modal { display:none; position:fixed; inset:0; z-index:10001; align-items:center; justify-content:center; }
      #az-vid-modal.active { display:flex; }
      .az-vid-backdrop { position:absolute; inset:0; background:rgba(0,0,0,.82); backdrop-filter:blur(4px); cursor:pointer; }
      .az-vid-panel { position:relative; width:min(94vw,960px); background:#000; border-radius:14px; overflow:hidden; box-shadow:0 25px 60px rgba(0,0,0,.5); z-index:1; }
      .az-vid-header { display:flex; align-items:center; gap:12px; padding:10px 16px; background:#0F172A; color:#fff; }
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

    // Override openVideo(url, title) — COREBR_1.html's native version does window.open(url,'_blank')
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
    try { await AZ.Activity.log(MODULE_ID, 'logout'); } catch(e) {}
    await AZ.Auth.signOut();
    window.location.replace('/');
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
    } catch (e) { console.error('[Corebr Patch] Forgot error:', e.message); }
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
    } catch (e) { console.warn('[Corebr Patch] qzFinish error:', e.message); }
  };

  // ── SUPPRESS ADMIN SEED ──
  window.initAdminUser = function () {};
  window.getUsers      = function () { return []; };
  window.saveUsers     = function () {};
  window.seedAdminUser = function () {};

  // ── BLOCK MODULE-LEVEL LOGIN/REGISTER UI — auth is handled by academia-ensurity.html ──
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
    var mEl = document.getElementById('h-mods');
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
    var lang = window.LANG || 'en';
    if (window.AZWidgets && window.AZWidgets.updateChatLang) {
      var _faqs = (lang === 'en') ? _CHAT_FAQS_EN : _CHAT_FAQS;
      window.AZWidgets.updateChatLang(lang, _faqs);
    }
    if (window.AZWidgets && window.AZWidgets.updateOnboardingLang) {
      var _steps = (lang === 'en') ? _ONBOARD_STEPS_EN : _ONBOARD_STEPS;
      window.AZWidgets.updateOnboardingLang(lang, _steps);
    }
    // Quiz question/options are plain rendered text (not .en/.es spans) —
    // re-render so an open quiz reflects the new language immediately.
    if (window.renderQuestion && document.getElementById('quiz-container')) {
      window.renderQuestion();
    }
    var session = await AZ.Auth.getSession();
    if (!session) return;
    await AZ.Prefs.save(session.user.id, { lang: lang });
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
    s.onerror = function () { console.warn('[Corebr Patch] az-widgets.js could not load'); };
    document.head.appendChild(s);
  }

  var _ONBOARD_STEPS_EN = [
    { icon: '💼', title: 'Welcome to Corebridge Financial',
      body: 'Welcome to the Corebridge Financial Agent Training Portal. Here you will find training modules, product resources, and sales tools for annuities and life insurance.' },
    { icon: '📚', title: 'Training Modules',
      body: 'Explore the training modules in the sidebar menu. Complete each module and its assessment to earn XP and advance your level.' },
    { icon: '📄', title: 'Downloads & Forms',
      body: 'In the Downloads section you will find application forms, product brochures, and agent guides. Use "Preview" to view or "Download" to save.' },
    { icon: '📊', title: 'Your Progress',
      body: 'Your XP and level update automatically when you complete quizzes. View your stats and achievements in the top navigation bar.' },
    { icon: '❓', title: 'Questions?',
      body: 'Use the support chat in the bottom right corner for questions about training modules, downloads, or platform navigation.' }
  ];

  var _ONBOARD_STEPS = [
    { icon: '💹', title: 'Bienvenido a Corebridge Financial',
      body: 'Bienvenido al portal de entrenamiento de Corebridge Financial. Aquí encontrarás módulos sobre anualidades, seguros de vida y herramientas de planificación financiera para tus clientes.' },
    { icon: '📚', title: 'Módulos de Entrenamiento',
      body: 'Navega los módulos del menú lateral. Aprende sobre Fixed Annuities, Index Universal Life y productos de acumulación. Completa los quizzes para ganar XP.' },
    { icon: '📄', title: 'Descargas y Formularios',
      body: 'Los formularios de aplicación, ilustraciones y materiales de marketing están en la sección Descargas. Presiona "Vista Previa" para ver o "Descargar" para guardar.' },
    { icon: '📊', title: 'Tu Progreso',
      body: 'Tu XP se actualiza automáticamente al completar evaluaciones. Tu nivel refleja tu dominio de la plataforma. Revísalo en el menú de perfil.' },
    { icon: '💬', title: '¿Tienes Preguntas?',
      body: 'Usa el asistente de chat en la esquina inferior derecha para preguntas rápidas sobre productos, formularios, descargas o cualquier aspecto de la plataforma.' }
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
    { label: '📦 Corebridge Products',
      keywords: ['product', 'policy', 'insurance', 'annuity', 'life', 'coverage'],
      answer: 'Corebridge Financial product information is in the training modules and the Downloads section (agent guides and product brochures).' }
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
    { label: '📦 Productos Corebridge',
      keywords: ['producto', 'poliza', 'póliza', 'anualidad', 'annuity', 'iul', 'universal life', 'cobertura', 'acumulacion'],
      answer: 'La información sobre productos Corebridge (Fixed Annuities, IUL, etc.) está en los módulos de entrenamiento y en la sección de Descargas (ilustraciones y folletos).' }
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
    } catch (e) { console.warn('[Corebr Patch] auto-login error:', e.message); }
  });

  console.log('[Academia Ensurity] Corebridge patch loaded ✓');
})();
