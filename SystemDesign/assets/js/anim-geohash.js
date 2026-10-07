/* ==========================================================================
   anim-geohash.js — Chapter 16, geohash precision and the boundary problem
   --------------------------------------------------------------------------
   Geohash turns 2-D position into a 1-D string by interleaving the bits of
   latitude and longitude, so a shared prefix means "in the same cell". That
   makes proximity search a prefix query, which any key-value store can do.

   It also creates the failure the chapter spends a page on: two points a metre
   apart can sit either side of a cell edge and share no prefix at all. Drag the
   two pins across a boundary and watch the shared prefix collapse to nothing
   while the actual distance barely changes.
   ========================================================================== */

(function () {
  'use strict';
  var K = window.ANIMKIT;

  var BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';   /* no a, i, l, o */

  /* Standard geohash encode over a normalised 0..1 square, which is all the
     geometry we need for the argument. */
  function encode(x, y, chars) {
    var lo = [0, 0], hi = [1, 1];     /* [lon, lat] */
    var bits = '', out = '';
    var even = true;
    while (out.length < chars) {
      var i = even ? 0 : 1;
      var v = even ? x : y;
      var mid = (lo[i] + hi[i]) / 2;
      if (v >= mid) { bits += '1'; lo[i] = mid; } else { bits += '0'; hi[i] = mid; }
      even = !even;
      if (bits.length === 5) { out += BASE32[parseInt(bits, 2)]; bits = ''; }
    }
    return out;
  }

  /* The cell a point falls in, at a given character precision. */
  function cell(x, y, chars) {
    var lo = [0, 0], hi = [1, 1];
    var n = chars * 5, even = true;
    for (var b = 0; b < n; b++) {
      var i = even ? 0 : 1;
      var v = even ? x : y;
      var mid = (lo[i] + hi[i]) / 2;
      if (v >= mid) lo[i] = mid; else hi[i] = mid;
      even = !even;
    }
    return { x0: lo[0], x1: hi[0], y0: lo[1], y1: hi[1] };
  }

  function sharedPrefix(a, b) {
    var n = 0;
    while (n < a.length && n < b.length && a[n] === b[n]) n++;
    return n;
  }

  K.register('anim-geohash', function (stage) {
    var state = {
      precision: 4,
      a: { x: 0.455, y: 0.540 },
      b: { x: 0.530, y: 0.520 },
      drag: null
    };

    stage.innerHTML =
      '<div class="anim-controls">' +
        '<div class="anim-slider" style="max-width:17rem">' +
          '<span class="anim-slider-label">Precision (characters)</span>' +
          '<input type="range" min="1" max="6" data-slider="precision">' +
          '<output data-out="valprecision"></output>' +
        '</div>' +
        '<span class="anim-spacer"></span>' +
        K.btn('straddle', 'Put them across a boundary', 'danger') +
        K.btn('together', 'Put them together') +
      '</div>' +
      '<dl class="anim-readout">' +
        K.stat('Pin A geohash', 'ga') +
        K.stat('Pin B geohash', 'gb') +
        K.stat('Shared prefix', 'shared') +
        K.stat('Actual distance', 'dist') +
      '</dl>' +
      '<div data-out="svg"></div>' +
      '<p class="anim-note" data-out="note"></p>';

    var o = K.outs(stage);
    var S = 300, PAD = 14, W = 660, H = S + 2 * PAD;
    var OX = (W - S) / 2;

    function toPx(p) { return { x: OX + p.x * S, y: PAD + (1 - p.y) * S }; }
    function toUnit(px, py) {
      return { x: K.clamp((px - OX) / S, 0.001, 0.999), y: K.clamp(1 - (py - PAD) / S, 0.001, 0.999) };
    }

    function draw() {
      var p = state.precision;
      var parts = [];

      /* grid at the current precision: cells are 2^(ceil(5p/2)) across */
      var bitsX = Math.ceil(p * 5 / 2), bitsY = Math.floor(p * 5 / 2);
      var nx = Math.pow(2, bitsX), ny = Math.pow(2, bitsY);

      parts.push(K.t('rect', { x: OX, y: PAD, width: S, height: S, rx: 4,
        fill: 'var(--bg-sunken)', stroke: 'var(--border-strong)', 'stroke-width': 1.5 }));

      if (nx <= 64 && ny <= 64) {
        for (var i = 1; i < nx; i++) {
          parts.push(K.t('line', { x1: OX + (i / nx) * S, y1: PAD, x2: OX + (i / nx) * S, y2: PAD + S,
            stroke: 'var(--border-strong)', 'stroke-width': .6, opacity: .55 }));
        }
        for (var j = 1; j < ny; j++) {
          parts.push(K.t('line', { x1: OX, y1: PAD + (j / ny) * S, x2: OX + S, y2: PAD + (j / ny) * S,
            stroke: 'var(--border-strong)', 'stroke-width': .6, opacity: .55 }));
        }
      }

      /* each pin's cell */
      [['a', 'var(--primary)'], ['b', 'var(--accent)']].forEach(function (pair) {
        var c = cell(state[pair[0]].x, state[pair[0]].y, p);
        parts.push(K.t('rect', {
          x: OX + c.x0 * S, y: PAD + (1 - c.y1) * S,
          width: (c.x1 - c.x0) * S, height: (c.y1 - c.y0) * S,
          fill: pair[1], opacity: .16, stroke: pair[1], 'stroke-width': 2
        }));
      });

      /* line between the pins */
      var pa = toPx(state.a), pb = toPx(state.b);
      parts.push(K.t('line', { x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y,
        stroke: 'var(--text-faint)', 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }));

      [['a', pa, 'var(--primary)', 'A'], ['b', pb, 'var(--accent)', 'B']].forEach(function (q) {
        parts.push(K.t('circle', { cx: q[1].x, cy: q[1].y, r: 9, fill: q[2],
          stroke: 'var(--surface)', 'stroke-width': 2.5, 'data-pin': q[0], style: 'cursor:grab' }));
        parts.push(K.t('text', { x: q[1].x, y: q[1].y + 4, 'text-anchor': 'middle',
          'font-size': 10, 'font-weight': 700, fill: 'var(--grey-0)', 'pointer-events': 'none' }, q[3]));
      });

      parts.push(K.t('text', { x: OX, y: H - 1, 'font-size': 10.5, fill: 'var(--text-faint)' },
        'Drag either pin'));

      return K.svg('0 0 ' + W + ' ' + H, parts.join(''), 'Geohash cells at precision ' + p);
    }

    function render() {
      var p = state.precision;
      stage.querySelector('[data-slider="precision"]').value = p;
      o.valprecision.textContent = p;

      var ga = encode(state.a.x, state.a.y, p);
      var gb = encode(state.b.x, state.b.y, p);
      var shared = sharedPrefix(ga, gb);
      var d = Math.hypot(state.a.x - state.b.x, state.a.y - state.b.y);
      /* treat the square as ~500 km on a side so the distance reads naturally */
      var km = d * 500;

      o.ga.textContent = ga;
      o.gb.textContent = gb;
      o.shared.textContent = shared + ' / ' + p + ' char' + (p === 1 ? '' : 's');
      o.dist.textContent = km < 1 ? Math.round(km * 1000) + ' m' : km.toFixed(1) + ' km';
      o.svg.innerHTML = draw();

      var sameCell = shared === p;
      stage.querySelector('[data-stat="shared"]').className = 'anim-stat ' + (sameCell ? 'is-good' : shared === 0 ? 'is-bad' : '');

      if (sameCell) {
        o.note.innerHTML = '<strong>Same cell.</strong> Both pins share all ' + p + ' characters, so a prefix query on ' +
          '<code>' + K.esc(ga) + '</code> finds both. This is the case the design is built for — proximity has become ' +
          'a string prefix, and any key-value store can answer it.';
      } else if (shared === 0) {
        o.note.innerHTML = '<strong>This is the boundary problem.</strong> The pins are ' +
          (km < 1 ? Math.round(km * 1000) + ' m' : km.toFixed(1) + ' km') + ' apart but share <strong>no prefix at all</strong>, ' +
          'because the split that separates them happens at the very first bit. A prefix query from A simply does not ' +
          'contain B. Geohash length bounds how far apart two points in a cell can be — it promises nothing about how ' +
          'close two points in different cells are. The fix in the chapter is to query the cell <em>and its eight ' +
          'neighbours</em>, which is why every production implementation ships a neighbour function.';
      } else {
        o.note.innerHTML = '<strong>Adjacent cells.</strong> The pins agree on ' + shared + ' of ' + p + ' characters, ' +
          'so they are near each other in the index but a strict ' + p + '-character prefix query still misses one of ' +
          'them. Shorten the precision and they merge into one cell — at the cost of a much larger search radius.';
      }
    }

    /* ---- dragging -------------------------------------------------------- */
    function pointerPos(e, svgEl) {
      var r = svgEl.getBoundingClientRect();
      var cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      var cy = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
      return { x: (cx / r.width) * W, y: (cy / r.height) * H };
    }

    function startDrag(e) {
      var pin = e.target.getAttribute && e.target.getAttribute('data-pin');
      var svgEl = stage.querySelector('svg');
      if (!svgEl) return;
      if (!pin) {
        /* clicking the map moves whichever pin is nearer */
        var q = pointerPos(e, svgEl);
        var u = toUnit(q.x, q.y);
        pin = Math.hypot(u.x - state.a.x, u.y - state.a.y) <= Math.hypot(u.x - state.b.x, u.y - state.b.y) ? 'a' : 'b';
        if (q.x < OX || q.x > OX + S || q.y < PAD || q.y > PAD + S) return;
        state[pin] = u;
        render();
      }
      state.drag = pin;
      e.preventDefault();
    }

    function moveDrag(e) {
      if (!state.drag) return;
      var svgEl = stage.querySelector('svg');
      if (!svgEl) return;
      var q = pointerPos(e, svgEl);
      state[state.drag] = toUnit(q.x, q.y);
      render();
      e.preventDefault();
    }

    function endDrag() { state.drag = null; }

    stage.addEventListener('mousedown', startDrag);
    stage.addEventListener('touchstart', startDrag, { passive: false });
    window.addEventListener('mousemove', moveDrag);
    window.addEventListener('touchmove', moveDrag, { passive: false });
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchend', endDrag);

    stage.addEventListener('input', function (e) {
      if (!e.target.getAttribute || e.target.getAttribute('data-slider') !== 'precision') return;
      state.precision = parseInt(e.target.value, 10);
      render();
    });

    K.onClick(stage, function (b) {
      switch (b.getAttribute('data-act')) {
        case 'straddle':
          /* sit the pair either side of the prime meridian split, which is the
             very first bit — the worst case the chapter warns about */
          state.a = { x: 0.4985, y: 0.52 };
          state.b = { x: 0.5015, y: 0.52 };
          break;
        case 'together': {
          /* Place both pins well inside one cell AT THE CURRENT PRECISION, so
             the button keeps demonstrating the good case as the slider moves
             (a fixed pair of coordinates stops sharing a cell as soon as the
             cells get smaller than the gap between them). */
          var c = cell(0.3456, 0.6543, state.precision);
          var w = c.x1 - c.x0, h = c.y1 - c.y0;
          state.a = { x: c.x0 + w * 0.3, y: c.y0 + h * 0.35 };
          state.b = { x: c.x0 + w * 0.7, y: c.y0 + h * 0.65 };
          break;
        }
        default: return;
      }
      render();
    });

    render();
  });
})();
