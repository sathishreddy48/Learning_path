/* ==========================================================================
   anim-quorum.js — Chapter 6, quorum consensus (N, W, R)
   --------------------------------------------------------------------------
   The chapter states the rule W + R > N and leaves it there. The rule is only
   interesting once you can see WHY it holds: with W + R > N the write set and
   the read set must overlap in at least one replica, so a read is guaranteed
   to touch a node that saw the latest write. Drop below it and the sets can be
   disjoint — the read can land entirely on stale replicas.

   Move the sliders and the overlap is drawn directly.
   ========================================================================== */

(function () {
  'use strict';
  var K = window.ANIMKIT;

  K.register('anim-quorum', function (stage) {
    var state = { N: 5, W: 2, R: 2, preset: 'custom' };

    var PRESETS = {
      strong:  { W: 3, R: 3, label: 'Strong consistency' },
      fastw:   { W: 1, R: 5, label: 'Fast writes' },
      fastr:   { W: 5, R: 1, label: 'Fast reads' },
      eventual:{ W: 1, R: 1, label: 'Eventual (Dynamo default)' }
    };

    stage.innerHTML =
      '<div class="anim-controls">' +
        K.seg('Preset', [
          { id: 'strong',   label: 'Strong' },
          { id: 'fastw',    label: 'Fast writes' },
          { id: 'fastr',    label: 'Fast reads' },
          { id: 'eventual', label: 'Eventual' }
        ], '') +
      '</div>' +
      '<div class="anim-sliders">' +
        slider('N', 'Replicas (N)', 1, 7) +
        slider('W', 'Write quorum (W)', 1, 7) +
        slider('R', 'Read quorum (R)', 1, 7) +
      '</div>' +
      '<dl class="anim-readout">' +
        K.stat('W + R', 'sum') +
        K.stat('vs N', 'vsn') +
        K.stat('Guaranteed overlap', 'overlap') +
        K.stat('Tolerates node loss', 'tolerate') +
      '</dl>' +
      '<div data-out="svg"></div>' +
      '<p class="anim-note" data-out="note"></p>';

    function slider(name, label, lo, hi) {
      return '<label class="anim-slider">' +
        '<span class="anim-slider-label">' + K.esc(label) + '</span>' +
        '<input type="range" min="' + lo + '" max="' + hi + '" data-slider="' + name + '">' +
        '<output data-out="val' + name + '"></output>' +
      '</label>';
    }

    var o = K.outs(stage);
    var W = 660, H = 150;

    function draw() {
      var n = state.N, w = state.W, r = state.R;
      var slotW = Math.min(74, (W - 40) / n);
      var x0 = (W - slotW * n) / 2;
      var parts = [];

      parts.push(K.t('text', { x: 12, y: 18, 'font-size': 11, 'font-weight': 700,
        fill: 'var(--text-faint)', 'letter-spacing': '.06em' }, 'REPLICAS'));

      for (var i = 0; i < n; i++) {
        var x = x0 + i * slotW;
        /* Writes go to the first W replicas, reads to the last R. Any
           placement works for the argument; putting them at opposite ends
           makes the overlap (or the gap) as visible as possible. */
        var inW = i < w;
        var inR = i >= n - r;
        var both = inW && inR;

        var fill = both ? 'var(--primary-lighter)' : inW ? 'var(--primary-lightest)'
          : inR ? 'var(--accent-lightest)' : 'var(--bg-sunken)';
        var strokeC = both ? 'var(--primary)' : inW ? 'var(--primary)'
          : inR ? 'var(--accent)' : 'var(--border-strong)';

        parts.push(K.t('rect', { x: x + 5, y: 34, width: slotW - 10, height: 46, rx: 6,
          fill: fill, stroke: strokeC, 'stroke-width': both ? 2.5 : 1.5 }));
        parts.push(K.t('text', { x: x + slotW / 2, y: 62, 'text-anchor': 'middle',
          'font-size': 13, 'font-weight': 600, fill: 'var(--text)' }, 's' + i));
        if (both) {
          parts.push(K.t('text', { x: x + slotW / 2, y: 97, 'text-anchor': 'middle',
            'font-size': 15, fill: 'var(--primary-dark)', 'font-weight': 700 }, '✓'));
        }
      }

      /* write bracket above, read bracket below */
      if (w > 0) {
        parts.push(bracket(x0 + 5, x0 + w * slotW - 5, 28, -1, 'var(--primary)', 'W = ' + w + ' (write set)'));
      }
      if (r > 0) {
        parts.push(bracket(x0 + (n - r) * slotW + 5, x0 + n * slotW - 5, 86, 1, 'var(--accent)', 'R = ' + r + ' (read set)'));
      }

      var overlap = Math.max(0, w + r - n);
      parts.push(K.t('text', { x: W / 2, y: H - 6, 'text-anchor': 'middle', 'font-size': 12,
        'font-weight': 700, fill: overlap > 0 ? 'var(--success-dark)' : 'var(--accent-dark)' },
        overlap > 0
          ? K.esc('Sets overlap in ' + overlap + ' replica' + (overlap === 1 ? '' : 's') + ' — a read must see the latest write')
          : K.esc('Sets can be disjoint — a read can miss the latest write entirely')));

      return K.svg('0 0 ' + W + ' ' + H, parts.join(''),
        'N=' + n + ', W=' + w + ', R=' + r + ', overlap ' + overlap);
    }

    function bracket(xa, xb, y, dir, color, label) {
      var tick = 6 * dir;
      return K.t('path', {
        d: 'M ' + xa + ' ' + (y + tick) + ' L ' + xa + ' ' + y + ' L ' + xb + ' ' + y + ' L ' + xb + ' ' + (y + tick),
        fill: 'none', stroke: color, 'stroke-width': 1.5
      }) + K.t('text', {
        x: (xa + xb) / 2, y: y + (dir < 0 ? -6 : 16), 'text-anchor': 'middle',
        'font-size': 11, 'font-weight': 700, fill: color
      }, K.esc(label));
    }

    function render() {
      /* W and R cannot exceed N */
      state.W = K.clamp(state.W, 1, state.N);
      state.R = K.clamp(state.R, 1, state.N);

      ['N', 'W', 'R'].forEach(function (k) {
        var el = stage.querySelector('[data-slider="' + k + '"]');
        el.max = k === 'N' ? 7 : state.N;
        el.value = state[k];
        o['val' + k].textContent = state[k];
      });

      var sum = state.W + state.R;
      var strong = sum > state.N;
      o.sum.textContent = sum;
      o.vsn.textContent = (strong ? '> ' : sum === state.N ? '= ' : '< ') + state.N;
      o.overlap.textContent = strong ? Math.max(0, sum - state.N) + ' replica' + (sum - state.N === 1 ? '' : 's') : 'none';
      /* A write still needs W nodes up and a read needs R, so the binding
         constraint is whichever quorum is larger. */
      o.tolerate.textContent = (state.N - Math.max(state.W, state.R)) + ' node(s)';

      stage.querySelector('[data-stat="overlap"]').className = 'anim-stat ' + (strong ? 'is-good' : 'is-bad');
      stage.querySelector('[data-stat="vsn"]').className = 'anim-stat ' + (strong ? 'is-good' : 'is-bad');

      o.svg.innerHTML = draw();

      var named = null;
      for (var key in PRESETS) {
        if (PRESETS[key].W === state.W && PRESETS[key].R === state.R && state.N === 5) named = PRESETS[key].label;
      }
      Array.prototype.forEach.call(stage.querySelectorAll('[data-pick]'), function (b) {
        var p = PRESETS[b.getAttribute('data-pick')];
        b.setAttribute('aria-pressed', (state.N === 5 && p.W === state.W && p.R === state.R) ? 'true' : 'false');
      });

      o.note.innerHTML = strong
        ? '<strong>W + R &gt; N' + (named ? ' — ' + K.esc(named) : '') + '.</strong> ' +
          'The write set and the read set cannot be pulled apart: at least one replica is in both, so every read ' +
          'reaches a node that acknowledged the latest write. That is the whole content of the rule — it is ' +
          'pigeonhole, not magic. The cost is latency, because a request waits for the slower of ' +
          state.W + ' writes and ' + state.R + ' reads.'
        : '<strong>W + R ≤ N' + (named ? ' — ' + K.esc(named) : '') + '.</strong> ' +
          'With W = ' + state.W + ' and R = ' + state.R + ' on ' + state.N + ' replicas the two sets can be completely ' +
          'disjoint, so a read can be served entirely by replicas that never saw the write. This is not a bug — it is ' +
          'the eventually-consistent trade Dynamo-style stores make on purpose, which is why they also ship ' +
          'vector clocks and read repair to reconcile afterwards.';
    }

    stage.addEventListener('input', function (e) {
      var k = e.target.getAttribute && e.target.getAttribute('data-slider');
      if (!k) return;
      state[k] = parseInt(e.target.value, 10);
      render();
    });

    K.onClick(stage, function (b) {
      var p = b.getAttribute('data-pick');
      if (p && PRESETS[p]) { state.N = 5; state.W = PRESETS[p].W; state.R = PRESETS[p].R; render(); }
    });

    render();
  });
})();
