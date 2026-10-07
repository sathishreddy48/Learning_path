/* ==========================================================================
   anim-snowflake.js — Chapter 7, spending the 64 bits
   --------------------------------------------------------------------------
   The chapter's deep dive is a budget: 41 bits of timestamp, 5 + 5 of machine,
   12 of sequence. Every one of those numbers is a decision with a consequence
   you can compute — how long until the epoch runs out, how many machines you
   can run, how many IDs per millisecond per machine.

   Move the sliders and the consequences update. Generate IDs and watch the
   sequence counter do its job inside a single millisecond, which is the part
   that is hard to see from the diagram alone.
   ========================================================================== */

(function () {
  'use strict';
  var K = window.ANIMKIT;

  K.register('anim-snowflake', function (stage) {
    var state = { ts: 41, dc: 5, worker: 5 };   /* sequence takes what is left */
    var FIELDS = [
      { id: 'sign',   label: 'sign',      color: 'var(--text-faint)' },
      { id: 'ts',     label: 'timestamp', color: 'var(--primary)' },
      { id: 'dc',     label: 'datacentre',color: 'var(--accent)' },
      { id: 'worker', label: 'worker',    color: 'var(--warning-dark)' },
      { id: 'seq',    label: 'sequence',  color: 'var(--success-dark)' }
    ];

    var clockMs = 0;      /* simulated clock */
    var seq = 0;
    var issued = [];      /* recent IDs, newest first */

    stage.innerHTML =
      '<div class="anim-sliders">' +
        slider('ts', 'Timestamp bits', 32, 48) +
        slider('dc', 'Datacentre bits', 0, 10) +
        slider('worker', 'Worker bits', 0, 10) +
      '</div>' +
      '<div data-out="svg"></div>' +
      '<dl class="anim-readout">' +
        K.stat('Sequence bits', 'seqbits') +
        K.stat('Epoch lasts', 'epoch') +
        K.stat('Machines', 'machines') +
        K.stat('IDs per ms per machine', 'rate') +
      '</dl>' +
      '<div class="anim-controls">' +
        K.btn('one', '+ 1 ID', 'primary') +
        K.btn('burst', '+ 8 IDs in the same ms', 'primary') +
        K.btn('tick', 'Advance clock 1 ms') +
        '<span class="anim-spacer"></span>' +
        K.btn('reset', 'Reset') +
      '</div>' +
      '<div class="anim-track"><h4>Issued IDs — newest first</h4><div data-out="ids"></div></div>' +
      '<p class="anim-note" data-out="note"></p>';

    function slider(name, label, lo, hi) {
      return '<label class="anim-slider">' +
        '<span class="anim-slider-label">' + K.esc(label) + '</span>' +
        '<input type="range" min="' + lo + '" max="' + hi + '" data-slider="' + name + '">' +
        '<output data-out="val' + name + '"></output>' +
      '</label>';
    }

    var o = K.outs(stage);

    function seqBits() { return 63 - state.ts - state.dc - state.worker; }

    function widths() {
      return { sign: 1, ts: state.ts, dc: state.dc, worker: state.worker, seq: seqBits() };
    }

    /* ---- the bit-budget bar ---------------------------------------------- */
    var W = 660, H = 92;
    function draw() {
      var w = widths();
      var parts = [];
      var x = 10, usable = W - 20;
      var perBit = usable / 64;

      FIELDS.forEach(function (f) {
        var bits = w[f.id];
        if (bits <= 0) return;
        var bw = bits * perBit;
        parts.push(K.t('rect', { x: x, y: 24, width: Math.max(bw - 1.5, 1), height: 30, rx: 3,
          fill: f.color, opacity: f.id === 'sign' ? '.35' : '.75' }));
        if (bw > 34) {
          parts.push(K.t('text', { x: x + bw / 2, y: 44, 'text-anchor': 'middle', 'font-size': 12,
            'font-weight': 700, fill: 'var(--grey-0)' }, String(bits)));
        }
        if (bw > 52) {
          parts.push(K.t('text', { x: x + bw / 2, y: 68, 'text-anchor': 'middle', 'font-size': 10.5,
            fill: f.color, 'font-weight': 600 }, K.esc(f.label)));
        }
        x += bw;
      });

      parts.push(K.t('text', { x: 10, y: 16, 'font-size': 11, 'font-weight': 700,
        fill: 'var(--text-faint)', 'letter-spacing': '.06em' }, '64 BITS, ONE PER COLUMN'));

      if (seqBits() < 0) {
        parts.push(K.t('text', { x: W / 2, y: 86, 'text-anchor': 'middle', 'font-size': 12,
          'font-weight': 700, fill: 'var(--accent-dark)' },
          'Over budget by ' + (-seqBits()) + ' bits — nothing is left for the sequence'));
      }
      return K.svg('0 0 ' + W + ' ' + H, parts.join(''), 'Snowflake 64-bit layout');
    }

    /* ---- id rendering ---------------------------------------------------- */
    function bits(v, n) {
      var s = '';
      for (var i = n - 1; i >= 0; i--) s += ((v / Math.pow(2, i)) & 1) ? '1' : '0';
      return s;
    }

    function renderIds() {
      if (!issued.length) {
        o.ids.innerHTML = '<p class="anim-hint">No IDs yet — press <strong>+ 1 ID</strong>.</p>';
        return;
      }
      var w = widths();
      o.ids.innerHTML = '<div class="anim-idlist">' + issued.slice(0, 8).map(function (id) {
        return '<div class="anim-id">' +
          '<code class="anim-id-bits">' +
            '<span style="color:var(--text-faint)">0</span>' +
            '<span style="color:var(--primary-dark)">' + bits(id.ts, Math.min(w.ts, 12)) + '</span>' +
            (w.dc > 0 ? '<span style="color:var(--accent-dark)">' + bits(id.dc, w.dc) + '</span>' : '') +
            (w.worker > 0 ? '<span style="color:var(--warning-dark)">' + bits(id.worker, w.worker) + '</span>' : '') +
            (w.seq > 0 ? '<span style="color:var(--success-dark)">' + bits(id.seq, Math.min(w.seq, 12)) + '</span>' : '') +
          '</code>' +
          '<span class="anim-id-meta">ms ' + id.ts + ' · seq ' + id.seq + '</span>' +
        '</div>';
      }).join('') + '</div>';
    }

    function fmtDuration(years) {
      if (years >= 1000) return Math.round(years / 1000) + 'k years';
      if (years >= 1) return years.toFixed(years < 10 ? 1 : 0) + ' years';
      return Math.round(years * 365) + ' days';
    }

    function render() {
      var sb = seqBits();
      ['ts', 'dc', 'worker'].forEach(function (k) {
        var el = stage.querySelector('[data-slider="' + k + '"]');
        el.value = state[k];
        o['val' + k].textContent = state[k];
      });

      o.svg.innerHTML = draw();
      o.seqbits.textContent = sb;

      var years = Math.pow(2, state.ts) / (1000 * 60 * 60 * 24 * 365.25);
      o.epoch.textContent = sb < 0 ? '—' : fmtDuration(years);
      o.machines.textContent = Math.pow(2, state.dc + state.worker).toLocaleString();
      o.rate.textContent = sb < 0 ? '—' : Math.pow(2, sb).toLocaleString();

      stage.querySelector('[data-stat="seqbits"]').className = 'anim-stat ' + (sb < 0 ? 'is-bad' : sb < 8 ? '' : 'is-good');

      ['one', 'burst'].forEach(function (a) {
        stage.querySelector('[data-act="' + a + '"]').disabled = sb <= 0;
      });

      renderIds();

      if (sb < 0) {
        o.note.innerHTML = '<strong>The budget does not balance.</strong> The three fields already claim more than ' +
          'the 63 usable bits, so there is nothing left to distinguish two IDs generated in the same millisecond on ' +
          'the same machine. Every field you widen is taken from another one — that is the only real content of this design.';
        return;
      }
      o.note.innerHTML = '<strong>' + state.ts + ' + ' + state.dc + ' + ' + state.worker + ' + ' + sb +
        ' = 63 bits</strong> (the sign bit stays 0 so IDs sort as positive integers). ' +
        'This layout runs ' + Math.pow(2, state.dc + state.worker).toLocaleString() + ' machines, each issuing ' +
        Math.pow(2, sb).toLocaleString() + ' IDs per millisecond, for ' + fmtDuration(years) + ' before the timestamp wraps. ' +
        'Press <strong>+ 8 IDs in the same ms</strong> to watch the sequence counter carry the load while the ' +
        'timestamp stands still — and note what must happen when it runs out.';
    }

    function issue() {
      var sb = seqBits();
      if (sb <= 0) return;
      if (seq >= Math.pow(2, sb)) {
        /* Sequence exhausted inside this millisecond: the generator has no
           choice but to wait for the clock. That stall IS the design. */
        clockMs++;
        seq = 0;
      }
      issued.unshift({ ts: clockMs, dc: 1, worker: 3, seq: seq });
      seq++;
    }

    stage.addEventListener('input', function (e) {
      var k = e.target.getAttribute && e.target.getAttribute('data-slider');
      if (!k) return;
      state[k] = parseInt(e.target.value, 10);
      issued = []; seq = 0;
      render();
    });

    K.onClick(stage, function (b) {
      switch (b.getAttribute('data-act')) {
        case 'one': issue(); break;
        case 'burst': for (var i = 0; i < 8; i++) issue(); break;
        case 'tick': clockMs++; seq = 0; break;
        case 'reset': clockMs = 0; seq = 0; issued = []; break;
        default: return;
      }
      render();
    });

    render();
  });
})();
