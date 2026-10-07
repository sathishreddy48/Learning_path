/* ==========================================================================
   anim-kit.js — the small shared base every interactive explainer sits on
   --------------------------------------------------------------------------
   Loaded once per page, before any explainer module. Gives them a common
   mount path, an error boundary, visibility handling and a few string
   helpers, so each module is only the thing it actually explains.

   No framework, no CDN, works over file://.
   ========================================================================== */

(function () {
  'use strict';

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }

  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* Mount an explainer into the <figure data-anim="name"> the build injected.
     setup(stage, fig, kit) does the work; anything it throws is contained to
     that one figure, so a bug in one explainer cannot blank a chapter. */
  function register(name, setup) {
    function go() {
      var fig = document.querySelector('[data-anim="' + name + '"]');
      if (!fig) return;
      var stage = fig.querySelector('[data-anim-stage]');
      if (!stage) return;
      try {
        setup(stage, fig, api);
      } catch (e) {
        stage.innerHTML = '<p class="anim-fallback">This interactive explainer could not start. ' +
          'The surrounding text and diagrams carry the same information.</p>';
        if (window.console && window.console.error) window.console.error('[anim:' + name + ']', e);
      }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
    else go();
  }

  /* Run onShow/onHide as the figure scrolls in and out of view, so a ticking
     simulation is not burning CPU for a figure nobody is looking at. */
  function onVisible(el, onShow, onHide) {
    if (!window.IntersectionObserver) { onShow(); return; }
    new window.IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) onShow(); else onHide(); });
    }, { threshold: 0.05 }).observe(el);
  }

  /* Delegated clicks on the stage: handler(button, data) for any <button>. */
  function onClick(stage, handler) {
    stage.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('button') : null;
      if (!b || b.disabled || !stage.contains(b)) return;
      handler(b, e);
    });
  }

  /* Collect every [data-out] node once, by name. */
  function outs(stage) {
    var o = {};
    Array.prototype.forEach.call(stage.querySelectorAll('[data-out]'), function (el) {
      o[el.getAttribute('data-out')] = el;
    });
    return o;
  }

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function pct(n, d) { return d ? Math.round((n / d) * 100) : 0; }

  /* An SVG element as a string. attrs values are used verbatim, so they may
     be CSS var(...) references — which is how these stay theme-aware. */
  function t(name, attrs, inner) {
    var s = '<' + name;
    for (var k in attrs) {
      if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
      if (attrs[k] === null || attrs[k] === undefined || attrs[k] === false) continue;
      s += ' ' + k + '="' + attrs[k] + '"';
    }
    return inner === undefined || inner === null
      ? s + '/>'
      : s + '>' + inner + '</' + name + '>';
  }

  function svg(viewBox, inner, label) {
    return t('svg', {
      class: 'anim-svg',
      viewBox: viewBox,
      role: 'img',
      'aria-label': label ? esc(label) : null
    }, inner);
  }

  /* Standard control-bar pieces, so every explainer's chrome matches. */
  function btn(act, label, cls) {
    return '<button type="button" class="anim-btn' + (cls ? ' ' + cls : '') +
      '" data-act="' + act + '">' + label + '</button>';
  }
  function seg(group, options, current) {
    return '<span class="anim-seg" role="group" aria-label="' + esc(group) + '">' +
      options.map(function (o) {
        return '<button type="button" data-pick="' + esc(o.id) + '" aria-pressed="' +
          (o.id === current ? 'true' : 'false') + '">' + o.label + '</button>';
      }).join('') + '</span>';
  }
  function stat(label, name, cls) {
    return '<div class="anim-stat' + (cls ? ' ' + cls : '') + '" data-stat="' + name + '">' +
      '<dt>' + esc(label) + '</dt><dd data-out="' + name + '">—</dd></div>';
  }

  var api = {
    esc: esc,
    reduceMotion: reduceMotion,
    register: register,
    onVisible: onVisible,
    onClick: onClick,
    outs: outs,
    clamp: clamp,
    pct: pct,
    t: t,
    svg: svg,
    btn: btn,
    seg: seg,
    stat: stat
  };

  window.ANIMKIT = api;
})();
