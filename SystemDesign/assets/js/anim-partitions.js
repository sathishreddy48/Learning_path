/* ==========================================================================
   anim-partitions.js — Chapter 19, partitions, consumer groups, rebalancing
   --------------------------------------------------------------------------
   Two facts about this design surprise people, and both are visible once you
   can move the sliders:

     1. The partition count is a hard ceiling on consumer parallelism. Add more
        consumers than partitions and the extra ones sit idle forever — adding
        hardware buys literally nothing.
     2. Ordering is per partition, not per topic. Keys hash to partitions, so
        two messages for the same key stay ordered; two messages for different
        keys do not.

   Add and remove consumers and watch the assignment rebalance.
   ========================================================================== */

(function () {
  'use strict';
  var K = window.ANIMKIT;

  K.register('anim-partitions', function (stage) {
    var state = { partitions: 6, consumers: 3, groups: 1, rebalances: 0 };

    stage.innerHTML =
      '<div class="anim-sliders">' +
        slider('partitions', 'Partitions in the topic', 1, 10) +
        slider('consumers', 'Consumers in the group', 1, 10) +
      '</div>' +
      '<dl class="anim-readout">' +
        K.stat('Effective parallelism', 'par') +
        K.stat('Idle consumers', 'idle') +
        K.stat('Partitions per consumer', 'per') +
        K.stat('Rebalances so far', 'rb') +
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
    var W = 660, H = 230;

    /* Round-robin assignment, which is what the range/round-robin assignors
       converge to for an evenly keyed topic. A partition has at most one
       consumer in a group; a consumer may hold several. */
    function assign() {
      var map = [];
      for (var p = 0; p < state.partitions; p++) {
        map.push(state.consumers ? p % state.consumers : -1);
      }
      return map;
    }

    var COLORS = ['#2fae9e', '#f2795a', '#5b9bd5', '#d4a02c', '#a579d0', '#41b06e',
                  '#d96a92', '#8fa3b5', '#c98b3a', '#6fb3a0'];

    function draw() {
      var map = assign();
      var parts = [];
      var pw = Math.min(88, (W - 40) / state.partitions);
      var px0 = (W - pw * state.partitions) / 2;
      var cw = Math.min(88, (W - 40) / state.consumers);
      var cx0 = (W - cw * state.consumers) / 2;
      var yP = 46, yC = 168;

      parts.push(K.t('text', { x: 12, y: 20, 'font-size': 11, 'font-weight': 700,
        fill: 'var(--text-faint)', 'letter-spacing': '.06em' }, 'TOPIC PARTITIONS'));
      parts.push(K.t('text', { x: 12, y: H - 6, 'font-size': 11, 'font-weight': 700,
        fill: 'var(--text-faint)', 'letter-spacing': '.06em' }, 'CONSUMER GROUP'));

      /* links first so boxes sit on top */
      for (var p = 0; p < state.partitions; p++) {
        var c = map[p];
        if (c < 0) continue;
        var x1 = px0 + p * pw + pw / 2;
        var x2 = cx0 + c * cw + cw / 2;
        parts.push(K.t('path', {
          d: 'M ' + x1 + ' ' + (yP + 38) + ' C ' + x1 + ' ' + (yP + 80) + ', ' +
             x2 + ' ' + (yC - 60) + ', ' + x2 + ' ' + (yC - 14),
          fill: 'none', stroke: COLORS[c % COLORS.length], 'stroke-width': 1.8, opacity: .8
        }));
      }

      for (var q = 0; q < state.partitions; q++) {
        var owner = map[q];
        var x = px0 + q * pw;
        parts.push(K.t('rect', { x: x + 4, y: yP, width: pw - 8, height: 38, rx: 5,
          fill: 'var(--bg-sunken)', stroke: COLORS[owner % COLORS.length],
          'stroke-width': 2 }));
        parts.push(K.t('text', { x: x + pw / 2, y: yP + 17, 'text-anchor': 'middle',
          'font-size': 11, 'font-weight': 700, fill: 'var(--text)' }, 'P' + q));
        parts.push(K.t('text', { x: x + pw / 2, y: yP + 31, 'text-anchor': 'middle',
          'font-size': 9, fill: 'var(--text-faint)' }, 'ordered'));
      }

      for (var c2 = 0; c2 < state.consumers; c2++) {
        var owned = map.filter(function (m) { return m === c2; }).length;
        var cx = cx0 + c2 * cw;
        var idle = owned === 0;
        parts.push(K.t('rect', { x: cx + 4, y: yC - 14, width: cw - 8, height: 38, rx: 5,
          fill: idle ? 'var(--accent-lightest)' : 'var(--surface)',
          stroke: idle ? 'var(--accent)' : COLORS[c2 % COLORS.length],
          'stroke-width': 2, 'stroke-dasharray': idle ? '4 3' : null }));
        parts.push(K.t('text', { x: cx + cw / 2, y: yC + 3, 'text-anchor': 'middle',
          'font-size': 11, 'font-weight': 700,
          fill: idle ? 'var(--accent-dark)' : 'var(--text)' }, 'C' + c2));
        parts.push(K.t('text', { x: cx + cw / 2, y: yC + 17, 'text-anchor': 'middle',
          'font-size': 9, fill: idle ? 'var(--accent-dark)' : 'var(--text-faint)' },
          idle ? 'IDLE' : owned + ' partition' + (owned === 1 ? '' : 's')));
      }

      return K.svg('0 0 ' + W + ' ' + H, parts.join(''),
        state.partitions + ' partitions across ' + state.consumers + ' consumers');
    }

    function render() {
      ['partitions', 'consumers'].forEach(function (k) {
        var el = stage.querySelector('[data-slider="' + k + '"]');
        el.value = state[k];
        o['val' + k].textContent = state[k];
      });

      var idle = Math.max(0, state.consumers - state.partitions);
      var par = Math.min(state.consumers, state.partitions);
      o.par.textContent = par + ' of ' + state.consumers;
      o.idle.textContent = idle;
      o.per.textContent = (state.partitions / Math.min(state.consumers, state.partitions)).toFixed(1);
      o.rb.textContent = state.rebalances;

      stage.querySelector('[data-stat="idle"]').className = 'anim-stat ' + (idle ? 'is-bad' : 'is-good');
      o.svg.innerHTML = draw();

      if (idle > 0) {
        o.note.innerHTML = '<strong>' + idle + ' consumer' + (idle === 1 ? '' : 's') + ' can never receive anything.</strong> ' +
          'A partition is assigned to at most one consumer in a group, so the partition count is a hard ceiling on ' +
          'parallelism — with ' + state.partitions + ' partitions, consumer number ' + (state.partitions + 1) + ' onwards ' +
          'sits idle no matter how much hardware you add. Scaling a consumer group means <em>repartitioning the topic</em>, ' +
          'and because partition count usually cannot be reduced without breaking key ordering, this is a decision ' +
          'that is far easier to get right up front than to fix later.';
      } else if (state.partitions % state.consumers !== 0) {
        o.note.innerHTML = '<strong>Uneven assignment.</strong> ' + state.partitions + ' partitions do not divide across ' +
          state.consumers + ' consumers, so some consumers hold one more than others and will lag under equal load. ' +
          'Keeping the partition count a multiple of the expected consumer count is the cheap fix. Note also that each ' +
          'partition is independently ordered — the topic as a whole has no total order, which is why the key you ' +
          'partition on decides what "in order" actually means for you.';
      } else {
        o.note.innerHTML = '<strong>Balanced.</strong> Each consumer owns ' + (state.partitions / state.consumers) +
          ' partition' + (state.partitions / state.consumers === 1 ? '' : 's') + ' and the group is at full parallelism. ' +
          'Every change here — a consumer joining, leaving, or just missing a heartbeat — triggers a <em>rebalance</em>, ' +
          'during which the whole group stops consuming. That stop-the-world pause is why the chapter cares so much ' +
          'about session timeouts: too short and ordinary GC pauses cause spurious rebalances.';
      }
    }

    stage.addEventListener('input', function (e) {
      var k = e.target.getAttribute && e.target.getAttribute('data-slider');
      if (!k) return;
      state[k] = parseInt(e.target.value, 10);
      state.rebalances++;    /* any membership or topic change forces one */
      render();
    });

    render();
  });
})();
