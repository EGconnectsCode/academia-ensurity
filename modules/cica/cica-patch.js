/**
 * cica-patch.js — Supabase migration patch for cica-citizens-v2.html
 * Enhanced: inline video, PDF preview, step quiz, tutorial, lang fix, UI cleanup
 */

(function () {
  'use strict';

  const MODULE_ID = 'cica';
  const TOUR_KEY  = 'az_cica_tour_done';

  // ════════════════════════════════════════════════════════════════════════
  //  1. DESIGN OVERRIDES + LANG PILLS
  // ════════════════════════════════════════════════════════════════════════
  (function injectDesign() {
    const style = document.createElement('style');
    style.textContent = `
      #login-screen, #auth-screen, #auth-wrap { display:none!important; }

      :root {
        --az-navy:#0F172A; --az-navy2:#1E293B; --az-blue:#2563EB; --az-cyan:#0891B2;
        --az-bg:#F1F5F9; --az-surface:#FFFFFF; --az-border:#E2E8F0;
        --az-text:#0F172A; --az-text2:#64748B; --az-radius:12px;
        --az-shadow:0 1px 3px rgba(0,0,0,.07),0 4px 12px rgba(0,0,0,.06);
      }
      body { background:var(--az-bg)!important; font-family:'Inter','Segoe UI',system-ui,sans-serif!important; }

      /* ── Topbar ── */
      .topbar { background:var(--az-navy)!important; border-bottom:1px solid rgba(255,255,255,.07)!important;
        box-shadow:0 1px 8px rgba(0,0,0,.25)!important; height:54px!important;
        padding:0 16px!important; display:flex!important; align-items:center!important; gap:10px!important; }
      .topbar-logo { display:none!important; }
      .tb-user  { display:none!important; }
      .tb-dark-btn { display:none!important; }
      .tb-lang-btn  { display:none!important; }
      .tb-sep   { display:none!important; }
      .tb-btn { background:rgba(255,255,255,.08)!important; border:1px solid rgba(255,255,255,.12)!important;
        color:rgba(255,255,255,.8)!important; border-radius:8px!important; padding:5px 10px!important;
        font-size:.78rem!important; font-weight:600!important; cursor:pointer!important; }
      .tb-btn:hover { background:rgba(255,255,255,.16)!important; }

      /* ── Lang pill buttons ── */
      .az-lang-toggle { display:flex; background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.2);
        border-radius:20px; padding:2px; gap:2px; }
      .az-lb { background:none; border:none; cursor:pointer; font-size:.7rem; font-weight:700;
        color:rgba(255,255,255,.6); padding:4px 11px; border-radius:16px; transition:all .15s;
        font-family:inherit; letter-spacing:.05em; }
      .az-lb.active { background:#2563EB; color:#fff; }
      .az-lb:not(.active):hover { color:#fff; }

      /* ── Sidebar ── */
      .sidebar { background:var(--az-navy)!important; border-right:1px solid rgba(255,255,255,.07)!important; width:220px!important; }
      .sb-brand { padding:12px 16px 10px!important; border-bottom:1px solid rgba(255,255,255,.08)!important; }
      .sb-logo-wrap { display:none!important; }
      .sb-avatar-wrap { display:none!important; }
      .sb-user-row { padding:10px 16px!important; }
      .sb-user-name { font-size:.88rem!important; }
      .sb-label { font-size:.62rem!important; font-weight:700!important; text-transform:uppercase!important;
        letter-spacing:.1em!important; color:rgba(255,255,255,.3)!important; padding:14px 16px 5px!important; }
      .sb-label:first-of-type { display:none!important; }
      .sb-item[data-page="home"]   { display:none!important; }
      .sb-item[data-page="portal"] { display:none!important; }
      .sb-item { display:flex!important; align-items:center!important; gap:9px!important;
        padding:9px 16px!important; width:100%!important; text-align:left!important;
        background:none!important; border:none!important; color:rgba(255,255,255,.65)!important;
        font-size:.83rem!important; font-weight:500!important; cursor:pointer!important;
        transition:background .13s,color .13s!important; }
      .sb-item:hover  { background:rgba(255,255,255,.06)!important; color:#fff!important; }
      .sb-item.active { background:rgba(37,99,235,.3)!important; color:#fff!important; font-weight:600!important; }
      .sb-badge { background:#3B82F6!important; color:#fff!important; font-size:.62rem!important;
        font-weight:700!important; border-radius:99px!important; padding:1px 6px!important; margin-left:auto!important; }
      .sb-footer { padding:12px 14px!important; border-top:1px solid rgba(255,255,255,.08)!important; }
      .sb-bottom .sb-item { color:rgba(255,255,255,.5)!important; }
      .sb-bottom .sb-item:hover { color:#fff!important; }
      body.is-admin .admin-only   { display:flex!important; }
      body.is-admin .admin-only.sb-label { display:block!important; }
      .admin-only { display:none!important; }

      /* ── Home page: only hero ── */
      #training-banner   { display:none!important; }
      #banner-show-again { display:none!important; }
      #page-home .home-2col { display:none!important; }
      #page-portal { display:none!important; }

      /* ── Cards / Layout ── */
      .card { background:var(--az-surface)!important; border:1px solid var(--az-border)!important;
        border-radius:var(--az-radius)!important; padding:16px!important; box-shadow:var(--az-shadow)!important; }
      .card-title,.ctitle { font-size:.75rem!important; font-weight:700!important; text-transform:uppercase!important;
        letter-spacing:.06em!important; color:var(--az-text2)!important; margin-bottom:12px!important; }
      .g2 { display:grid!important; grid-template-columns:1fr 1fr!important; gap:16px!important; }
      @media(max-width:700px){.g2{grid-template-columns:1fr!important;}}
      .content { padding:20px!important; background:var(--az-bg)!important; }
      .page { padding:0!important; }
      #dark-btn { display:none!important; }

      /* ── Quiz: step-by-step didactic UI ── */
      #quiz-container { padding:4px; }
      .azq-wrap { max-width:640px; margin:0 auto; }
      .azq-prog-label { font-size:.75rem; color:var(--az-text2); font-weight:600; margin-bottom:5px; }
      .azq-prog-bar { height:5px; background:rgba(37,99,235,.15); border-radius:99px; overflow:hidden; margin-bottom:20px; }
      .azq-prog-fill { height:100%; background:#2563EB; border-radius:99px; transition:width .4s; }
      .azq-q { font-size:1.05rem; font-weight:700; color:var(--az-text); margin:0 0 18px; line-height:1.5; }
      .azq-opts { display:flex; flex-direction:column; gap:10px; margin-bottom:18px; }
      .azq-opt { display:flex; align-items:center; gap:12px; padding:13px 16px;
        border:1.5px solid var(--az-border); border-radius:10px; cursor:pointer;
        transition:all .15s; font-size:.9rem; user-select:none; }
      .azq-opt:hover { border-color:#2563EB; background:#EFF6FF; }
      .azq-opt.sel  { border-color:#2563EB; background:#EFF6FF; }
      .azq-opt.ok   { border-color:#16A34A; background:#F0FDF4; color:#15803D; pointer-events:none; }
      .azq-opt.ko   { border-color:#DC2626; background:#FEF2F2; color:#DC2626; pointer-events:none; }
      .azq-opt.dim  { opacity:.5; pointer-events:none; }
      .azq-dot { width:22px; height:22px; border-radius:50%; border:2px solid var(--az-border);
        flex-shrink:0; display:flex; align-items:center; justify-content:center;
        font-size:.68rem; font-weight:700; transition:all .15s; }
      .azq-opt.sel .azq-dot  { border-color:#2563EB; background:#2563EB; color:#fff; }
      .azq-opt.ok  .azq-dot  { border-color:#16A34A; background:#16A34A; color:#fff; }
      .azq-opt.ko  .azq-dot  { border-color:#DC2626; background:#DC2626; color:#fff; }
      .azq-fb { padding:11px 15px; border-radius:8px; margin-bottom:16px; font-size:.85rem; font-weight:600; }
      .azq-fb.ok { background:#F0FDF4; color:#15803D; border:1px solid #BBF7D0; }
      .azq-fb.ko { background:#FEF2F2; color:#DC2626; border:1px solid #FEE2E2; }
      .azq-actions { display:flex; gap:10px; justify-content:flex-end; }
      .azq-btn { padding:9px 22px; border-radius:8px; border:none; font-size:.85rem;
        font-weight:600; cursor:pointer; transition:opacity .15s; font-family:inherit; }
      .azq-btn-p { background:#2563EB; color:#fff; }
      .azq-btn-p:hover { opacity:.9; }
      .azq-btn-s { background:var(--az-surface); border:1.5px solid var(--az-border); color:var(--az-text2); }
      .azq-result { text-align:center; padding:32px 20px; }
      .azq-score { font-size:3.2rem; font-weight:900; color:#2563EB; line-height:1; }
      .azq-score-lbl { font-size:.9rem; color:var(--az-text2); margin:8px 0 20px; }
      .azq-score-msg { font-size:1rem; font-weight:700; color:var(--az-text); margin-bottom:16px; }

      /* ── Tutorial spotlight ── */
      #az-tour-overlay { display:none; position:fixed; inset:0; z-index:9990; pointer-events:none; }
      #az-tour-overlay.active { display:block; pointer-events:all; }
      #az-tour-bg { display:none; }
      #az-tour-spot { position:fixed; z-index:9993; border-radius:10px; pointer-events:none;
        box-shadow:0 0 0 5px rgba(255,255,255,.6),0 0 0 11px rgba(37,99,235,.25),0 0 0 9999px rgba(0,0,0,.75);
        transition:all .32s cubic-bezier(.4,0,.2,1); }
      #az-tour-card { position:fixed; z-index:9994; background:#fff; border-radius:14px;
        padding:20px 22px; width:290px; box-shadow:0 14px 44px rgba(0,0,0,.28); }
      .azt-step { font-size:.68rem; font-weight:700; color:#2563EB; text-transform:uppercase;
        letter-spacing:.08em; margin-bottom:6px; }
      .azt-icon { font-size:1.7rem; margin-bottom:8px; }
      .azt-title { font-size:1rem; font-weight:800; color:#0F172A; margin-bottom:6px; }
      .azt-desc { font-size:.82rem; color:#64748B; line-height:1.5; margin-bottom:16px; }
      .azt-foot { display:flex; justify-content:space-between; align-items:center; }
      .azt-skip { font-size:.78rem; color:#94A3B8; cursor:pointer; background:none; border:none;
        font-family:inherit; padding:0; }
      .azt-skip:hover { color:#64748B; }
      .azt-next { background:#2563EB; color:#fff; border:none; border-radius:8px;
        padding:7px 18px; font-size:.82rem; font-weight:700; cursor:pointer; font-family:inherit; }
      .azt-dots { display:flex; gap:5px; align-items:center; }
      .azt-dot { width:6px; height:6px; border-radius:50%; background:#E2E8F0; transition:background .2s; }
      .azt-dot.on { background:#2563EB; }

      /* ── Video modal ── */
      #az-vid-modal { display:none; position:fixed; inset:0; z-index:10001;
        align-items:center; justify-content:center; }
      #az-vid-modal.active { display:flex; }
      .az-vid-bd { position:absolute; inset:0; background:rgba(0,0,0,.82); backdrop-filter:blur(4px); cursor:pointer; }
      .az-vid-panel { position:relative; width:min(94vw,960px); background:#000;
        border-radius:14px; overflow:hidden; box-shadow:0 25px 60px rgba(0,0,0,.5); z-index:1; }
      .az-vid-hdr { display:flex; align-items:center; gap:12px; padding:10px 16px; background:#0F172A; color:#fff; }
      .az-vid-title { font-weight:600; font-size:.88rem; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .az-vid-x { background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.2); color:#fff;
        width:30px; height:30px; border-radius:50%; cursor:pointer; font-size:.9rem;
        display:flex; align-items:center; justify-content:center; flex-shrink:0; }
      .az-vid-x:hover { background:rgba(255,255,255,.22); }
      .az-vid-fw { position:relative; padding-bottom:56.25%; height:0; }
      .az-vid-frame { position:absolute; inset:0; width:100%; height:100%; border:none; }
    `;
    document.head.appendChild(style);

    document.addEventListener('DOMContentLoaded', function () {
      // ── Inject EN/ES pill toggle into topbar ──
      var acts = document.querySelector('.topbar-right') || document.querySelector('.tb-acts');
      if (acts) {
        var div = document.createElement('div');
        div.className = 'az-lang-toggle';
        div.innerHTML =
          '<button class="az-lb" id="az-lb-en" onclick="window._azLang(\'en\')">EN</button>' +
          '<button class="az-lb" id="az-lb-es" onclick="window._azLang(\'es\')">ES</button>';
        acts.insertBefore(div, acts.firstChild);
      }
      // Sync active state with current lang
      function syncLangBtns(l) {
        var en = document.getElementById('az-lb-en');
        var es = document.getElementById('az-lb-es');
        if (en) en.classList.toggle('active', l === 'en');
        if (es) es.classList.toggle('active', l === 'es');
      }
      var initLang = document.documentElement.getAttribute('data-lang') || 'en';
      syncLangBtns(initLang);

      window._azLang = function (l) {
        syncLangBtns(l);
        if (window.setLang) window.setLang(l);
      };

      // Patch setLang to also sync buttons on any call
      var _sl = window.setLang;
      window.setLang = function (l) {
        syncLangBtns(l);
        if (_sl) _sl.call(this, l);
      };

      // ── "Ir a mi portal" in hero buttons ──
      document.querySelectorAll('.hero-btn .en, .hero-btn .es').forEach(function (el) {
        if (el.textContent.toLowerCase().includes('agent portal') ||
            el.textContent.toLowerCase().includes('portal del agente') ||
            el.textContent.toLowerCase().includes('agent portal login')) {
          el.textContent = 'Ir a mi portal';
        }
      });
      // Quick links in home sidebar widget
      document.querySelectorAll('.sec-name .en, .sec-name .es').forEach(function (el) {
        if (el.textContent.toLowerCase().includes('agent portal') ||
            el.textContent.toLowerCase().includes('portal del agente')) {
          el.textContent = 'Ir a mi portal';
        }
      });

      // ── Remove "About Citizens Inc." ──
      document.querySelectorAll('.sec-row').forEach(function (row) {
        if (row.textContent.includes('Citizens Inc') ||
            row.textContent.includes('citizensinc')) {
          row.style.display = 'none';
        }
      });

      // ── Intercept video cards → show inline ──
      document.querySelectorAll('.vm-card').forEach(function (card) {
        var orig = card.getAttribute('onclick') || '';
        card.removeAttribute('onclick');
        card.style.cursor = 'pointer';
        card.addEventListener('click', function () {
          var m = orig.match(/vimeo\.com\/(\d+)\/([a-f0-9]+)/i);
          if (m) {
            var embedUrl = 'https://player.vimeo.com/video/' + m[1] +
              '?h=' + m[2] + '&autoplay=1&title=0&byline=0&portrait=0';
            var titleEl = card.querySelector('.vm-title .en') || card.querySelector('.vm-title');
            window.azShowVideo(embedUrl, titleEl ? titleEl.textContent.trim() : 'Video');
          } else if (orig) {
            try { eval(orig); } catch (e) {}
          }
        });
        // Update button label
        card.querySelectorAll('.vm-btn .en').forEach(function (e) { e.textContent = '▶ Ver aquí'; });
        card.querySelectorAll('.vm-btn .es').forEach(function (e) { e.textContent = '▶ Ver aquí'; });
        card.querySelectorAll('.vm-btn').forEach(function (b) {
          if (!b.querySelector('.en') && !b.querySelector('.es')) b.textContent = '▶ Ver aquí';
        });
      });

      // ── Change Download buttons to "Preview" in fcard ──
      document.querySelectorAll('.fbtn').forEach(function (btn) {
        btn.querySelectorAll('.en').forEach(function (e) { e.textContent = '👁 Preview'; });
        btn.querySelectorAll('.es').forEach(function (e) { e.textContent = '👁 Vista previa'; });
        if (!btn.querySelector('.en') && !btn.querySelector('.es')) btn.textContent = '👁 Preview';
      });
    });
  })();

  // ════════════════════════════════════════════════════════════════════════
  //  2. PDF PREVIEW MODAL
  // ════════════════════════════════════════════════════════════════════════
  (function injectPdfPreview() {
    const s = document.createElement('style');
    s.textContent = `
      #az-pdf-modal { display:none; position:fixed; inset:0; z-index:10000; }
      #az-pdf-modal.active { display:flex; align-items:center; justify-content:center; }
      .az-pdf-bd { position:absolute; inset:0; background:rgba(0,0,0,.65); backdrop-filter:blur(3px); cursor:pointer; }
      .az-pdf-panel { position:relative; width:min(92vw,1100px); height:90vh; background:#fff;
        border-radius:14px; overflow:hidden; display:flex; flex-direction:column;
        box-shadow:0 25px 60px rgba(0,0,0,.35); z-index:1; }
      .az-pdf-hdr { display:flex; align-items:center; gap:12px; padding:12px 16px;
        background:#0F172A; color:#fff; flex-shrink:0; }
      .az-pdf-title { font-weight:600; font-size:.9rem; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .az-pdf-dl { background:#2563EB; color:#fff!important; padding:6px 14px; border-radius:8px;
        font-size:.8rem; font-weight:600; text-decoration:none; white-space:nowrap; cursor:pointer;
        border:none; font-family:inherit; }
      .az-pdf-dl:hover { background:#1d4ed8; }
      .az-pdf-x { background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.2); color:#fff;
        width:32px; height:32px; border-radius:50%; cursor:pointer; font-size:1rem;
        display:flex; align-items:center; justify-content:center; flex-shrink:0; }
      .az-pdf-x:hover { background:rgba(255,255,255,.2); }
      .az-pdf-frame { flex:1; width:100%; border:none; }
    `;
    document.head.appendChild(s);

    const modal = document.createElement('div');
    modal.id = 'az-pdf-modal';
    modal.innerHTML = `
      <div class="az-pdf-bd" onclick="window.azClosePdf()"></div>
      <div class="az-pdf-panel">
        <div class="az-pdf-hdr">
          <span class="az-pdf-title" id="az-pdf-title">Documento</span>
          <button class="az-pdf-dl" id="az-pdf-dl-btn" onclick="window.azDownloadPdf()">&#8659; Descargar</button>
          <button class="az-pdf-x" onclick="window.azClosePdf()">&#10005;</button>
        </div>
        <iframe class="az-pdf-frame" id="az-pdf-frame" src="" frameborder="0"></iframe>
      </div>`;
    document.body.appendChild(modal);

    var _pdfUrl = '', _pdfName = '';

    window.showPdfPreview = window.azShowPdf = function (url, title) {
      _pdfUrl = url; _pdfName = title || 'documento';
      document.getElementById('az-pdf-title').textContent = _pdfName;
      document.getElementById('az-pdf-frame').src = url;
      document.getElementById('az-pdf-modal').classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    window.azDownloadPdf = function () {
      var a = document.createElement('a');
      a.href = _pdfUrl;
      a.download = _pdfName + '.pdf';
      a.target = '_blank';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    window.azClosePdf = window.closePdfPreview = function () {
      document.getElementById('az-pdf-modal').classList.remove('active');
      document.getElementById('az-pdf-frame').src = '';
      document.body.style.overflow = '';
      _pdfUrl = ''; _pdfName = '';
    };

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { window.azClosePdf(); window.azCloseVideo && window.azCloseVideo(); }
    });
  })();

  // ════════════════════════════════════════════════════════════════════════
  //  3. VIDEO MODAL
  // ════════════════════════════════════════════════════════════════════════
  (function injectVideoModal() {
    const modal = document.createElement('div');
    modal.id = 'az-vid-modal';
    modal.innerHTML = `
      <div class="az-vid-bd" onclick="window.azCloseVideo()"></div>
      <div class="az-vid-panel">
        <div class="az-vid-hdr">
          <span class="az-vid-title" id="az-vid-title">Video</span>
          <button class="az-vid-x" onclick="window.azCloseVideo()">&#10005;</button>
        </div>
        <div class="az-vid-fw">
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
  })();

  // ════════════════════════════════════════════════════════════════════════
  //  4. TUTORIAL SPOTLIGHT
  // ════════════════════════════════════════════════════════════════════════
  (function injectTutorial() {
    var STEPS = [
      { page:'etraining',    icon:'🎓', en:['e-Training','Watch training videos and take quizzes. Earn up to 50 XP with a perfect score!'],
        es:['e-Training','Mira videos de entrenamiento y realiza quizzes. ¡Gana hasta 50 XP con puntaje perfecto!'] },
      { page:'metrics',      icon:'📊', en:['My Metrics','Track your XP, downloads and training activity over time.'],
        es:['Mis Métricas','Monitorea tu XP, descargas y actividad de entrenamiento.'] },
      { page:'claim',        icon:'📄', en:['Claim Forms','Life claim forms for policyholders and beneficiaries. Preview or download.'],
        es:['Formularios de Reclamo','Formularios de reclamo de vida. Previsualiza o descarga.'] },
      { page:'contracts',    icon:'💳', en:['Contracts & Commissions','Commission schedules, ACH and advance request forms.'],
        es:['Contratos y Comisiones','Tablas de comisiones, formulario ACH y solicitudes de adelanto.'] },
      { page:'guidelines',   icon:'📚', en:['Department Guidelines','Agent guides, FAQs, advertising rules and market conduct.'],
        es:['Guías del Departamento','Guías del agente, FAQ, publicidad y conducta de mercado.'] },
      { page:'helpful',      icon:'🔗', en:['Helpful Links','Portal videos, SS Billing guides, eligibility and HIPAA resources.'],
        es:['Recursos Útiles','Videos del portal, guías SS Billing, elegibilidad e HIPAA.'] },
      { page:'marketing',    icon:'📋', en:['Marketing Forms','Corporate brochures and marketing materials.'],
        es:['Formularios de Marketing','Folletos corporativos y materiales de marketing.'] },
      { page:'policyholder', icon:'👤', en:['Policyholder Services','Reinstatement, change requests and policy service forms.'],
        es:['Servicios al Asegurado','Reinstalación, cambios de póliza y formularios de servicio.'] },
      { page:'states',       icon:'🌎', en:['State Availability','Interactive map showing the 44 states where CICA is licensed.'],
        es:['Disponibilidad Estatal','Mapa interactivo con los 44 estados donde CICA tiene licencia.'] },
    ];

    var curStep = 0, overlay, spot, card;

    function buildDOM() {
      overlay = document.createElement('div'); overlay.id = 'az-tour-overlay';
      document.body.appendChild(overlay);
      spot = document.createElement('div'); spot.id = 'az-tour-spot';
      document.body.appendChild(spot);
      card = document.createElement('div'); card.id = 'az-tour-card';
      document.body.appendChild(card);
    }

    function step(i) {
      var s = STEPS[i];
      if (!s) { end(); return; }
      var lang = (document.documentElement.getAttribute('data-lang') || 'en') === 'es' ? 'es' : 'en';
      var target = document.querySelector('.sb-item[data-page="' + s.page + '"]');
      if (!target) { step(i + 1); return; }
      var r = target.getBoundingClientRect(), pad = 7;
      spot.style.cssText = 'left:' + (r.left - pad) + 'px;top:' + (r.top - pad) + 'px;' +
        'width:' + (r.width + pad * 2) + 'px;height:' + (r.height + pad * 2) + 'px;';
      var n = STEPS.length;
      var dots = STEPS.map(function (_, d) {
        return '<div class="azt-dot' + (d === i ? ' on' : '') + '"></div>';
      }).join('');
      var isLast = i >= n - 1;
      var info = s[lang];
      card.innerHTML =
        '<div class="azt-step">' + (lang === 'es' ? 'Paso ' : 'Step ') + (i + 1) + ' / ' + n + '</div>' +
        '<div class="azt-icon">' + s.icon + '</div>' +
        '<div class="azt-title">' + info[0] + '</div>' +
        '<div class="azt-desc">' + info[1] + '</div>' +
        '<div class="azt-foot">' +
        '<button class="azt-skip" onclick="window.azEndTour()">' +
        (lang === 'es' ? 'Omitir guía' : 'Skip guide') + '</button>' +
        '<div class="azt-dots">' + dots + '</div>' +
        '<button class="azt-next" onclick="window.azTourNext()">' +
        (isLast ? (lang === 'es' ? '¡Listo! ✓' : 'Done! ✓') : (lang === 'es' ? 'Siguiente →' : 'Next →')) +
        '</button></div>';
      // Position card to the right of sidebar
      var cl = r.right + 16;
      var ct = r.top - 10;
      if (cl + 300 > window.innerWidth) cl = r.left - 306;
      if (ct + 220 > window.innerHeight) ct = window.innerHeight - 230;
      card.style.left = Math.max(10, cl) + 'px';
      card.style.top  = Math.max(10, ct) + 'px';
      overlay.classList.add('active');
    }

    function end() {
      if (overlay) overlay.classList.remove('active');
      if (spot) spot.style.cssText = '';
      try { localStorage.setItem(TOUR_KEY, '1'); } catch (e) {}
    }

    window.azTourNext = function () { curStep++; step(curStep); };
    window.azEndTour  = end;
    window.azStartTour = function () {
      if (!overlay) buildDOM();
      curStep = 0;
      step(0);
    };
  })();

  // ════════════════════════════════════════════════════════════════════════
  //  5. OVERRIDE dl() — show PDFs in preview instead of downloading
  // ════════════════════════════════════════════════════════════════════════
  function _patchDl() {
    var _origDl = window.dl;
    window.dl = function (name, key, fname) {
      var el2 = document.getElementById('pdf_' + key);
      if (!el2) { if (_origDl) _origDl(name, key, fname); return; }
      var content = el2.textContent.trim();
      if (content.startsWith('http')) {
        window.showPdfPreview(content, name);
        if (window.trackDownload) window.trackDownload(name);
      } else {
        // base64 — create blob URL for iframe preview
        try {
          var bin = atob(content);
          var arr = new Uint8Array(bin.length);
          for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
          var blob = new Blob([arr], { type: 'application/pdf' });
          var blobUrl = URL.createObjectURL(blob);
          window.showPdfPreview(blobUrl, name);
          if (window.trackDownload) window.trackDownload(name);
        } catch (e) {
          if (_origDl) _origDl(name, key, fname);
        }
      }
    };
  }

  // Also override dlFromUrl for any remaining direct calls
  (function () {
    var _orig = window.dlFromUrl;
    window.dlFromUrl = function (url, fname) {
      if (url && url.startsWith('http')) {
        window.showPdfPreview(url, fname || 'Documento');
      } else if (_orig) {
        _orig(url, fname);
      }
    };
  })();

  // ════════════════════════════════════════════════════════════════════════
  //  6. OVERRIDE updateLevel — remove "Seed " prefix
  // ════════════════════════════════════════════════════════════════════════
  function _patchUpdateLevel() {
    window.updateLevel = function (xp) {
      var el = document.getElementById('sb-level');
      if (!el) return;
      var level = (window.getLevel ? window.getLevel(xp) : 'Novice').replace(/^Seed\s+/i, '');
      el.textContent = level + (xp > 0 ? ' · ' + xp + ' XP' : '');
    };
  }

  // ════════════════════════════════════════════════════════════════════════
  //  7. OVERRIDE renderQuestion — didactic step-by-step quiz UI
  // ════════════════════════════════════════════════════════════════════════
  function _patchRenderQuestion() {
    window.renderQuestion = function () {
      var container = document.getElementById('quiz-container');
      if (!container) return;
      if (!window.QUIZ_DATA || !window.qState) return;
      var mod = window.QUIZ_DATA[window.qState.module];
      if (!mod) return;
      var qs = mod.questions;
      var q  = qs[window.qState.idx];
      var lang = (document.documentElement.getAttribute('data-lang') || 'en') === 'es' ? 'es' : 'en';

      if (!q) {
        // Results screen
        var pct = qs.length > 0 ? Math.round((window.qState.score / qs.length) * 100) : 0;
        var msg = pct === 100
          ? (lang === 'es' ? '¡Perfecto! Ganaste 50 XP 🎉' : 'Perfect score! You earned 50 XP 🎉')
          : pct >= 70
          ? (lang === 'es' ? '¡Buen trabajo! Sigue practicando.' : 'Good job! Keep practicing.')
          : (lang === 'es' ? 'Sigue practicando. ¡Puedes hacerlo mejor!' : 'Keep practicing. You can do better!');
        container.innerHTML =
          '<div class="azq-wrap"><div class="azq-result">' +
          '<div class="azq-score">' + pct + '%</div>' +
          '<div class="azq-score-lbl">' + window.qState.score + ' / ' + qs.length + (lang === 'es' ? ' correctas' : ' correct') + '</div>' +
          '<div class="azq-score-msg">' + msg + '</div>' +
          '<button class="azq-btn azq-btn-p" onclick="window.loadQuiz(\'' + window.qState.module + '\')">' +
          (lang === 'es' ? '↺ Intentar de nuevo' : '↺ Try again') + '</button>' +
          '</div></div>';
        if (window.qzFinish || window.submitQuiz) {
          var fn = window.qzFinish || window.submitQuiz;
          fn(window.qState.module, pct);
        }
        return;
      }

      var total = qs.length;
      var idx   = window.qState.idx;
      var progPct = Math.round((idx / total) * 100);
      var text  = (lang === 'es' && q.text_es) ? q.text_es : q.text;
      var opts  = (lang === 'es' && q.opts_es) ? q.opts_es : q.opts;

      var optsHtml = opts.map(function (opt, i) {
        return '<div class="azq-opt" onclick="window.azAnswerQ(' + i + ')">' +
          '<div class="azq-dot">' + String.fromCharCode(65 + i) + '</div>' +
          '<span>' + opt + '</span></div>';
      }).join('');

      container.innerHTML =
        '<div class="azq-wrap">' +
        '<div class="azq-prog-label">' +
        (lang === 'es' ? 'Pregunta ' : 'Question ') + (idx + 1) + ' ' +
        (lang === 'es' ? 'de ' : 'of ') + total +
        '</div>' +
        '<div class="azq-prog-bar"><div class="azq-prog-fill" style="width:' + progPct + '%"></div></div>' +
        '<div class="azq-q">' + text + '</div>' +
        '<div class="azq-opts">' + optsHtml + '</div>' +
        '</div>';
    };

    window.azAnswerQ = function (i) {
      if (!window.qState || window.qState.answered) return;
      window.qState.answered = true;
      var mod  = window.QUIZ_DATA[window.qState.module];
      var q    = mod.questions[window.qState.idx];
      var lang = (document.documentElement.getAttribute('data-lang') || 'en') === 'es' ? 'es' : 'en';
      var correct = (i === q.ans);
      if (correct) window.qState.score++;

      var opts = document.querySelectorAll('.azq-opt');
      opts.forEach(function (el, idx) {
        if (idx === q.ans) el.classList.add('ok');
        else if (idx === i && !correct) el.classList.add('ko');
        else el.classList.add('dim');
      });

      var fb = document.createElement('div');
      fb.className = 'azq-fb ' + (correct ? 'ok' : 'ko');
      fb.textContent = correct
        ? (lang === 'es' ? '✓ ¡Correcto!' : '✓ Correct!')
        : (lang === 'es' ? '✗ Incorrecto. La respuesta era: ' + (q.opts ? q.opts[q.ans] : '') : '✗ Incorrect. The answer was: ' + (q.opts ? q.opts[q.ans] : ''));

      var wrap = document.querySelector('.azq-wrap');
      if (wrap) {
        wrap.appendChild(fb);
        var actions = document.createElement('div');
        actions.className = 'azq-actions';
        actions.innerHTML = '<button class="azq-btn azq-btn-p" onclick="window.nextQ()">' +
          (window.qState.idx + 1 >= mod.questions.length
            ? (lang === 'es' ? 'Ver resultados →' : 'See results →')
            : (lang === 'es' ? 'Siguiente →' : 'Next →')) +
          '</button>';
        wrap.appendChild(actions);
      }
    };

    // Keep nextQ working
    window.nextQ = function () {
      if (window.qState) { window.qState.idx++; window.qState.answered = false; }
      window.renderQuestion();
    };
  }

  // ════════════════════════════════════════════════════════════════════════
  //  8. STORAGE OVERRIDES
  // ════════════════════════════════════════════════════════════════════════
  const CACHE = { users: [], stByEmail: {}, actByEmail: {} };

  window.getUsers  = function () { return CACHE.users.slice(); };
  window.saveUsers = function (users) {
    CACHE.users = users;
    users.forEach(async function (u) {
      try {
        var { data } = await AZ.db.from('profiles').select('id').eq('email', u.email).single();
        if (data) await AZ.db.from('profiles').update({ full_name: u.name, role: u.isAdmin ? 'admin' : 'agent' }).eq('email', u.email);
      } catch (_) {}
    });
  };
  window.loadST  = function (email) { return CACHE.stByEmail[email.toLowerCase()] || null; };
  window.saveST  = async function (email, st) {
    CACHE.stByEmail[email.toLowerCase()] = st;
    var session = await AZ.Auth.getSession();
    if (!session) return;
    try { await AZ.db.from('profiles').update({ xp: st.xp || 0 }).eq('id', session.user.id); } catch (e) {}
  };
  window.getActivity  = function (email) { return CACHE.actByEmail[email.toLowerCase()] || { sessions: [], downloads: [] }; };
  window.saveActivity = async function (email, act) { CACHE.actByEmail[email.toLowerCase()] = act; };

  // ════════════════════════════════════════════════════════════════════════
  //  9. OVERRIDE SIGN-IN
  // ════════════════════════════════════════════════════════════════════════
  window.doSignIn = async function () {
    if (window.clearErr) { clearErr('li-err-email'); clearErr('li-err-pass'); }
    var emailEl = document.getElementById('li-email');
    var passEl  = document.getElementById('li-pass');
    if (!emailEl || !passEl) return;
    var email = emailEl.value.trim().toLowerCase();
    var pass  = passEl.value;
    if (!email || !pass) return;
    try {
      var { user, profile } = await AZ.Auth.signIn(email, pass);
      var hasAccess = await AZ.Modules.hasAccess(profile.id, MODULE_ID);
      var isAdmin   = ['admin', 'super_admin'].includes(profile.role);
      if (!hasAccess && !isAdmin) {
        var msg = window.LANG === 'es'
          ? 'No tienes acceso a este módulo.' : 'You do not have access to this module.';
        if (window.showMsg) showMsg('li-err-email', msg);
        await AZ.Auth.signOut(); return;
      }
      window.CUR_USER = { name: profile.full_name || user.email, email: user.email, isAdmin: isAdmin };
      await _loadUserCache(profile.id, user.email);
      if (isAdmin) document.body.classList.add('is-admin');
      else         document.body.classList.remove('is-admin');
      if (window.loginUser) window.loginUser(window.CUR_USER);
      await AZ.Activity.log(MODULE_ID, 'login');
    } catch (err) {
      var msg2 = err.message?.includes('Invalid login')
        ? (window.LANG === 'es' ? 'Correo o contraseña incorrectos.' : 'Incorrect email or password.')
        : err.message;
      if (window.showMsg) showMsg('li-err-email', msg2);
    }
  };

  // ════════════════════════════════════════════════════════════════════════
  //  10. OVERRIDE SIGN OUT
  // ════════════════════════════════════════════════════════════════════════
  var _origLogout = window.logout;
  window.logout = window.doLogout = async function () {
    await AZ.Activity.log(MODULE_ID, 'logout');
    await AZ.Auth.signOut();
    window.CUR_USER = null;
    if (_origLogout) _origLogout.call(this);
    else location.reload();
  };

  // ════════════════════════════════════════════════════════════════════════
  //  11. OVERRIDE DOWNLOAD TRACKING
  // ════════════════════════════════════════════════════════════════════════
  window.trackDownload = async function (name) {
    if (window.CUR_USER) {
      var st = window.loadST(window.CUR_USER.email) || { xp: 0, sessions: 0, downloads: 0 };
      st.downloads = (st.downloads || 0) + 1;
      st.xp = (st.xp || 0) + 10;
      CACHE.stByEmail[window.CUR_USER.email] = st;
      if (window.updateLevel) window.updateLevel(st.xp);
      if (window.updateDashStats) window.updateDashStats();
    }
    var session = await AZ.Auth.getSession();
    if (!session) return;
    await AZ.Downloads.record(session.user.id, MODULE_ID, name);
    await AZ.Activity.log(MODULE_ID, 'download', { file: name });
    await AZ.db.rpc('increment_xp', { user_id: session.user.id, amount: 10 });
  };

  // ════════════════════════════════════════════════════════════════════════
  //  12. OVERRIDE QUIZ COMPLETION
  // ════════════════════════════════════════════════════════════════════════
  var _origSubmitQuiz = window.submitQuiz || window.qzFinish;
  window.qzFinish = window.submitQuiz = async function (quizId, score) {
    if (_origSubmitQuiz) _origSubmitQuiz.call(this, quizId, score);
    var session = await AZ.Auth.getSession();
    if (!session) return;
    var xpEarned = Math.round((score / 100) * 50);
    try {
      await AZ.Progress.complete(session.user.id, MODULE_ID, quizId, score, xpEarned);
      await AZ.Activity.log(MODULE_ID, 'quiz_complete', { quiz: quizId, score });
    } catch (e) { console.warn('[CICA Patch] qzFinish error:', e.message); }
  };

  // ════════════════════════════════════════════════════════════════════════
  //  13. LOAD CACHE FROM SUPABASE
  // ════════════════════════════════════════════════════════════════════════
  async function _loadUserCache(userId, email) {
    try {
      var progressMap = await AZ.Progress.load(userId, MODULE_ID);
      var st = { xp: 0, sessions: 0, downloads: 0 };
      Object.values(progressMap).forEach(function (row) { if (row.completed) st.xp += row.xp_earned || 0; });
      var downloads = await AZ.Downloads.getForUser(userId, MODULE_ID);
      st.downloads = downloads.length;
      CACHE.stByEmail[email.toLowerCase()] = st;
    } catch (e) { console.warn('[CICA Patch] loadUserCache error:', e.message); }
  }

  function whenReady(fn) {
    if (window.AZ && window.AZ.Auth) { fn(); return; }
    var t = setInterval(function () { if (window.AZ && window.AZ.Auth) { clearInterval(t); fn(); } }, 50);
  }

  // ════════════════════════════════════════════════════════════════════════
  //  14. AUTO-LOGIN + APPLY PATCHES
  // ════════════════════════════════════════════════════════════════════════
  whenReady(async function () {
    // Apply function overrides after the original JS has run
    _patchDl();
    _patchUpdateLevel();
    _patchRenderQuestion();

    try {
      var current = await AZ.Auth.getCurrentUser();
      if (!current) { window.location.replace('/'); return; }

      var { user, profile } = current;
      var hasAccess = await AZ.Modules.hasAccess(profile.id, MODULE_ID);
      var isAdmin   = ['admin', 'super_admin'].includes(profile.role);
      if (!hasAccess && !isAdmin) { await AZ.Auth.signOut(); window.location.replace('/'); return; }

      window.CUR_USER = { name: profile.full_name || user.email, email: user.email, isAdmin: isAdmin };
      await _loadUserCache(profile.id, user.email);

      if (isAdmin) document.body.classList.add('is-admin');
      else         document.body.classList.remove('is-admin');

      if (profile.lang && window.LANG !== profile.lang) {
        window.LANG = profile.lang;
        if (window.setLang) window.setLang(profile.lang);
      }

      // Auto-launch
      var loginScreen = document.getElementById('login-screen') || document.getElementById('auth-wrap');
      if (loginScreen && loginScreen.style.display !== 'none') {
        if (window.loginUser) window.loginUser(window.CUR_USER);
      }

      // Show tutorial on first visit
      var tourDone = false;
      try { tourDone = localStorage.getItem(TOUR_KEY) === '1'; } catch (e) {}
      if (!tourDone) {
        setTimeout(function () { if (window.azStartTour) window.azStartTour(); }, 800);
      }

    } catch (e) { console.warn('[CICA Patch] auto-login error:', e.message); }
  });

  // ── Intercept preference saves ──
  var _origToggleDark = window.toggleDark;
  window.toggleDark = async function () {
    if (_origToggleDark) _origToggleDark.call(this);
    var session = await AZ.Auth.getSession();
    if (!session) return;
    await AZ.Prefs.save(session.user.id, { theme: document.body.classList.contains('dark') ? 'dark' : 'light' });
  };

  var _origSetLang = window.setLang;
  window.setLang = async function (lang) {
    if (_origSetLang) _origSetLang.call(this, lang);
    var session = await AZ.Auth.getSession();
    if (!session) return;
    await AZ.Prefs.save(session.user.id, { lang });
  };

  console.log('[Academia Ensurity] CICA patch v2 loaded ✓');
})();
