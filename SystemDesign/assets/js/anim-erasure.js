/* ==========================================================================
   anim-erasure.js — Chapter 24, erasure coding against replication
   --------------------------------------------------------------------------
   The chapter's claim is that erasure coding buys better durability for less
   storage, and pays for it in reconstruction cost. All three halves of that
   are worth seeing.

   Reed-Solomon (k, m) splits an object into k data shards and computes m
   parity shards. Any k of the k+m shards reconstruct the object — it does not
   matter which. So the scheme survives any m failures, using (k+m)/k times the
   raw bytes, where 3x replication survives 2 failures using 3x the bytes.

   Kill nodes and watch the object survive or not.
   ========================================================================== */

(function () {
  'use strict';
  var K = window.ANIMKIT;

  K.register('anim-erasure', function (stage) {
    var state = { mode: 'ec', k: 4, m: 2, dead: {} };

    stage.innerHTML =
      '<div class="anim-controls">' +
        K.seg('Scheme', [
          { id: 'ec',  label: 'Erasure coding' },
          { id: 'rep', label: '3x replication' }
        ], 'ec') +
        '<span class="anim-spacer"></span>' +
        K.btn('revive', 'Bring everything back') +
      '</div>' +
      '<div class="anim-sliders" data-ec-only>' +
        slider('k', 'Data shards (k)', 2, 8) +
        slider('m', 'Parity shards (m)', 1, 4) +
      '</div>' +
      '<dl class="anim-readout">' +
        K.stat('Storage overhead', 'overhead') +
        K.stat('Survives up to', 'survives') +
        K.stat('Nodes down', 'down') +
        K.stat('Object', 'status') +
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

    function shards() {
      if (state.mode === 'rep') {
        return [
          { label: 'copy 1', kind: 'data' },
          { label: 'copy 2', kind: 'data' },
          { label: 'copy 3', kind: 'data' }
        ];
      }
      var out = [];
      for (var i = 0; i < state.k; i++) out.push({ label: 'd' + (i + 1), kind: 'data' });
      for (var j = 0; j < state.m; j++) out.push({ label: 'p' + (j + 1), kind: 'parity' });
      return out;
    }

    function deadCount() {
      return Object.keys(state.dead).filter(function (i) { return state.dead[i]; }).length;
    }

    function alive() { return shards().length - deadCount(); }

    /* Replication needs any 1 copy; erasure coding needs any k shards. */
    function needed() { return state.mode === 'rep' ? 1 : state.k; }
    function readable() { return alive() >= needed(); }

    function draw() {
      var sh = shards();
      var parts = [];
      var sw = Math.min(84, (W - 40) / sh.length);
      var x0 = (W - sw * sh.length) / 2;

      parts.push(K.t('text', { x: 12, y: 20, 'font-size': 11, 'font-weight': 700,
        fill: 'var(--text-faint)', 'letter-spacing': '.06em' },
        'ONE OBJECT, SPREAD OVER ' + sh.length + ' FAILURE DOMAINS — CLICK TO KILL'));

      sh.forEach(function (s, i) {
        var dead = !!state.dead[i];
        var x = x0 + i * sw;
        var color = s.kind === 'parity' ? 'var(--accent)' : 'var(--primary)';
        parts.push(K.t('rect', {
          x: x + 5, y: 38, width: sw - 10, height: 56, rx: 6,
          fill: dead ? 'var(--bg-sunken)' : (s.kind === 'parity' ? 'var(--accent-lightest)' : 'var(--primary-lightest)'),
          stroke: dead ? 'var(--border-strong)' : color,
          'stroke-width': 2, 'stroke-dasharray': dead ? '4 3' : null,
          opacity: dead ? .55 : 1,
          'data-shard': i, style: 'cursor:pointer'
        }));
        parts.push(K.t('text', {
          x: x + sw / 2, y: 64, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700,
          fill: dead ? 'var(--text-faint)' : color, 'pointer-events': 'none'
        }, K.esc(s.label)));
        parts.push(K.t('text', {
          x: x + sw / 2, y: 81, 'text-anchor': 'middle', 'font-size': 9,
          fill: 'var(--text-faint)', 'pointer-events': 'none'
        }, dead ? 'DOWN' : s.kind));
      });

      var ok = readable();
      parts.push(K.t('text', {
        x: W / 2, y: H - 14, 'text-anchor': 'middle', 'font-size': 12.5, 'font-weight': 700,
        fill: ok ? 'var(--success-dark)' : 'var(--accent-dark)'
      }, ok
        ? K.esc(alive() + ' of ' + sh.length + ' alive — any ' + needed() + ' is enough, the object reconstructs')
        : K.esc('only ' + alive() + ' alive, ' + needed() + ' needed — the object is unrecoverable')));

      return K.svg('0 0 ' + W + ' ' + H, parts.join(''), 'Shard layout, ' + alive() + ' alive');
    }

    function render() {
      ['k', 'm'].forEach(function (key) {
        var el = stage.querySelector('[data-slider="' + key + '"]');
        el.value = state[key];
        o['val' + key].textContent = state[key];
      });
      stage.querySelector('[data-ec-only]').style.display = state.mode === 'ec' ? '' : 'none';

      var sh = shards();
      /* drop kill marks that no longer refer to a shard */
      Object.keys(state.dead).forEach(function (i) { if (+i >= sh.length) delete state.dead[i]; });

      var overhead = state.mode === 'rep' ? 3 : (state.k + state.m) / state.k;
      var tolerate = state.mode === 'rep' ? 2 : state.m;

      o.overhead.textContent = overhead.toFixed(2).replace(/\.00$/, '') + '×';
      o.survives.textContent = tolerate + ' failure' + (tolerate === 1 ? '' : 's');
      o.down.textContent = deadCount();
      o.status.textContent = readable() ? 'readable' : 'lost';

      stage.querySelector('[data-stat="status"]').className = 'anim-stat ' + (readable() ? 'is-good' : 'is-bad');
      stage.querySelector('[data-stat="overhead"]').className =
        'anim-stat ' + (overhead <= 1.5 ? 'is-good' : overhead >= 3 ? 'is-bad' : '');

      Array.prototype.forEach.call(stage.querySelectorAll('[data-pick]'), function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-pick') === state.mode ? 'true' : 'false');
      });

      o.svg.innerHTML = draw();

      if (!readable()) {
        o.note.innerHTML = '<strong>Lost.</strong> ' + (state.mode === 'rep'
          ? 'All three copies are gone. Replication tolerates two failures and no more — the third costs you the object.'
          : 'Fewer than k = ' + state.k + ' shards survive, so there are not enough equations to solve for the original ' +
            'data. Erasure coding degrades sharply rather than gracefully: at k surviving shards everything is fine, ' +
            'at k−1 the object is simply gone.');
        return;
      }

      if (state.mode === 'rep') {
        o.note.innerHTML = '<strong>3× replication.</strong> Three whole copies: 200% storage overhead to survive two ' +
          'failures. What you buy for that is simplicity — a read is a read from any one node, and recovery is a ' +
          'straight copy. That matters more than it sounds: there is no decode step on the read path at all.';
      } else {
        var saved = Math.round((1 - ((state.k + state.m) / state.k) / 3) * 100);
        o.note.innerHTML = '<strong>Reed-Solomon (' + state.k + ', ' + state.m + ').</strong> Any ' + state.k +
          ' of the ' + (state.k + state.m) + ' shards reconstruct the object — it does not matter which, parity shards ' +
          'are as good as data shards. That gives ' + state.m + '-failure tolerance for ' +
          ((state.k + state.m) / state.k).toFixed(2).replace(/\.00$/, '') + '× storage' +
          (saved > 0 ? ', about <strong>' + saved + '% less than 3× replication</strong>' : '') + '. ' +
          'The bill arrives on reads and repairs: rebuilding one lost shard means fetching <strong>' + state.k +
          '</strong> shards from ' + state.k + ' different nodes and decoding, where replication just copies one file. ' +
          'That is why the chapter reaches for erasure coding on cold, large objects and replication on hot, small ones.';
      }
    }

    stage.addEventListener('input', function (e) {
      var k = e.target.getAttribute && e.target.getAttribute('data-slider');
      if (!k) return;
      state[k] = parseInt(e.target.value, 10);
      render();
    });

    stage.addEventListener('click', function (e) {
      var sid = e.target.getAttribute && e.target.getAttribute('data-shard');
      if (sid === null || sid === undefined) return;
      state.dead[sid] = !state.dead[sid];
      render();
    });

    K.onClick(stage, function (b) {
      var pick = b.getAttribute('data-pick');
      if (pick) { state.mode = pick; state.dead = {}; render(); return; }
      if (b.getAttribute('data-act') === 'revive') { state.dead = {}; render(); }
    });

    render();
  });
})();
