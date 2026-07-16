/**
 * az-widgets.js  —  Onboarding Guide + Support Chat
 * Academia Ensurity · shared across all module dashboards
 *
 * Usage: window.AZWidgets.initOnboarding(steps)  — call once per page load
 *        window.AZWidgets.initChat(faqs)          — call once per page load
 */
(function (global) {
  'use strict';

  /* ══════════════════════════════════════════════════════════════════════════
   *  ONBOARDING GUIDE
   *  Shows every page load. Skip just closes — no localStorage is written.
   * ══════════════════════════════════════════════════════════════════════════ */
  var _OB_TXT = {
    en: { skip: 'Skip guide', prev: '← Previous', next: 'Next →', done: 'Start  ✓',
      stepLbl: function (i, n) { return 'Step ' + i + ' of ' + n; } },
    es: { skip: 'Omitir guía', prev: '← Anterior', next: 'Siguiente →', done: 'Comenzar  ✓',
      stepLbl: function (i, n) { return 'Paso ' + i + ' de ' + n; } }
  };

  var _obState = null; // { lang, steps, cur, els:{...} }

  function _renderObDots() {
    var s = _obState;
    var el = s.els.dots;
    el.innerHTML = '';
    s.steps.forEach(function (_, i) {
      var d = document.createElement('div');
      d.style.cssText =
        'height:7px;border-radius:4px;transition:all .28s;background:' +
        (i === s.cur ? '#2563eb' : '#e2e8f0') + ';width:' + (i === s.cur ? '26px' : '7px') + ';';
      el.appendChild(d);
    });
  }

  function _renderObStep(i) {
    var s = _obState;
    var card = s.els.card;
    card.style.opacity = '0';
    card.style.transform = 'translateY(10px)';
    setTimeout(function () {
      var step = s.steps[i];
      var t = _OB_TXT[s.lang];
      s.els.counter.textContent = t.stepLbl(i + 1, s.steps.length);
      s.els.icon.textContent  = step.icon;
      s.els.title.textContent = step.title;
      s.els.body.textContent  = step.body;
      s.els.prev.style.display = i > 0 ? '' : 'none';
      s.els.prev.textContent = t.prev;
      s.els.skip.textContent = t.skip;
      s.els.next.textContent = (i === s.steps.length - 1) ? t.done : t.next;
      _renderObDots();
      card.style.opacity   = '1';
      card.style.transform = 'translateY(0)';
    }, 200);
  }

  /** Update the onboarding modal's language (and optionally its step content) while open. */
  function updateOnboardingLang(lang, steps) {
    if (!_obState) return;
    lang = (lang === 'en') ? 'en' : 'es';
    _obState.lang = lang;
    if (steps) _obState.steps = steps;
    _renderObStep(_obState.cur);
  }

  function initOnboarding(steps, lang) {
    if (document.getElementById('az-ob-overlay')) return; // guard double-init
    lang = (lang === 'en') ? 'en' : 'es';
    var t = _OB_TXT[lang];

    var overlay = document.createElement('div');
    overlay.id  = 'az-ob-overlay';
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:99998;background:rgba(8,12,28,.88);' +
      'backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);' +
      'display:flex;align-items:center;justify-content:center;' +
      'opacity:0;transition:opacity .4s;';

    overlay.innerHTML =
      '<div id="az-ob-card" style="' +
        'background:#fff;border-radius:22px;padding:42px 38px 32px;max-width:490px;width:92%;' +
        'box-shadow:0 40px 120px rgba(0,0,0,.45),0 0 0 1px rgba(255,255,255,.06);' +
        'position:relative;transition:opacity .22s,transform .22s;' +
      '">' +

        /* close × */
        '<button id="az-ob-x" style="' +
          'position:absolute;top:14px;right:16px;background:none;border:none;cursor:pointer;' +
          'color:#cbd5e1;font-size:17px;line-height:1;padding:7px 11px;border-radius:8px;' +
          'transition:color .15s,background .15s;' +
        '" onmouseenter="this.style.background=\'#f1f5f9\';this.style.color=\'#64748b\'" ' +
           'onmouseleave="this.style.background=\'none\';this.style.color=\'#cbd5e1\'">✕</button>' +

        /* step counter */
        '<div id="az-ob-counter" style="' +
          'text-align:center;font-size:.7rem;color:#94a3b8;font-weight:700;' +
          'letter-spacing:.1em;text-transform:uppercase;margin-bottom:18px;' +
        '"></div>' +

        /* progress dots */
        '<div id="az-ob-dots" style="display:flex;gap:7px;justify-content:center;margin-bottom:28px;"></div>' +

        /* icon */
        '<div id="az-ob-icon" style="font-size:54px;text-align:center;margin-bottom:16px;' +
          'line-height:1;transition:transform .2s;"></div>' +

        /* title */
        '<h2 id="az-ob-title" style="' +
          'font-size:1.2rem;font-weight:800;color:#0f172a!important;text-align:center;' +
          'margin:0 0 12px;line-height:1.3;' +
        '"></h2>' +

        /* body */
        '<p id="az-ob-body" style="' +
          'font-size:.875rem;line-height:1.72;color:#475569!important;text-align:center;' +
          'margin:0 0 32px;' +
        '"></p>' +

        /* buttons */
        '<div style="display:flex;gap:8px;justify-content:center;align-items:center;flex-wrap:wrap;">' +
          '<button id="az-ob-skip" style="' +
            'background:none;border:1px solid #e2e8f0;color:#94a3b8;font-size:.8rem;' +
            'padding:9px 18px;border-radius:11px;cursor:pointer;transition:border-color .15s,color .15s;' +
          '" onmouseenter="this.style.borderColor=\'#cbd5e1\';this.style.color=\'#64748b\'" ' +
             'onmouseleave="this.style.borderColor=\'#e2e8f0\';this.style.color=\'#94a3b8\'">' + t.skip + '</button>' +
          '<button id="az-ob-prev" style="' +
            'background:#f8fafc;border:1px solid #e2e8f0;color:#64748b;font-size:.8rem;' +
            'padding:9px 16px;border-radius:11px;cursor:pointer;display:none;transition:background .15s;' +
          '" onmouseenter="this.style.background=\'#f1f5f9\'" ' +
             'onmouseleave="this.style.background=\'#f8fafc\'">' + t.prev + '</button>' +
          '<button id="az-ob-next" style="' +
            'background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);border:none;color:#fff;' +
            'font-size:.88rem;font-weight:700;padding:10px 28px;border-radius:11px;cursor:pointer;' +
            'box-shadow:0 4px 16px rgba(37,99,235,.38);transition:box-shadow .2s,transform .15s;' +
          '" onmouseenter="this.style.boxShadow=\'0 6px 22px rgba(37,99,235,.55)\';this.style.transform=\'translateY(-1px)\'" ' +
             'onmouseleave="this.style.boxShadow=\'0 4px 16px rgba(37,99,235,.38)\';this.style.transform=\'\'">' + t.next + '</button>' +
        '</div>' +

      '</div>';

    document.body.appendChild(overlay);
    requestAnimationFrame(function () { overlay.style.opacity = '1'; });

    _obState = {
      lang: lang, steps: steps, cur: 0,
      els: {
        card:    document.getElementById('az-ob-card'),
        counter: document.getElementById('az-ob-counter'),
        dots:    document.getElementById('az-ob-dots'),
        icon:    document.getElementById('az-ob-icon'),
        title:   document.getElementById('az-ob-title'),
        body:    document.getElementById('az-ob-body'),
        skip:    document.getElementById('az-ob-skip'),
        prev:    document.getElementById('az-ob-prev'),
        next:    document.getElementById('az-ob-next')
      }
    };

    function closeOnboard() {
      overlay.style.opacity = '0';
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        _obState = null;
      }, 420);
    }

    _obState.els.next.onclick = function () {
      if (_obState.cur < _obState.steps.length - 1) { _obState.cur++; _renderObStep(_obState.cur); }
      else closeOnboard();
    };
    _obState.els.prev.onclick = function () {
      if (_obState.cur > 0) { _obState.cur--; _renderObStep(_obState.cur); }
    };
    _obState.els.skip.onclick = closeOnboard;
    document.getElementById('az-ob-x').onclick = closeOnboard;

    _renderObStep(0);
  }

  /* ══════════════════════════════════════════════════════════════════════════
   *  SUPPORT CHAT
   *  Floating button + panel, keyword-matched FAQ responses.
   * ══════════════════════════════════════════════════════════════════════════ */
  var _CHAT_TXT = {
    en: {
      title: 'Support Assistant', sub: 'Platform questions',
      placeholder: 'Type your question...',
      greeting: 'Hi! 👋 I\'m your support assistant. I can help you find forms, documents, modules and more. Use the quick questions above or type your query.',
      fallback: 'I couldn\'t find a specific answer for that. Try the quick questions above, or write to it@egconnects.com for personalized support.'
    },
    es: {
      title: 'Asistente de Soporte', sub: 'Preguntas sobre la plataforma',
      placeholder: 'Escribe tu pregunta...',
      greeting: '¡Hola! 👋 Soy tu asistente de soporte. Puedo ayudarte a encontrar formularios, documentos, módulos y más. Usa las preguntas rápidas de arriba o escribe tu consulta.',
      fallback: 'No encontré una respuesta específica para eso. Te recomiendo usar las preguntas rápidas de arriba, o escribe a it@egconnects.com para soporte personalizado.'
    }
  };

  var _chatState = null; // { lang, faqs, els:{...} }

  function _renderChatChips() {
    var s = _chatState;
    s.els.chips.innerHTML = '';
    s.faqs.slice(0, 6).forEach(function (faq) {
      var chip = document.createElement('button');
      chip.textContent = faq.label;
      chip.style.cssText =
        'background:#f1f5f9;border:1px solid #e2e8f0;color:#475569;font-size:.71rem;' +
        'padding:4px 10px;border-radius:20px;cursor:pointer;white-space:nowrap;transition:background .12s;';
      chip.onmouseenter = function () { chip.style.background = '#e2e8f0'; };
      chip.onmouseleave = function () { chip.style.background = '#f1f5f9'; };
      chip.onclick = function () {
        _postChatMsg(faq.label.replace(/^.+?\s/, ''), true);
        _postChatMsg(faq.answer, false);
      };
      s.els.chips.appendChild(chip);
    });
  }

  function _postChatMsg(text, isUser) {
    var msgs = _chatState.els.msgs;
    var wrap = document.createElement('div');
    wrap.style.cssText =
      'display:flex;' + (isUser ? 'justify-content:flex-end' : 'justify-content:flex-start');
    var bubble = document.createElement('div');
    bubble.style.cssText =
      'max-width:84%;padding:9px 13px;font-size:.83rem;line-height:1.58;word-break:break-word;border-radius:' +
      (isUser
        ? '14px 14px 4px 14px;background:#2563eb;color:#fff;'
        : '14px 14px 14px 4px;background:#f1f5f9;color:#1e293b;');
    bubble.textContent = text;
    wrap.appendChild(bubble);
    if (!isUser) {
      wrap.style.opacity = '0';
      setTimeout(function () {
        wrap.style.transition = 'opacity .3s';
        wrap.style.opacity    = '1';
      }, 360);
    }
    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;
    return bubble;
  }

  /** Update the chat widget's language (and optionally its FAQ set) after init. */
  function updateChatLang(lang, faqs) {
    if (!_chatState) return;
    lang = (lang === 'en') ? 'en' : 'es';
    _chatState.lang = lang;
    if (faqs) _chatState.faqs = faqs;
    var t = _CHAT_TXT[lang];
    _chatState.els.title.textContent = t.title;
    _chatState.els.sub.textContent   = t.sub;
    _chatState.els.inp.placeholder   = t.placeholder;
    if (_chatState.els.greetingBubble) {
      _chatState.els.greetingBubble.textContent = t.greeting;
    }
    _renderChatChips();
  }

  function initChat(faqs, lang) {
    if (document.getElementById('az-chat-widget')) return;
    lang = (lang === 'en') ? 'en' : 'es';
    var t = _CHAT_TXT[lang];

    var widget = document.createElement('div');
    widget.id  = 'az-chat-widget';
    widget.style.cssText =
      'position:fixed;bottom:22px;right:22px;z-index:99997;' +
      'font-family:"Inter","Segoe UI",system-ui,sans-serif;';

    widget.innerHTML =
      /* ── panel ── */
      '<div id="az-chat-panel" style="' +
        'width:330px;background:#fff;border-radius:20px;' +
        'box-shadow:0 24px 70px rgba(0,0,0,.22),0 0 0 1px rgba(0,0,0,.05);' +
        'margin-bottom:12px;display:none;flex-direction:column;overflow:hidden;max-height:510px;' +
      '">' +

        /* header */
        '<div style="' +
          'background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);' +
          'padding:14px 16px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;' +
        '">' +
          '<div style="display:flex;align-items:center;gap:11px;">' +
            '<div style="' +
              'width:38px;height:38px;background:rgba(255,255,255,.18);border-radius:50%;' +
              'display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;' +
            '">💬</div>' +
            '<div>' +
              '<div id="az-chat-title" style="color:#fff;font-weight:700;font-size:.88rem;line-height:1.2;">' + t.title + '</div>' +
              '<div id="az-chat-sub" style="color:rgba(255,255,255,.62);font-size:.7rem;margin-top:1px;">' + t.sub + '</div>' +
            '</div>' +
          '</div>' +
          '<button id="az-chat-close-btn" style="' +
            'background:rgba(255,255,255,.15);border:none;color:#fff;width:27px;height:27px;' +
            'border-radius:50%;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;' +
            'transition:background .15s;flex-shrink:0;' +
          '" onmouseenter="this.style.background=\'rgba(255,255,255,.28)\'" ' +
             'onmouseleave="this.style.background=\'rgba(255,255,255,.15)\'">✕</button>' +
        '</div>' +

        /* quick chips */
        '<div id="az-chat-chips" style="' +
          'padding:8px 10px;display:flex;flex-wrap:wrap;gap:5px;' +
          'border-bottom:1px solid #f1f5f9;background:#f8fafc;flex-shrink:0;' +
        '"></div>' +

        /* messages */
        '<div id="az-chat-msgs" style="' +
          'flex:1;overflow-y:auto;padding:13px 13px 7px;' +
          'display:flex;flex-direction:column;gap:10px;' +
        '"></div>' +

        /* input */
        '<div style="' +
          'padding:10px 10px 12px;border-top:1px solid #e2e8f0;' +
          'display:flex;gap:7px;background:#fff;flex-shrink:0;' +
        '">' +
          '<input id="az-chat-inp" type="text" placeholder="' + t.placeholder + '" autocomplete="off" style="' +
            'flex:1;padding:9px 13px;border:1px solid #e2e8f0;border-radius:10px;' +
            'font-size:.83rem;outline:none;font-family:inherit;color:#1e293b;' +
            'transition:border-color .15s;' +
          '" onfocus="this.style.borderColor=\'#93c5fd\'" ' +
             'onblur="this.style.borderColor=\'#e2e8f0\'">' +
          '<button id="az-chat-send-btn" style="' +
            'background:#2563eb;border:none;color:#fff;padding:9px 14px;border-radius:10px;' +
            'cursor:pointer;font-size:15px;transition:background .15s,transform .12s;flex-shrink:0;' +
          '" onmouseenter="this.style.background=\'#1d4ed8\'" ' +
             'onmouseleave="this.style.background=\'#2563eb\'">➤</button>' +
        '</div>' +

      '</div>' +

      /* ── toggle button ── */
      '<button id="az-chat-toggle-btn" style="' +
        'width:52px;height:52px;' +
        'background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);' +
        'border:none;border-radius:50%;' +
        'box-shadow:0 6px 22px rgba(30,64,175,.44);' +
        'cursor:pointer;font-size:21px;display:flex;align-items:center;justify-content:center;' +
        'margin-left:auto;transition:transform .22s,box-shadow .22s;' +
      '" onmouseenter="this.style.transform=\'scale(1.08)\';this.style.boxShadow=\'0 8px 28px rgba(30,64,175,.58)\'" ' +
         'onmouseleave="this.style.transform=\'\';this.style.boxShadow=\'0 6px 22px rgba(30,64,175,.44)\'">💬</button>';

    document.body.appendChild(widget);

    var isOpen    = false;
    var panel     = document.getElementById('az-chat-panel');
    var msgs      = document.getElementById('az-chat-msgs');
    var inp       = document.getElementById('az-chat-inp');
    var toggleBtn = document.getElementById('az-chat-toggle-btn');
    var closeBtn  = document.getElementById('az-chat-close-btn');
    var chipsEl   = document.getElementById('az-chat-chips');

    _chatState = {
      lang: lang, faqs: faqs,
      els: {
        title: document.getElementById('az-chat-title'),
        sub:   document.getElementById('az-chat-sub'),
        inp:   inp,
        msgs:  msgs,
        chips: chipsEl
      }
    };

    _renderChatChips();

    function handleSend() {
      var q = inp.value.trim();
      if (!q) return;
      _postChatMsg(q, true);
      inp.value = '';
      var ql   = q.toLowerCase();
      var curFaqs = _chatState.faqs;
      var hit  = null;
      for (var i = 0; i < curFaqs.length; i++) {
        for (var j = 0; j < curFaqs[i].keywords.length; j++) {
          if (ql.indexOf(curFaqs[i].keywords[j]) !== -1) { hit = curFaqs[i]; break; }
        }
        if (hit) break;
      }
      _postChatMsg(hit ? hit.answer : _CHAT_TXT[_chatState.lang].fallback, false);
    }

    document.getElementById('az-chat-send-btn').onclick = handleSend;
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') handleSend(); });

    toggleBtn.onclick = function () {
      isOpen = !isOpen;
      panel.style.display = isOpen ? 'flex' : 'none';
      if (isOpen && msgs.children.length === 0) {
        _chatState.els.greetingBubble = _postChatMsg(_CHAT_TXT[_chatState.lang].greeting, false);
      }
    };

    closeBtn.onclick = function () {
      isOpen = false;
      panel.style.display = 'none';
    };
  }

  global.AZWidgets = {
    initOnboarding: initOnboarding, updateOnboardingLang: updateOnboardingLang,
    initChat: initChat, updateChatLang: updateChatLang
  };

})(window);
