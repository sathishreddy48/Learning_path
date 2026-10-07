/* ==========================================================================
   anim-windows.js — Chapter 21, event time, windows and watermarks
   --------------------------------------------------------------------------
   The chapter's hardest idea is that an event has two timestamps — when it
   happened and when it arrived — and that aggregation must be keyed on the
   first while only the second is observable. Everything else (watermarks, late
   events, the trade between latency and completeness) follows from that gap.

   Each click drops an event whose event time is earlier than its arrival time.
   Drag the watermark lag and watch which events make it into their window and
   which arrive after it has already closed and been reported.
   ========================================================================== */

(function () {
  'use strict';
  var K = window.ANIMKIT;

  K.register('anim-windows', function (stage) {
    var WINDOW = 10;          /* seconds per tumbling window */
    var SPAN = 60;            /* seconds drawn */

    var state = {
      now: 0,                 /* processing time, seconds */
      lag: 4,                 /* watermark lag behind max observed event time */
      events: [],             /* { et, at, late } */
      maxEventTime: 0,
      reported: {}            /* windowIndex -> { count, atTime } */
    };

    stage.innerHTML =
      '<div class="anim-controls">' +
        K.btn('ontime', '+ On-time event', 'primary') +
        K.btn('delayed', '+ Delayed event (3–6s)', 'primary') +
        K.btn('verylate', '+ Event from before the watermark', 'danger') +
        K.btn('advance', 'Advance 2s') +
        '<span class="anim-spacer"></span>' +
        K.btn('reset', 'Reset') +
      '</div>' +
      '<div class="anim-controls">' +
        '<div class="anim-slider" style="max-width:20rem">' +
          '<span class="anim-slider-label">Watermark lag (how long to wait)</span>' +
          '<input type="range" min="0" max="12" data-slider="lag">' +
          '<output data-out="vallag"></output>' +
        '</div>' +
      '</div>' +
      '<dl class="anim-readout">' +
        K.stat('Processing time', 'now') +
        K.stat('Watermark', 'wm') +
        K.stat('Windows closed', 'closed') +
        K.stat('Events dropped as late', 'dropped', 'is-bad') +
      '</dl>' +
      '<div data-out="svg"></div>' +
      '<p class="anim-note" data-out="note"></p>';

    var o = K.outs(stage);
    var W = 660, H = 210;

    /* The watermark asserts "no event with an event time below this will
       arrive again". It is a heuristic, not a fact — which is the point. */
    function watermark() { return Math.max(0, state.maxEventTime - state.lag); }
    function windowOf(t) { return Math.floor(t / WINDOW); }
    function windowClosed(idx) { return watermark() >= (idx + 1) * WINDOW; }

    /* delaySec is how far behind processing time the event happened. Pass an
       explicit eventTime instead when the scenario needs to be relative to the
       watermark rather than to a fixed delay. */
    function addEvent(delaySec, eventTime) {
      var at = state.now;
      var et = eventTime === undefined ? Math.max(0, at - delaySec) : Math.max(0, eventTime);
      var wasClosed = windowClosed(windowOf(et));
      state.events.push({ et: et, at: at, late: wasClosed });
      if (et > state.maxEventTime) state.maxEventTime = et;
      closeWindows();
    }

    /* When the watermark passes a window's end, it is reported once. */
    function closeWindows() {
      for (var i = 0; i <= windowOf(SPAN); i++) {
        if (windowClosed(i) && !state.reported[i]) {
          state.reported[i] = {
            count: state.events.filter(function (e) { return windowOf(e.et) === i && !e.late; }).length,
            at: state.now
          };
        }
      }
    }

    function draw() {
      var parts = [];
      var x = function (t) { return 40 + (t / SPAN) * (W - 60); };
      var yEvent = 110, yAxis = 150;

      /* window bands */
      for (var i = 0; i * WINDOW < SPAN; i++) {
        var closed = windowClosed(i);
        parts.push(K.t('rect', {
          x: x(i * WINDOW), y: 34, width: x(WINDOW) - x(0) - 2, height: 100, rx: 4,
          fill: closed ? 'var(--bg-sunken)' : 'var(--primary-lightest)',
          stroke: closed ? 'var(--border-strong)' : 'var(--primary)',
          'stroke-width': 1, opacity: closed ? .85 : 1
        }));
        var rep = state.reported[i];
        parts.push(K.t('text', {
          x: x(i * WINDOW + WINDOW / 2), y: 50, 'text-anchor': 'middle', 'font-size': 10,
          fill: 'var(--text-faint)', 'font-weight': 600
        }, '[' + (i * WINDOW) + '–' + ((i + 1) * WINDOW) + ')'));
        if (rep) {
          parts.push(K.t('text', {
            x: x(i * WINDOW + WINDOW / 2), y: 72, 'text-anchor': 'middle', 'font-size': 16,
            'font-weight': 700, fill: 'var(--text-muted)'
          }, String(rep.count)));
          parts.push(K.t('text', {
            x: x(i * WINDOW + WINDOW / 2), y: 86, 'text-anchor': 'middle', 'font-size': 8.5,
            fill: 'var(--text-faint)'
          }, 'reported'));
        }
      }

      parts.push(K.t('text', { x: 6, y: 26, 'font-size': 10.5, 'font-weight': 700,
        fill: 'var(--text-faint)', 'letter-spacing': '.05em' }, 'TUMBLING WINDOWS ON EVENT TIME'));

      /* events, drawn at their EVENT time with a tail back to arrival time */
      state.events.forEach(function (e, idx) {
        var jitter = ((idx * 7) % 5) * 4 - 8;
        var ex = x(e.et), ax = x(e.at);
        var y = yEvent + jitter;
        if (ax > ex + 1) {
          parts.push(K.t('line', { x1: ex, y1: y, x2: ax, y2: y,
            stroke: e.late ? 'var(--accent)' : 'var(--text-faint)',
            'stroke-width': 1, 'stroke-dasharray': '2 2', opacity: .8 }));
          parts.push(K.t('circle', { cx: ax, cy: y, r: 2, fill: 'var(--text-faint)' }));
        }
        parts.push(K.t('circle', { cx: ex, cy: y, r: 5,
          fill: e.late ? 'var(--accent)' : 'var(--success-dark)',
          stroke: 'var(--surface)', 'stroke-width': 1.5 }));
      });

      /* axis */
      parts.push(K.t('line', { x1: 40, y1: yAxis, x2: W - 20, y2: yAxis,
        stroke: 'var(--border-strong)', 'stroke-width': 1.5 }));
      for (var s = 0; s <= SPAN; s += WINDOW) {
        parts.push(K.t('line', { x1: x(s), y1: yAxis, x2: x(s), y2: yAxis + 4,
          stroke: 'var(--border-strong)', 'stroke-width': 1 }));
        parts.push(K.t('text', { x: x(s), y: yAxis + 16, 'text-anchor': 'middle',
          'font-size': 9.5, fill: 'var(--text-faint)' }, s + 's'));
      }

      /* watermark and processing-time markers */
      var wm = watermark();
      parts.push(K.t('line', { x1: x(wm), y1: 30, x2: x(wm), y2: yAxis,
        stroke: 'var(--warning-dark)', 'stroke-width': 2.5 }));
      parts.push(K.t('text', { x: x(wm), y: 24, 'text-anchor': 'middle', 'font-size': 10,
        'font-weight': 700, fill: 'var(--warning-dark)' }, 'watermark'));

      parts.push(K.t('line', { x1: x(state.now), y1: 30, x2: x(state.now), y2: yAxis,
        stroke: 'var(--text)', 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }));
      parts.push(K.t('text', { x: x(state.now), y: H - 24, 'text-anchor': 'middle',
        'font-size': 9.5, fill: 'var(--text-muted)' }, 'now'));

      /* legend */
      parts.push(K.t('circle', { cx: 46, cy: H - 8, r: 4, fill: 'var(--success-dark)' }));
      parts.push(K.t('text', { x: 56, y: H - 5, 'font-size': 10, fill: 'var(--text-faint)' }, 'counted'));
      parts.push(K.t('circle', { cx: 122, cy: H - 8, r: 4, fill: 'var(--accent)' }));
      parts.push(K.t('text', { x: 132, y: H - 5, 'font-size': 10, fill: 'var(--text-faint)' },
        'arrived after its window closed'));

      return K.svg('0 0 ' + W + ' ' + H, parts.join(''), 'Event time windows with a watermark');
    }

    function render() {
      stage.querySelector('[data-slider="lag"]').value = state.lag;
      o.vallag.textContent = state.lag + 's';
      o.now.textContent = state.now + 's';
      o.wm.textContent = watermark() + 's';
      o.closed.textContent = Object.keys(state.reported).length;
      var dropped = state.events.filter(function (e) { return e.late; }).length;
      o.dropped.textContent = dropped;
      stage.querySelector('[data-stat="dropped"]').className = 'anim-stat ' + (dropped ? 'is-bad' : 'is-good');

      o.svg.innerHTML = draw();

      /* Nothing has closed yet means there is no window to be late for. */
      var canBeLate = Math.floor(watermark() / WINDOW) - 1 >= 0;
      var lateBtn = stage.querySelector('[data-act="verylate"]');
      lateBtn.disabled = !canBeLate;
      lateBtn.title = canBeLate ? '' : 'No window has closed yet — advance time first';

      var note;
      if (!state.events.length) {
        note = 'Each event carries two times: when it <em>happened</em> (where the dot sits) and when it ' +
          '<em>arrived</em> (the end of the dotted tail). Aggregation has to use the first, but only ever observes ' +
          'the second. Add a few events and move the watermark lag.';
      } else if (dropped) {
        note = '<strong>' + dropped + ' event' + (dropped === 1 ? '' : 's') + ' arrived too late.</strong> ' +
          'Their window had already been closed and its count reported, so including them would mean retracting a ' +
          'number someone has already seen. With a lag of ' + state.lag + 's you are promising to wait that long and ' +
          'no longer. Raise it and these events get counted — at the cost of every result being ' + state.lag +
          's staler. That trade is the entire design space: <strong>completeness against latency</strong>, and there ' +
          'is no setting that gives you both.';
      } else if (state.lag >= 10) {
        note = '<strong>Nothing dropped — but look at the cost.</strong> A ' + state.lag + 's lag means a window is ' +
          'not reported until ' + state.lag + 's after its last second has passed. The dashboard is correct and ' +
          'permanently behind. For ad click billing that may be exactly right; for a real-time dashboard it is not.';
      } else {
        note = 'The watermark sits ' + state.lag + 's behind the newest event time seen. When it crosses a window’s ' +
          'right edge, that window is considered complete and is reported once. Try <strong>+ Very late event</strong> ' +
          'to break that assumption.';
      }
      o.note.innerHTML = note;
    }

    stage.addEventListener('input', function (e) {
      if (!e.target.getAttribute || e.target.getAttribute('data-slider') !== 'lag') return;
      state.lag = parseInt(e.target.value, 10);
      /* Lowering the lag cannot un-report a window, which is itself the lesson:
         once emitted, a result is out in the world. */
      closeWindows();
      render();
    });

    K.onClick(stage, function (b) {
      switch (b.getAttribute('data-act')) {
        case 'ontime': addEvent(0); break;
        case 'delayed': addEvent(3 + Math.floor(Math.random() * 4)); break;
        case 'verylate': {
          /* A window is closed only once the watermark passes its END, so an
             event merely "behind the watermark" is not necessarily late. Aim
             at the middle of the most recent window that has actually closed. */
          var lastClosed = Math.floor(watermark() / WINDOW) - 1;
          if (lastClosed < 0) return;            /* nothing closed yet */
          addEvent(null, lastClosed * WINDOW + WINDOW / 2);
          break;
        }
        case 'advance':
          state.now = Math.min(SPAN, state.now + 2);
          /* time passing alone does not move the watermark — only events do,
             which is why idle streams need a timeout-based advance */
          closeWindows();
          break;
        case 'reset':
          state.now = 0; state.events = []; state.maxEventTime = 0; state.reported = {};
          break;
        default: return;
      }
      render();
    });

    render();
  });
})();
