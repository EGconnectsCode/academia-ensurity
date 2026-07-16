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
      body.dark button:not([class*="az-"]):not(.sb-item):not(.os-tab) {
        background:#1E293B!important; color:#E2E8F0!important; border-color:rgba(255,255,255,.12)!important;
      }
      body.dark button:not([class*="az-"]):not(.sb-item):not(.os-tab):hover { background:#2D3B55!important; }
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
      body.dark .az-home-card { background:#1E293B!important; box-shadow:none!important; }
      body.dark .az-home-title { color:#E2E8F0!important; }
      body.dark .az-home-sub { color:#94A3B8!important; }
      body.dark .az-home-tile { background:#0F172A!important; }
      body.dark .az-home-tile-title { color:#E2E8F0!important; }
      body.dark .az-home-tile-desc { color:#94A3B8!important; }

      /* ── Topbar ── */
      .topbar { background:var(--az-navy)!important; border-bottom:1px solid rgba(255,255,255,.07)!important;
        box-shadow:0 1px 8px rgba(0,0,0,.25)!important; height:54px!important;
        padding:0 16px!important; display:flex!important; align-items:center!important; gap:10px!important;
        justify-content:space-between!important; }
      .topbar-logo { display:none!important; }
      .topbar-right { margin-left:auto!important; }
      .tb-user  { display:none!important; }
      .tb-dark-btn { display:none!important; }
      button[onclick*="toggleDark"] { display:none!important; }
      .admin-only { display:none!important; }
      body.is-admin .admin-only { display:none!important; }
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
      .sb-user-row { display:none!important; }
      .sb-bottom { display:none!important; }
      .sb-user-name { font-size:.88rem!important; }
      .sb-label { font-size:.62rem!important; font-weight:700!important; text-transform:uppercase!important;
        letter-spacing:.1em!important; color:rgba(255,255,255,.3)!important; padding:14px 16px 5px!important; }
      .sb-label:first-of-type { display:none!important; }
      .sb-item[data-page="portal"] { display:none!important; }
      .sb-item[data-page="admin-users"],
      .sb-item[data-page="admin-activity"],
      .sb-item[data-page="admin-ranking"] { display:none!important; }
      #page-admin-users, #page-admin-activity, #page-admin-ranking { display:none!important; }
      .sb-item { display:flex!important; align-items:center!important; gap:9px!important;
        padding:11px 16px!important; width:100%!important; text-align:left!important;
        background:none!important; border:none!important; color:rgba(255,255,255,.65)!important;
        font-size:.86rem!important; font-weight:500!important; cursor:pointer!important;
        transition:background .13s,color .13s!important; }
      .sb-bottom { display:none!important; }
      .az-topbar-signout { background:#DC2626; border:2px solid #ef4444;
        color:#fff; padding:8px 20px; border-radius:8px; font-size:.85rem;
        font-weight:700; cursor:pointer; font-family:inherit; transition:all .15s; white-space:nowrap;
        letter-spacing:.01em; box-shadow:0 2px 8px rgba(220,38,38,.4); }
      .az-topbar-signout:hover { background:#b91c1c; border-color:#dc2626; box-shadow:0 4px 12px rgba(220,38,38,.5); }
      .az-topbar-dark { background:transparent!important; border:1px solid rgba(255,255,255,.2)!important; color:#fff!important; width:28px!important; height:28px!important; border-radius:6px!important; cursor:pointer!important; font-size:.85rem!important; display:flex!important; align-items:center!important; justify-content:center!important; padding:0!important; flex-shrink:0!important; }
      .az-topbar-dark:hover { background:rgba(255,255,255,.1)!important; }
      .az-admin-back { background:rgba(251,191,36,.15)!important; border:1px solid rgba(251,191,36,.4)!important; color:#fbbf24!important; padding:4px 12px!important; border-radius:6px!important; font-size:.75rem!important; font-weight:700!important; cursor:pointer!important; text-decoration:none!important; display:flex!important; align-items:center!important; white-space:nowrap!important; }
      .az-admin-back:hover { background:rgba(251,191,36,.25)!important; }
      /* ── Training notification banner ── */
      #training-banner { background:linear-gradient(135deg,#DC2626,#B91C1C)!important; color:#fff!important;
        border:none!important; border-radius:10px!important; padding:10px 16px!important;
        font-size:.82rem!important; font-weight:600!important; margin:16px 20px 0!important;
        display:flex!important; align-items:center!important; gap:10px!important;
        box-shadow:0 2px 8px rgba(220,38,38,.3)!important; }
      #training-banner * { color:#fff!important; }
      #training-banner a { text-decoration:underline!important; }
      #training-banner button { background:rgba(255,255,255,.2)!important; border:1px solid rgba(255,255,255,.3)!important;
        color:#fff!important; border-radius:6px!important; padding:3px 10px!important;
        font-size:.75rem!important; cursor:pointer!important; }
      /* ── e-Training step tabs ── */
      #et-tabs { display:flex!important; align-items:stretch!important; gap:0!important;
        margin-bottom:20px!important; flex-wrap:nowrap!important; }
      #et-tabs .os-tab { flex:1!important; padding:14px 10px!important; font-size:.88rem!important;
        font-weight:600!important; border-radius:0!important; border-right:none!important; text-align:center!important; }
      #et-tabs .os-tab:first-child { border-radius:10px 0 0 10px!important; }
      #et-tabs .os-tab:last-child { border-radius:0 10px 10px 0!important; border-right:1px solid var(--bdr)!important; }
      .az-et-step-num { font-size:.65rem; font-weight:700; letter-spacing:.05em; opacity:.65; display:block; margin-bottom:3px; }
      .az-et-arrow { display:flex; align-items:center; padding:0 2px; color:#94A3B8; font-size:1.1rem;
        flex-shrink:0; background:var(--sur2); border-top:1px solid var(--bdr); border-bottom:1px solid var(--bdr); }
      /* ── Hide emoji icons in page headers ── */
      .ph-ico { display:none!important; }
      .sb-item:hover  { background:rgba(255,255,255,.06)!important; color:#fff!important; }
      .sb-item.active { background:rgba(37,99,235,.3)!important; color:#fff!important; font-weight:600!important; }
      .sb-badge { background:#3B82F6!important; color:#fff!important; font-size:.62rem!important;
        font-weight:700!important; border-radius:99px!important; padding:1px 6px!important; margin-left:auto!important; }
      .sb-footer { padding:12px 14px!important; border-top:1px solid rgba(255,255,255,.08)!important; }
      #sb-level { display:none!important; }
      .sb-bottom .sb-item { color:rgba(255,255,255,.5)!important; }
      .sb-bottom .sb-item:hover { color:#fff!important; }
      body.is-admin .admin-only   { display:flex!important; }
      body.is-admin .admin-only.sb-label { display:block!important; }
      .admin-only { display:none!important; }

      /* ── Home page: only hero ── */
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
      .azq-btn-p:hover:not(:disabled) { opacity:.9; }
      .azq-btn-p:disabled { background:#94A3B8; cursor:not-allowed; opacity:.7; }
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
      // ── Inject Admin back | EN/ES toggle | Dark mode | Sign Out into topbar right ──
      var acts = document.querySelector('.topbar-right') || document.querySelector('.tb-acts');
      if (acts) {
        var backBtn = document.createElement('a');
        backBtn.className = 'az-admin-back';
        backBtn.href = '/';
        backBtn.innerHTML = '<span class="en">← Dashboard</span><span class="es">← Inicio</span>';
        acts.appendChild(backBtn);

        var div = document.createElement('div');
        div.className = 'az-lang-toggle';
        div.innerHTML =
          '<button class="az-lb" id="az-lb-en" onclick="window._azLang(\'en\')">EN</button>' +
          '<button class="az-lb" id="az-lb-es" onclick="window._azLang(\'es\')">ES</button>';
        acts.appendChild(div);

        var darkBtn = document.createElement('button');
        darkBtn.className = 'az-topbar-dark';
        darkBtn.title = 'Dark mode / Modo noche';
        darkBtn.textContent = '🌙';
        darkBtn.onclick = function () { if (typeof window.toggleDark === 'function') window.toggleDark(); };
        acts.appendChild(darkBtn);

        var soBtn = document.createElement('button');
        soBtn.className = 'az-topbar-signout';
        soBtn.innerHTML = '<span class="en">Sign Out</span><span class="es">Cerrar Sesión</span>';
        soBtn.onclick = function () { if (window.logout) window.logout(); };
        acts.appendChild(soBtn);
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

      // ── Remove emojis/icons from sidebar items ──
      document.querySelectorAll('.sb-item').forEach(function (item) {
        item.querySelectorAll('svg, .sb-ico, .sb-icon, img').forEach(function (el) { el.remove(); });
        item.childNodes.forEach(function (node) {
          if (node.nodeType === 3) {
            node.textContent = node.textContent.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2700}-\u{27BF}]|️/gu, '').trim();
          }
        });
      });

      // ── Inject page content into Home/Inicio ──
      var pageHome = document.getElementById('page-home');
      if (pageHome) {
        var inicioWrap = document.createElement('div');
        inicioWrap.id = 'az-inicio';
        inicioWrap.style.cssText = 'padding:20px;';
        inicioWrap.innerHTML =
          '<div class="az-home-card" style="background:#fff;border-radius:14px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.07),0 4px 12px rgba(0,0,0,.06);max-width:820px;margin:0 auto;">' +
          '<h2 class="az-home-title" style="font-size:1.4rem;font-weight:800;color:#0F172A;margin-bottom:8px;"><span class="en">Welcome to the CICA Citizens Portal</span><span class="es">Bienvenido al Portal CICA Citizens</span></h2>' +
          '<p class="az-home-sub" style="color:#64748B;font-size:.9rem;line-height:1.6;margin-bottom:24px;"><span class="en">This portal centralizes all the resources you need as a CICA agent: training materials, forms, department guides, and tools to manage your clients and commissions.</span><span class="es">Este portal centraliza todos los recursos que necesitas como agente CICA: materiales de entrenamiento, formularios, guías departamentales y herramientas para gestionar tus clientes y comisiones.</span></p>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:24px;">' +
          '<div class="az-home-tile" style="background:#F1F5F9;border-radius:10px;padding:18px;"><div class="az-home-tile-title" style="font-weight:700;color:#0F172A;margin-bottom:5px;font-size:.9rem;">e-Training</div><div class="az-home-tile-desc" style="font-size:.82rem;color:#64748B;line-height:1.5;"><span class="en">Training videos, quizzes and eligibility resources. Earn up to 50 XP for a perfect quiz.</span><span class="es">Videos de entrenamiento, quizzes y elegibilidad. Gana hasta 50 XP por quiz perfecto.</span></div></div>' +
          '<div class="az-home-tile" style="background:#F1F5F9;border-radius:10px;padding:18px;"><div class="az-home-tile-title" style="font-weight:700;color:#0F172A;margin-bottom:5px;font-size:.9rem;"><span class="en">Contracts &amp; Commissions</span><span class="es">Contratos y Comisiones</span></div><div class="az-home-tile-desc" style="font-size:.82rem;color:#64748B;line-height:1.5;"><span class="en">Commission schedules, ACH form and commission advance requests.</span><span class="es">Tablas de comisiones, formulario ACH y solicitudes de adelanto de comisión.</span></div></div>' +
          '<div class="az-home-tile" style="background:#F1F5F9;border-radius:10px;padding:18px;"><div class="az-home-tile-title" style="font-weight:700;color:#0F172A;margin-bottom:5px;font-size:.9rem;"><span class="en">Claim Forms</span><span class="es">Formularios de Reclamo</span></div><div class="az-home-tile-desc" style="font-size:.82rem;color:#64748B;line-height:1.5;"><span class="en">Life claim forms for policyholders and beneficiaries. Preview or download.</span><span class="es">Formularios de reclamo de vida para asegurados y beneficiarios. Previsualiza o descarga.</span></div></div>' +
          '<div class="az-home-tile" style="background:#F1F5F9;border-radius:10px;padding:18px;"><div class="az-home-tile-title" style="font-weight:700;color:#0F172A;margin-bottom:5px;font-size:.9rem;"><span class="en">Helpful Links</span><span class="es">Recursos Útiles</span></div><div class="az-home-tile-desc" style="font-size:.82rem;color:#64748B;line-height:1.5;"><span class="en">Links to the agent portal, SS Billing guides, HIPAA resources and state availability.</span><span class="es">Links al portal de agentes, guías SS Billing, recursos HIPAA y disponibilidad por estado.</span></div></div>' +
          '</div>' +
          '<button onclick="if(window.azStartTour)window.azStartTour()" style="background:#2563EB;color:#fff;border:none;border-radius:8px;padding:10px 22px;font-size:.88rem;font-weight:600;cursor:pointer;font-family:inherit;"><span class="en">View portal guide</span><span class="es">Ver guía del portal</span></button>' +
          '</div>';
        pageHome.appendChild(inicioWrap);
        pageHome.querySelector('.home-2col') && (pageHome.querySelector('.home-2col').style.display = 'none');
      }

      // ── "Go to my portal" / "Ir a mi portal" in hero buttons ──
      document.querySelectorAll('.hero-btn .en, .hero-btn .es').forEach(function (el) {
        var t = el.textContent.toLowerCase();
        if (t.includes('agent portal') || t.includes('portal del agente')) {
          el.textContent = el.classList.contains('es') ? 'Ir a mi portal' : 'Go to my portal';
        }
      });
      // Strip emoji text nodes from .hero-btn parent (e.g. 🔒 before span text)
      document.querySelectorAll('.hero-btn').forEach(function (btn) {
        btn.childNodes.forEach(function (node) {
          if (node.nodeType === 3) {
            node.textContent = node.textContent.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]|️/gu, '').trim();
          }
        });
      });
      // Strip emoji from hero-btn-2 (e.g. 🎓 e-Training) and inject About Us after it
      document.querySelectorAll('.hero-btn-2').forEach(function (btn) {
        btn.childNodes.forEach(function (node) {
          if (node.nodeType === 3) {
            node.textContent = node.textContent.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]|️/gu, '').trim();
          }
        });
        btn.querySelectorAll('.en, .es').forEach(function (s) {
          s.textContent = s.textContent.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]|️/gu, '').trim();
        });
      });
      // ── Inject "About Us" button after e-Training in hero ──
      var heroBtn2 = document.querySelector('.hero-btn-2');
      if (heroBtn2 && heroBtn2.parentElement && !heroBtn2.parentElement.querySelector('.az-about-hero')) {
        var aboutHeroBtn = document.createElement('a');
        aboutHeroBtn.href = '/about';
        aboutHeroBtn.className = 'hero-btn-2 az-about-hero';
        aboutHeroBtn.style.cssText = 'text-decoration:none!important;';
        aboutHeroBtn.innerHTML = '<span class="en">About Us</span><span class="es">Sobre Nosotros</span>';
        heroBtn2.parentElement.insertBefore(aboutHeroBtn, heroBtn2.nextSibling);
      }
      // Quick links in home sidebar widget
      document.querySelectorAll('.sec-name .en, .sec-name .es').forEach(function (el) {
        var t = el.textContent.toLowerCase();
        if (t.includes('agent portal') || t.includes('portal del agente')) {
          el.textContent = el.classList.contains('es') ? 'Ir a mi portal' : 'Go to my portal';
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
        card.querySelectorAll('.vm-btn .en').forEach(function (e) { e.textContent = '▶ Watch here'; });
        card.querySelectorAll('.vm-btn .es').forEach(function (e) { e.textContent = '▶ Ver aquí'; });
        card.querySelectorAll('.vm-btn').forEach(function (b) {
          if (!b.querySelector('.en') && !b.querySelector('.es')) b.textContent = '▶ Ver aquí';
        });
      });

      // ── Change Download buttons to "Preview" in fcard (not inside quiz) ──
      document.querySelectorAll('.fbtn').forEach(function (btn) {
        if (btn.closest('#quiz-container')) return;
        btn.querySelectorAll('.en').forEach(function (e) { e.textContent = '👁 Preview'; });
        btn.querySelectorAll('.es').forEach(function (e) { e.textContent = '👁 Vista previa'; });
        if (!btn.querySelector('.en') && !btn.querySelector('.es')) btn.textContent = '👁 Preview';
      });

      // ── Move training banner above welcome in Inicio page ──
      var trainBanner = document.getElementById('training-banner');
      var pageHome2 = document.getElementById('page-home');
      if (trainBanner && pageHome2) {
        var inicioEl = document.getElementById('az-inicio');
        pageHome2.insertBefore(trainBanner, inicioEl || pageHome2.firstChild);
      }

      // ── Remove emojis from e-Training tab bar and add step indicators ──
      var etTabs = document.getElementById('et-tabs');
      if (etTabs) {
        var etTabBtns = Array.from(etTabs.querySelectorAll('.os-tab'));
        etTabBtns.forEach(function (tab, i) {
          tab.querySelectorAll('.en, .es').forEach(function (span) {
            span.textContent = span.textContent.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2700}-\u{27BF}]|️/gu, '').trim();
          });
          tab.childNodes.forEach(function (node) {
            if (node.nodeType === 3) node.textContent = node.textContent.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2700}-\u{27BF}]|️/gu, '').trim();
          });
          var stepNum = document.createElement('span');
          stepNum.className = 'az-et-step-num';
          stepNum.textContent = (window.LANG === 'es' ? 'Paso ' : 'Step ') + (i + 1);
          tab.insertBefore(stepNum, tab.firstChild);
          if (i < etTabBtns.length - 1) {
            var arrow = document.createElement('div');
            arrow.className = 'az-et-arrow';
            arrow.textContent = '→';
            etTabs.insertBefore(arrow, tab.nextSibling);
          }
        });
      }

      // ── Remove emojis from home page original content ──
      var homePageEl = document.getElementById('page-home');
      if (homePageEl) {
        homePageEl.querySelectorAll('.home-title,.hero-stat,.section-title,.ph-row,h1,h2,h3').forEach(function (el) {
          el.childNodes.forEach(function (node) {
            if (node.nodeType === 3) node.textContent = node.textContent.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2700}-\u{27BF}]|️/gu, '').trim();
          });
        });
      }
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
          <button class="az-pdf-dl" id="az-pdf-dl-btn" onclick="window.azDownloadPdf()"><span class="en">&#8659; Download</span><span class="es">&#8659; Descargar</span></button>
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
      if (spot)  { spot.style.cssText = ''; spot.style.display = 'none'; }
      if (card)  { card.style.display = 'none'; card.innerHTML = ''; }
      try { localStorage.setItem(TOUR_KEY, '1'); } catch (e) {}
    }

    window.azTourNext = function () { curStep++; step(curStep); };
    window.azEndTour  = end;
    window.azStartTour = function () {
      if (!overlay) buildDOM();
      if (spot) spot.style.display = '';
      if (card) card.style.display = '';
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
      var _QD = (typeof QUIZ_DATA !== 'undefined' ? QUIZ_DATA : null);
      if (!_QD || !window.qState) return;
      var mod = _QD[window.qState.module];
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
      var text  = (lang === 'es' && q.es) ? q.es : (q.en || q.text || '');
      var opts  = (lang === 'es' && q.opts_es) ? q.opts_es : (q.opts_en || q.opts || []);

      var optsHtml = opts.map(function (opt, i) {
        return '<div class="azq-opt" onclick="window.azAnswerQ(' + i + ')">' +
          '<div class="azq-dot">' + String.fromCharCode(65 + i) + '</div>' +
          '<span>' + opt + '</span></div>';
      }).join('');

      var isLast = (idx + 1 >= total);
      var nextLabel = isLast
        ? (lang === 'es' ? 'Ver resultados →' : 'See results →')
        : (lang === 'es' ? 'Siguiente →' : 'Next →');

      container.innerHTML =
        '<div class="azq-wrap">' +
        '<div class="azq-prog-label">' +
        (lang === 'es' ? 'Pregunta ' : 'Question ') + (idx + 1) + ' ' +
        (lang === 'es' ? 'de ' : 'of ') + total +
        '</div>' +
        '<div class="azq-prog-bar"><div class="azq-prog-fill" style="width:' + progPct + '%"></div></div>' +
        '<div class="azq-q">' + text + '</div>' +
        '<div class="azq-opts">' + optsHtml + '</div>' +
        '<div class="azq-actions">' +
        '<button class="azq-btn azq-btn-p" id="azq-next-btn" onclick="window.nextQ()" disabled>' + nextLabel + '</button>' +
        '</div>' +
        '</div>';
    };

    window.azAnswerQ = function (i) {
      if (!window.qState || window.qState.answered) return;
      window.qState.answered = true;
      var mod  = (typeof QUIZ_DATA !== 'undefined' ? QUIZ_DATA : {})[window.qState.module];
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
      var answerOpts = (lang === 'es' && q.opts_es) ? q.opts_es : (q.opts_en || q.opts || []);
      fb.textContent = correct
        ? (lang === 'es' ? '✓ ¡Correcto!' : '✓ Correct!')
        : (lang === 'es' ? '✗ Incorrecto. La respuesta era: ' + (answerOpts[q.ans] || '') : '✗ Incorrect. The answer was: ' + (answerOpts[q.ans] || ''));

      var wrap = document.querySelector('.azq-wrap');
      if (wrap) {
        var actionsEl = wrap.querySelector('.azq-actions');
        wrap.insertBefore(fb, actionsEl);
        var nextBtn = document.getElementById('azq-next-btn');
        if (nextBtn) nextBtn.disabled = false;
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

  // ── BLOCK MODULE-LEVEL LOGIN/REGISTER UI ──
  var _blockLogin = function () { window.location.replace('/'); };
  window.showLogin = window.showRegister = window.showAuth = window.showForgot = _blockLogin;
  window.goToLogin = window.openLogin   = window.displayLogin = _blockLogin;

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
  // ════════════════════════════════════════════════════════════════════════
  //  14b. PATCH renderMetrics — fix downloads percentage
  // ════════════════════════════════════════════════════════════════════════
  function _patchRenderMetrics() {
    var _origRM = window.renderMetrics;
    window.renderMetrics = function () {
      if (_origRM) _origRM.call(this);
      if (!window.CUR_USER) return;
      var st = window.loadST(window.CUR_USER.email) || { downloads: 0 };
      var dl = st.downloads || 0;
      var totalFiles = document.querySelectorAll('[id^="pdf_"]').length || 1;
      var pct = Math.min(100, Math.round(dl / totalFiles * 100));
      document.querySelectorAll('.met-bar-row').forEach(function (row) {
        if (row.textContent.includes('Descargas') || row.textContent.includes('Downloads')) {
          var fill = row.querySelector('.met-bar-fill');
          if (fill) fill.style.width = pct + '%';
          var pctEl = row.querySelector('.met-bar-pct');
          if (pctEl) pctEl.textContent = pct + '%';
          var lbl = row.querySelector('.met-bar-label');
          if (lbl) lbl.innerHTML = lbl.innerHTML.replace(/\(\d+\)/, '(' + dl + '/' + totalFiles + ')');
        }
      });
    };
  }

  function _removeAdminUI() {
    document.querySelectorAll('.admin-only').forEach(function(el) { el.remove(); });
  }

  // ── Widget loader ──────────────────────────────────────────────────────────
  function _withWidgets(cb) {
    if (window.AZWidgets) { cb(); return; }
    var s = document.createElement('script');
    s.src = '../../shared/az-widgets.js';
    s.onload = cb;
    s.onerror = function () { console.warn('[CICA Patch] az-widgets.js could not load'); };
    document.head.appendChild(s);
  }

  var _ONBOARD_STEPS_EN = [
    { icon: '🦅', title: 'Welcome to CICA Citizens Portal',
      body: 'Welcome to the CICA Citizens Agent Training Portal. Your hub for training resources, contract forms, and sales tools to grow your agency.' },
    { icon: '📚', title: 'Training Modules',
      body: 'Explore the training modules in the sidebar: videos, presentations, and quizzes. Complete each assessment to earn XP and advance your level.' },
    { icon: '📄', title: 'Downloads & Forms',
      body: 'In the Downloads section you will find contract forms, claim forms, and product guides. Use "Preview" to view or "Download" to save.' },
    { icon: '📊', title: 'Your Progress',
      body: 'Your XP and level update automatically as you complete assessments. View your history and achievements in your profile or the top navigation bar.' },
    { icon: '💬', title: 'Questions or Help?',
      body: 'Use the support chat in the bottom right corner for quick answers about training, downloads, and platform navigation.' }
  ];

  var _ONBOARD_STEPS = [
    { icon: '🏛️', title: 'Bienvenido a CICA',
      body: 'Bienvenido al portal de entrenamiento de Citizens Insurance Carriers of America. Aquí encontrarás módulos de capacitación, formularios de campo y recursos para agentes.' },
    { icon: '📚', title: 'Módulos de Entrenamiento',
      body: 'Navega los módulos desde el menú lateral. Aprende sobre los productos CICA, beneficios, cumplimiento y técnicas de venta. Completa los quizzes para ganar XP.' },
    { icon: '📄', title: 'Descargas y Formularios',
      body: 'En Descargas encontrarás formularios de aplicación, folletos y guías del agente CICA. Usa el botón "Vista Previa" para revisar o "Descargar" para guardar.' },
    { icon: '📊', title: 'Tu Progreso',
      body: 'Cada módulo y quiz completado suma XP a tu perfil. Tu nivel refleja tu avance en la plataforma. Consulta tus logros en el perfil de usuario.' },
    { icon: '💬', title: '¿Tienes Dudas?',
      body: 'El asistente de chat en la esquina inferior derecha puede ayudarte a localizar formularios, descargar documentos y navegar la plataforma. ¡Disponible en todo momento!' }
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
    { label: '📦 CICA Products',
      keywords: ['product', 'policy', 'insurance', 'whole', 'life', 'coverage', 'citizens'],
      answer: 'CICA Citizens product information is in the training modules and the Downloads section (contracts, forms, and agent resources).' }
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
    { label: '📦 Productos CICA',
      keywords: ['producto', 'poliza', 'póliza', 'seguro', 'vida', 'citizens', 'cobertura', 'prima', 'beneficio'],
      answer: 'La información sobre productos CICA está en los módulos de entrenamiento y en la sección de Descargas (folletos, guías de campo y materiales de ventas para agentes).' }
  ];

  whenReady(async function () {
    // Apply function overrides after the original JS has run
    _patchDl();
    _azInjectFileButtons();
    _removeAdminUI();
    _patchUpdateLevel();
    _patchRenderQuestion();
    _patchRenderMetrics();

    // Re-render quiz with patched renderQuestion
    setTimeout(function () {
      if (window.loadQuiz && window.qState) window.loadQuiz(window.qState.module || 'portal');
    }, 300);

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

      // Navigate to Inicio on load
      setTimeout(function () { if (window.navTo) window.navTo('home'); }, 100);

      // Show tutorial on first visit only
      var tourDone = false;
      try { tourDone = localStorage.getItem(TOUR_KEY) === '1'; } catch (e) {}
      if (!tourDone) {
        setTimeout(function () { if (window.azStartTour) window.azStartTour(); }, 900);
      }

      _withWidgets(function () {
        var _faqs  = (window.LANG === 'en') ? _CHAT_FAQS_EN    : _CHAT_FAQS;
        var _steps = (window.LANG === 'en') ? _ONBOARD_STEPS_EN : _ONBOARD_STEPS;
        window.AZWidgets.initChat(_faqs, window.LANG);
        setTimeout(function () { window.AZWidgets.initOnboarding(_steps, window.LANG); }, 700);
      });

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
    if (window.AZWidgets && window.AZWidgets.updateChatLang) {
      var _faqs = (lang === 'en') ? _CHAT_FAQS_EN : _CHAT_FAQS;
      window.AZWidgets.updateChatLang(lang, _faqs);
    }
    if (window.AZWidgets && window.AZWidgets.updateOnboardingLang) {
      var _steps = (lang === 'en') ? _ONBOARD_STEPS_EN : _ONBOARD_STEPS;
      window.AZWidgets.updateOnboardingLang(lang, _steps);
    }
    var session = await AZ.Auth.getSession();
    if (!session) return;
    await AZ.Prefs.save(session.user.id, { lang });
  };

  console.log('[Academia Ensurity] CICA patch v2 loaded ✓');
})();
