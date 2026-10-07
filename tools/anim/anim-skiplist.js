/* ==========================================================================
   anim-skiplist.js — Chapter 25, the skip list behind a sorted set
   --------------------------------------------------------------------------
   Redis sorted sets are the chapter's answer, and a skip list is what makes
   them work. The idea is worth seeing move: express lanes above the base list
   let a search skip most of it, giving O(log n) lookup from a structure that
   is only a linked list with extra pointers — no rebalancing, no rotations.

   Search for a score and watch the path: across at the top until the next node
   would overshoot, then drop a level, repeat. The comparison count against a
   plain scan is the whole argument.
   ========================================================================== */

(function () {
  'use strict';
  var K = window.ANIMKIT;

  K.register('anim-skiplist', function (stage) {
    var SCORES = [];
    for (var si = 0; si < 23; si++) SCORES.push(4 * si + 7);   /* 7, 11, … 95 */

    /* A real skip list picks each node's height by coin flip at insert time,
       giving half the nodes one level, a quarter two, and so on. Here that
       distribution is produced deterministically (height = trailing zero bits
       of the 1-based index) so the picture is stable between renders — the
       shape, and therefore the search cost, is the same as the random case. */
    var MAXLEVEL = 5;
    var LEVELS = SCORES.map(function (_, i) {
      var n = i + 1, lvl = 1;
      while (n % 2 === 0 && lvl < MAXLEVEL) { n /= 2; lvl++; }
      return lvl;
    });

    var state = { target: 67, path: [], compares: 0, found: false, animating: false };

    stage.innerHTML =
      '<div class="anim-controls">' +
        '<label class="anim-input"><span>Find score</span>' +
          '<input type="number" data-target value="67" min="1" max="120" step="1" aria-label="Score to search for">' +
        '</label>' +
        K.btn('search', 'Search', 'primary') +
        '<span class="anim-spacer"></span>' +
        '<span class="anim-hint">23 members · 5 levels</span>' +
      '</div>' +
      '<dl class="anim-readout">' +
        K.stat('Comparisons (skip list)', 'cmp', 'is-good') +
        K.stat('Comparisons (plain scan)', 'scan') +
        K.stat('Average over all 23', 'avg') +
        K.stat('Result', 'result') +
      '</dl>' +
      '<div data-out="svg"></div>' +
      '<p class="anim-note" data-out="note"></p>';

    var o = K.outs(stage);
    var W = 660, LEVEL_H = 36, H = MAXLEVEL * LEVEL_H + 46;

    /* Does node i exist at this level? */
    function atLevel(i, lvl) { return LEVELS[i] >= lvl; }

    /* The classic search: start top-left, move right while the next node's
       score is < target, otherwise drop a level. */
    function search(target) {
      var path = [];            /* { level, from, to } hops */
      var compares = 0;
      var i = -1;               /* -1 is the head sentinel */
      for (var lvl = MAXLEVEL; lvl >= 1; lvl--) {
        while (true) {
          var next = -1;
          for (var j = i + 1; j < SCORES.length; j++) {
            if (atLevel(j, lvl)) { next = j; break; }
          }
          if (next === -1) break;
          compares++;
          if (SCORES[next] < target) {
            path.push({ level: lvl, from: i, to: next, kind: 'across' });
            i = next;
          } else {
            break;
          }
        }
        if (lvl > 1) path.push({ level: lvl, from: i, to: i, kind: 'down' });
      }
      /* one final step right at level 1 to land on (or past) the target */
      var landing = -1;
      for (var k = i + 1; k < SCORES.length; k++) { landing = k; break; }
      if (landing !== -1) {
        compares++;
        path.push({ level: 1, from: i, to: landing, kind: 'across' });
      }
      return {
        path: path,
        compares: compares,
        found: landing !== -1 && SCORES[landing] === target,
        landing: landing
      };
    }

    function nodeX(i) {
      var step = (W - 70) / (SCORES.length + 1);
      return 46 + (i + 1) * step;
    }
    function levelY(lvl) { return 24 + (MAXLEVEL - lvl) * LEVEL_H; }

    function draw(visiblePath) {
      var parts = [];
      var shown = visiblePath || [];
      var acrossSet = {};
      shown.forEach(function (h) { if (h.kind === 'across') acrossSet[h.level + ':' + h.from + ':' + h.to] = true; });
      var visited = {};
      shown.forEach(function (h) { visited[h.to] = true; });

      /* level lanes */
      for (var lvl = MAXLEVEL; lvl >= 1; lvl--) {
        var y = levelY(lvl);
        parts.push(K.t('text', { x: 10, y: y + 4, 'font-size': 10, 'font-weight': 700,
          fill: 'var(--text-faint)' }, 'L' + lvl));

        /* head sentinel */
        parts.push(K.t('rect', { x: 32, y: y - 9, width: 14, height: 18, rx: 3,
          fill: 'var(--bg-sunken)', stroke: 'var(--border-strong)', 'stroke-width': 1 }));

        /* links between consecutive nodes present at this level */
        var prev = -1;
        for (var i = 0; i < SCORES.length; i++) {
          if (!atLevel(i, lvl)) continue;
          var x1 = prev === -1 ? 46 : nodeX(prev);
          var x2 = nodeX(i);
          var hot = acrossSet[lvl + ':' + prev + ':' + i];
          parts.push(K.t('line', { x1: x1, y1: y, x2: x2 - 11, y2: y,
            stroke: hot ? 'var(--primary)' : 'var(--border-strong)',
            'stroke-width': hot ? 3 : 1.2, opacity: hot ? 1 : .6 }));
          if (hot) {
            parts.push(K.t('path', {
              d: 'M ' + (x2 - 17) + ' ' + (y - 4) + ' L ' + (x2 - 11) + ' ' + y + ' L ' + (x2 - 17) + ' ' + (y + 4),
              fill: 'none', stroke: 'var(--primary)', 'stroke-width': 2.5
            }));
          }
          prev = i;
        }

        /* nodes */
        for (var n = 0; n < SCORES.length; n++) {
          if (!atLevel(n, lvl)) continue;
          var isLanding = state.found !== null && visited[n];
          var isTarget = SCORES[n] === state.target && lvl === 1;
          parts.push(K.t('rect', {
            x: nodeX(n) - 10, y: y - 9, width: 20, height: 18, rx: 3,
            fill: isTarget && state.found ? 'var(--success-dark)' : isLanding ? 'var(--primary-lighter)' : 'var(--surface)',
            stroke: isTarget && state.found ? 'var(--success-dark)' : isLanding ? 'var(--primary)' : 'var(--border-strong)',
            'stroke-width': isLanding || isTarget ? 2 : 1
          }));
          if (lvl === 1) {
            parts.push(K.t('text', { x: nodeX(n), y: y + 4, 'text-anchor': 'middle',
              'font-size': 8.5, 'font-weight': 600,
              fill: isTarget && state.found ? 'var(--grey-0)' : 'var(--text-muted)' }, String(SCORES[n])));
          }
        }
      }

      /* vertical "drop a level" hops */
      shown.filter(function (h) { return h.kind === 'down'; }).forEach(function (h) {
        var x = h.from === -1 ? 39 : nodeX(h.from);
        parts.push(K.t('line', { x1: x, y1: levelY(h.level) + 9, x2: x, y2: levelY(h.level - 1) - 9,
          stroke: 'var(--accent)', 'stroke-width': 2.5, 'stroke-dasharray': '3 2' }));
      });

      parts.push(K.t('text', { x: 10, y: H - 6, 'font-size': 10, fill: 'var(--text-faint)' },
        'Solid teal = moved right · dashed coral = dropped a level'));

      return K.svg('0 0 ' + W + ' ' + H, parts.join(''), 'Skip list search for ' + state.target);
    }

    function render(visiblePath) {
      o.svg.innerHTML = draw(visiblePath === undefined ? state.path : visiblePath);
      o.cmp.textContent = state.compares || '—';
      /* a plain scan compares until it reaches or passes the target */
      var scan = 0;
      for (var i = 0; i < SCORES.length; i++) { scan++; if (SCORES[i] >= state.target) break; }
      o.scan.textContent = state.compares ? scan : '—';
      /* The per-search number swings with where the target sits, so also show
         the average over every member — the fair comparison of the two. */
      var sl = 0, pl = 0;
      SCORES.forEach(function (v, i) { sl += search(v).compares; pl += i + 1; });
      o.avg.textContent = (sl / SCORES.length).toFixed(1) + ' vs ' + (pl / SCORES.length).toFixed(1);
      o.result.textContent = !state.compares ? '—' : state.found ? 'found' : 'not present';
      stage.querySelector('[data-stat="result"]').className =
        'anim-stat ' + (!state.compares ? '' : state.found ? 'is-good' : 'is-bad');
    }

    function runSearch() {
      var r = search(state.target);
      state.path = r.path;
      state.compares = r.compares;
      state.found = r.found;

      if (K.reduceMotion) { render(); explain(r); return; }

      /* step the path out so the "across, across, drop" rhythm is visible */
      state.animating = true;
      var i = 0;
      (function step() {
        render(state.path.slice(0, i));
        if (i++ <= state.path.length) {
          window.setTimeout(step, 230);
        } else {
          state.animating = false;
          render();
          explain(r);
        }
      })();
    }

    function explain(r) {
      var scan = 0;
      for (var i = 0; i < SCORES.length; i++) { scan++; if (SCORES[i] >= state.target) break; }
      var saved = scan - r.compares;
      o.note.innerHTML = '<strong>' + r.compares + ' comparisons instead of ' + scan + '.</strong> ' +
        (r.found
          ? 'The search found ' + state.target + ' '
          : state.target + ' is not in the set; the search landed on the first member above it ')
        + 'by running along the sparse upper lanes while they still undershot the target, then dropping a level each ' +
        'time the next hop would overshoot. ' +
        (saved > 0
          ? 'On 23 members the saving is only ' + saved + ' comparison' + (saved === 1 ? '' : 's') + ' — the structure ' +
            'earns its keep at scale, where <strong>log n</strong> against <strong>n</strong> is the difference between ' +
            '20 steps and a million. '
          : 'For a target this near the start a plain scan is just as good; the upper lanes pay off further in. ')
        + 'The reason Redis uses this rather than a balanced tree is that every operation is a few pointer writes — ' +
        'no rotations, no rebalancing — and the same structure also answers <em>rank</em> queries, which is exactly ' +
        'what a leaderboard asks for.';
    }

    stage.addEventListener('input', function (e) {
      if (!e.target.hasAttribute || !e.target.hasAttribute('data-target')) return;
      var v = parseInt(e.target.value, 10);
      if (!isNaN(v)) state.target = K.clamp(v, 1, 120);
    });

    K.onClick(stage, function (b) {
      if (b.getAttribute('data-act') === 'search' && !state.animating) runSearch();
    });

    render([]);
    o.note.innerHTML = 'Pick a score and press <strong>Search</strong>. Watch the path run along the sparse upper ' +
      'lanes and drop a level whenever the next hop would overshoot — that is the entire algorithm.';
  });
})();
