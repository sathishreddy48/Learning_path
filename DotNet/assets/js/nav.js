/* ==========================================================================
   nav.js — builds the sidebar from CURRICULUM.groups (one menu per group)
   --------------------------------------------------------------------------
   Every page carries <body data-root=""> (root) or data-root="../" (topics/).
   The sidebar is generated from a plain JS object rather than fetched, so
   the site works over file://. Visited state comes from visited.js.
   ========================================================================== */

(function () {
  'use strict';

  var C = window.CURRICULUM;
  var V = window.VISITED;
  if (!C || !V) return;

  var root = document.body.getAttribute('data-root') || '';
  var currentTopic = document.body.getAttribute('data-topic') || '';
  var currentGroup = '';
  C.groups.forEach(function (g) {
    g.topics.forEach(function (t) { if (t.id === currentTopic) currentGroup = g.id; });
  });

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }

  /* Collapsed groups are remembered per browser; the group holding the current
     topic is always expanded so the active item is visible. */
  var COLLAPSE_KEY = 'learningPath.v1.collapsedGroups';
  function loadCollapsed() {
    try { return JSON.parse(window.localStorage.getItem(COLLAPSE_KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function saveCollapsed(state) {
    try { window.localStorage.setItem(COLLAPSE_KEY, JSON.stringify(state)); } catch (e) { /* Safari file:// */ }
  }
  var collapsed = loadCollapsed();


  function itemHtml(t, i) {
    var visited = V.isVisited(t.id);
    var active = t.id === currentTopic;
    var cls = 'nav-item' + (active ? ' active' : '') + (visited ? ' visited' : '');
    return '<li><a class="' + cls + '" href="' + root + t.href + '" data-topic-id="' + esc(t.id) + '"' +
      (visited ? ' title="Visited"' : '') + '>' +
      '<span class="nav-num"><span>' + (i + 1) + '</span></span>' +
      '<span class="nav-label">' + esc(t.label) + '</span></a></li>';
  }

  function footHtml() {
    var n = V.count(), total = C.topics.length;
    var pct = total ? Math.round(n / total * 100) : 0;
    return '<div class="nav-progress">Visited <strong>' + n + '</strong> of ' + total + ' topics' +
      '<span class="progress-bar"><span class="progress-fill" style="width:' + pct + '%"></span></span></div>' +
      '<button type="button" class="btn btn-sm btn-danger" data-reset-visited>Reset visited topics</button>';
  }

  function groupHtml(g) {
    var visitedHere = g.topics.filter(function (t) { return V.isVisited(t.id); }).length;
    var isOpen = !collapsed[g.id] || g.id === currentGroup;
    return '<div class="nav-group nav-group-menu' + (isOpen ? ' open' : '') + '" data-group="' + esc(g.id) + '">' +
      '<button type="button" class="nav-group-toggle" aria-expanded="' + (isOpen ? 'true' : 'false') + '" data-toggle-group="' + esc(g.id) + '">' +
        '<span class="nav-group-caret" aria-hidden="true">▸</span>' +
        '<span class="nav-group-label">' + esc(g.label) + '</span>' +
        '<span class="nav-group-count" title="Visited in this group">' + visitedHere + '/' + g.topics.length + '</span>' +
      '</button>' +
      '<ul>' + g.topics.map(function (t) { return itemHtml(t, C.topics.indexOf(t)); }).join('') + '</ul>' +
      '</div>';
  }

  function build() {
    var isHome = !currentTopic;
    var html = '' +
      '<div class="brand">' +
        '<a href="' + root + 'index.html">' +
          '<span class="brand-title">' + esc(C.meta.title) + '</span>' +
          '<span class="brand-sub">' + esc(C.meta.subtitle) + '</span>' +
        '</a>' +
        '<button class="nav-toggle nav-close" type="button" aria-label="Close menu">✕</button>' +
      '</div>' +
      '<div class="nav-group"><ul><li><a class="nav-item' + (isHome ? ' active' : '') + '" href="' + root + 'index.html">' +
        '<span class="nav-num"><span>⌂</span></span><span class="nav-label">Dashboard</span></a></li></ul></div>' +
      C.groups.map(groupHtml).join('') +
      '<div class="nav-foot">' + footHtml() + '</div>';
    return html;
  }

  var sb = document.createElement('nav');
  sb.className = 'sidebar';
  sb.setAttribute('aria-label', 'Topics');
  sb.innerHTML = build();

  var layout = document.querySelector('.layout');
  if (!layout) return;
  layout.insertBefore(sb, layout.firstChild);

  var scrim = document.createElement('div');
  scrim.className = 'nav-scrim';
  layout.appendChild(scrim);

  /* ---- mobile topbar --------------------------------------------------- */
  var main = document.querySelector('.main');
  if (main) {
    var bar = document.createElement('div');
    bar.className = 'topbar';
    var h1 = main.querySelector('h1');
    bar.innerHTML = '<button class="nav-toggle" type="button" data-open-nav aria-label="Open menu">☰ Topics</button>' +
      '<span class="topbar-title">' + esc(h1 ? h1.textContent.trim() : C.meta.title) + '</span>';
    main.insertBefore(bar, main.firstChild);
  }

  function setDrawer(open) {
    sb.classList.toggle('open', open);
    scrim.classList.toggle('show', open);
  }
  document.addEventListener('click', function (e) {
    var el = e.target;
    if (!el.closest) return;
    if (el.closest('[data-open-nav]')) { setDrawer(true); return; }
    if (el.closest('.nav-close')) { setDrawer(false); return; }
    if (el === scrim) { setDrawer(false); return; }
    if (el.closest('.sidebar a')) { setDrawer(false); }
    var tg = el.closest('[data-toggle-group]');
    if (tg) {
      var gid = tg.getAttribute('data-toggle-group');
      var box = tg.closest('.nav-group-menu');
      var open = !box.classList.contains('open');
      box.classList.toggle('open', open);
      tg.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) delete collapsed[gid]; else collapsed[gid] = true;
      saveCollapsed(collapsed);
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setDrawer(false);
  });

  /* ---- reset (sidebar button and any [data-reset-visited] on the page) -- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-reset-visited]') : null;
    if (!b) return;
    var n = V.count();
    if (!n) { window.alert('No topics are marked as visited yet.'); return; }
    if (window.confirm('Clear the visited mark on all ' + n + ' topic' + (n === 1 ? '' : 's') + '?')) {
      V.reset();
      // The page we are on will re-mark itself on the next load; keep the
      // sidebar honest right now by not re-marking until then.
    }
  });

  /* ---- live refresh whenever visited state changes ---------------------- */
  document.addEventListener('visited:change', function () {
    Array.prototype.forEach.call(sb.querySelectorAll('.nav-item[data-topic-id]'), function (a) {
      a.classList.toggle('visited', V.isVisited(a.getAttribute('data-topic-id')));
    });
    C.groups.forEach(function (g) {
      var el = sb.querySelector('.nav-group-menu[data-group="' + g.id + '"] .nav-group-count');
      if (el) el.textContent = g.topics.filter(function (t) { return V.isVisited(t.id); }).length + '/' + g.topics.length;
    });
    var foot = sb.querySelector('.nav-foot');
    if (foot) foot.innerHTML = footHtml();
  });

  /* ---- prev / next pager on topic pages ---------------------------------- */
  if (currentTopic && main) {
    var idx = -1;
    C.topics.forEach(function (t, i) { if (t.id === currentTopic) idx = i; });
    if (idx >= 0) {
      var prev = C.topics[idx - 1], next = C.topics[idx + 1];
      var pager = document.createElement('div');
      pager.className = 'pager';
      pager.innerHTML =
        (prev ? '<a class="prev" href="' + root + prev.href + '"><span>← Previous</span>' + esc(prev.label) + '</a>' : '<span></span>') +
        (next ? '<a class="next" href="' + root + next.href + '"><span>Next →</span>' + esc(next.label) + '</a>'
              : '<a class="next" href="' + root + 'index.html"><span>Done</span>Back to dashboard</a>');
      var foot = main.querySelector('.footer-note');
      if (foot) main.insertBefore(pager, foot); else main.appendChild(pager);
    }
  }
})();
