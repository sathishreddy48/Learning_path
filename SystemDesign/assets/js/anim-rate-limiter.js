/* ==========================================================================
   anim-rate-limiter.js — interactive explainer for Chapter 4
   --------------------------------------------------------------------------
   Five rate-limiting algorithms, all fed the identical request stream, all
   configured for the same nominal budget (5 requests per 10s window). Because
   the input is shared, the differences you see are the algorithms and nothing
   else.

   The point the chapter makes and this makes visible: a fixed window lets
   through up to 2x the budget across a window boundary. Press "Boundary
   burst" and watch the fixed-window panel accept 10 while the sliding-window
   panels hold the line at 5.

   Time is simulated, not wall-clock, so stepping and replaying are exact.
   No framework, no CDN, works over file://.
   ========================================================================== */

(function () {
  'use strict';

  var MOUNT = 'anim-rate-limiter';

  var LIMIT = 5;          /* requests allowed ... */
  var WINDOW = 10000;     /* ... per this many ms */
  var TICK = 250;         /* ms of simulated time per animation frame */
  var SPAN = 24000;       /* ms of history drawn on the track */

  /* ======================================================================
     algorithms
     --------------------------------------------------------------------
     Each is a factory returning { reset, allow(t), state(t) }. allow(t)
     decides a request arriving at simulated time t. state(t) returns a
     0..1 fullness for the panel gauge plus a short label.
     ====================================================================== */

  var ALGOS = [
    {
      id: 'token',
      name: 'Token bucket',
      /* This gauge shows tokens REMAINING, so a full bar is the healthy
         state — the opposite of every other panel, which shows budget
         consumed. The colour logic below inverts for it. */
      goodWhenFull: true,
      sub: 'Capacity ' + LIMIT + ', refills ' + LIMIT + ' per ' + (WINDOW / 1000) + 's. Allows a burst up to capacity, then paces.',
      make: function () {
        var tokens = LIMIT, last = 0;
        var rate = LIMIT / WINDOW;            /* tokens per ms */
        function refill(t) {
          tokens = Math.min(LIMIT, tokens + (t - last) * rate);
          last = t;
        }
        return {
          reset: function () { tokens = LIMIT; last = 0; },
          allow: function (t) {
            refill(t);
            if (tokens >= 1) { tokens -= 1; return true; }
            return false;
          },
          state: function (t) {
            refill(t);
            return { fill: tokens / LIMIT, label: tokens.toFixed(1) + ' / ' + LIMIT + ' tokens' };
          }
        };
      }
    },
    {
      id: 'leaky',
      name: 'Leaky bucket',
      sub: 'Queue of ' + LIMIT + ', drains at a fixed ' + LIMIT + ' per ' + (WINDOW / 1000) + 's. Smooths output; no bursts at all.',
      make: function () {
        var level = 0, last = 0;
        var leak = LIMIT / WINDOW;
        function drain(t) {
          level = Math.max(0, level - (t - last) * leak);
          last = t;
        }
        return {
          reset: function () { level = 0; last = 0; },
          allow: function (t) {
            drain(t);
            if (level + 1 <= LIMIT) { level += 1; return true; }
            return false;
          },
          state: function (t) {
            drain(t);
            return { fill: level / LIMIT, label: level.toFixed(1) + ' / ' + LIMIT + ' queued' };
          }
        };
      }
    },
    {
      id: 'fixed',
      name: 'Fixed window counter',
      sub: 'One counter per clock-aligned ' + (WINDOW / 1000) + 's window. Cheap — but see what a boundary burst does.',
      flaw: true,
      make: function () {
        var windowStart = 0, count = 0;
        function roll(t) {
          var w = Math.floor(t / WINDOW) * WINDOW;
          if (w !== windowStart) { windowStart = w; count = 0; }
        }
        return {
          reset: function () { windowStart = 0; count = 0; },
          allow: function (t) {
            roll(t);
            if (count < LIMIT) { count++; return true; }
            return false;
          },
          state: function (t) {
            roll(t);
            return { fill: count / LIMIT, label: count + ' / ' + LIMIT + ' this window' };
          }
        };
      }
    },
    {
      id: 'slidinglog',
      name: 'Sliding window log',
      sub: 'Keeps a timestamp per accepted request. Exact, but memory grows with traffic.',
      make: function () {
        var log = [];
        function evict(t) {
          while (log.length && log[0] <= t - WINDOW) log.shift();
        }
        return {
          reset: function () { log = []; },
          allow: function (t) {
            evict(t);
            if (log.length < LIMIT) { log.push(t); return true; }
            return false;
          },
          state: function (t) {
            evict(t);
            return { fill: log.length / LIMIT, label: log.length + ' / ' + LIMIT + ' in last ' + (WINDOW / 1000) + 's' };
          }
        };
      }
    },
    {
      id: 'slidingcount',
      name: 'Sliding window counter',
      sub: 'Current window plus a weighted slice of the previous one. Two counters, close to exact.',
      make: function () {
        var curStart = 0, cur = 0, prev = 0;
        function roll(t) {
          var w = Math.floor(t / WINDOW) * WINDOW;
          if (w === curStart) return;
          prev = (w - curStart === WINDOW) ? cur : 0;   /* a gap of >1 window clears history */
          cur = 0;
          curStart = w;
        }
        function estimate(t) {
          roll(t);
          var intoWindow = (t - curStart) / WINDOW;
          return prev * (1 - intoWindow) + cur;
        }
        return {
          reset: function () { curStart = 0; cur = 0; prev = 0; },
          allow: function (t) {
            if (estimate(t) + 1 <= LIMIT) { cur++; return true; }
            return false;
          },
          state: function (t) {
            var e = estimate(t);
            return { fill: e / LIMIT, label: e.toFixed(1) + ' / ' + LIMIT + ' estimated' };
          }
        };
      }
    }
  ];

  /* ======================================================================
     scenarios — the request patterns you can send
     ====================================================================== */
  var SCENARIOS = {
    trickle: {
      label: 'Steady trickle',
      hint: '1 request every 2s — comfortably inside the budget. Every algorithm accepts all of it.',
      build: function (t0) {
        var out = [];
        for (var i = 0; i < 6; i++) out.push(t0 + i * 2000);
        return out;
      }
    },
    burst: {
      label: 'Burst of 10',
      hint: '10 requests at once. Token bucket spends its whole burst allowance; leaky bucket paces; the window algorithms cut off at ' + LIMIT + '.',
      build: function (t0) {
        var out = [];
        for (var i = 0; i < 10; i++) out.push(t0 + i * 60);
        return out;
      }
    },
    boundary: {
      label: 'Boundary burst',
      hint: 'The chapter’s trap: ' + LIMIT + ' requests just before a window boundary and ' + LIMIT + ' just after. The fixed window lets through ' + (LIMIT * 2) + ' in barely over a second — double the budget. The sliding-window algorithms do not.',
      build: function (t0) {
        /* line the burst up on the next clock-aligned boundary */
        var edge = (Math.floor(t0 / WINDOW) + 1) * WINDOW;
        var out = [];
        for (var i = 0; i < LIMIT; i++) out.push(edge - 600 + i * 60);
        for (var j = 0; j < LIMIT; j++) out.push(edge + 60 + j * 60);
        return out;
      }
    }
  };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }

  /* ======================================================================
     mount
     ====================================================================== */
  function mount(fig) {
    var stage = fig.querySelector('[data-anim-stage]');
    if (!stage) return;

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var now = 0;              /* simulated clock, ms */
    var pending = [];         /* request arrival times not yet processed */
    var events = [];          /* { t, results: { algoId: bool } } */
    var running = false;
    var raf = null;
    var limiters = {};
    var lastHint = 'Pick a traffic pattern and send it. Every panel sees the same requests.';

    ALGOS.forEach(function (a) { limiters[a.id] = a.make(); });

    stage.innerHTML =
      '<div class="anim-controls">' +
        '<button type="button" class="anim-btn primary" data-send="trickle">Send steady trickle</button>' +
        '<button type="button" class="anim-btn primary" data-send="burst">Send burst of 10</button>' +
        '<button type="button" class="anim-btn primary" data-send="boundary">Send boundary burst</button>' +
        '<span class="anim-spacer"></span>' +
        '<button type="button" class="anim-btn" data-act="step">Step 1s</button>' +
        '<button type="button" class="anim-btn" data-act="play">' + (reduceMotion ? 'Run' : 'Pause') + '</button>' +
        '<button type="button" class="anim-btn" data-act="reset">Reset</button>' +
      '</div>' +
      '<div class="anim-track">' +
        '<h4>Shared request stream — <span data-out="clock">0.0s</span></h4>' +
        '<div data-out="track"></div>' +
      '</div>' +
      '<div class="anim-panels" data-out="panels"></div>' +
      '<p class="anim-note" data-out="hint"></p>';

    var outs = {};
    Array.prototype.forEach.call(stage.querySelectorAll('[data-out]'), function (el) {
      outs[el.getAttribute('data-out')] = el;
    });

    /* ---- the shared stream track ---------------------------------------- */
    var TW = 660, TH = 54;

    function renderTrack() {
      var t1 = Math.max(now, SPAN);
      var t0 = t1 - SPAN;
      function x(t) { return 8 + ((t - t0) / SPAN) * (TW - 16); }

      var p = ['<svg class="anim-svg" viewBox="0 0 ' + TW + ' ' + TH + '" role="img" aria-label="Request arrivals over time">'];

      /* window boundaries — the thing the fixed-window counter resets on */
      var firstEdge = Math.ceil(t0 / WINDOW) * WINDOW;
      for (var e = firstEdge; e <= t1; e += WINDOW) {
        p.push('<line x1="' + x(e).toFixed(1) + '" y1="4" x2="' + x(e).toFixed(1) + '" y2="' + (TH - 14) + '" ' +
          'stroke="var(--text-faint)" stroke-width="1" stroke-dasharray="3 3"/>');
        p.push('<text x="' + x(e).toFixed(1) + '" y="' + (TH - 3) + '" text-anchor="middle" font-size="9" fill="var(--text-faint)">' +
          (e / 1000) + 's</text>');
      }

      /* baseline */
      p.push('<line x1="8" y1="' + (TH - 16) + '" x2="' + (TW - 8) + '" y2="' + (TH - 16) + '" stroke="var(--border-strong)" stroke-width="1"/>');

      /* arrivals: a tick per request, green where a majority accepted */
      events.forEach(function (ev) {
        if (ev.t < t0) return;
        var accepted = 0;
        ALGOS.forEach(function (a) { if (ev.results[a.id]) accepted++; });
        var col = accepted === ALGOS.length ? 'var(--success-dark)' : accepted === 0 ? 'var(--accent-dark)' : 'var(--warning-dark)';
        p.push('<line x1="' + x(ev.t).toFixed(1) + '" y1="' + (TH - 16) + '" x2="' + x(ev.t).toFixed(1) + '" y2="10" ' +
          'stroke="' + col + '" stroke-width="2.5" opacity=".85"/>');
      });

      /* queued-but-not-yet-arrived requests */
      pending.forEach(function (t) {
        if (t > t1) return;
        p.push('<line x1="' + x(t).toFixed(1) + '" y1="' + (TH - 16) + '" x2="' + x(t).toFixed(1) + '" y2="20" ' +
          'stroke="var(--text-faint)" stroke-width="2" stroke-dasharray="2 2"/>');
      });

      /* the now marker */
      p.push('<line x1="' + x(now).toFixed(1) + '" y1="2" x2="' + x(now).toFixed(1) + '" y2="' + (TH - 14) + '" ' +
        'stroke="var(--text)" stroke-width="1.5"/>');
      p.push('</svg>');
      outs.track.innerHTML = p.join('');
    }

    /* ---- one panel per algorithm ---------------------------------------- */
    function renderPanels() {
      outs.panels.innerHTML = ALGOS.map(function (a) {
        var st = limiters[a.id].state(now);
        var ok = 0, no = 0;
        events.forEach(function (ev) { if (ev.results[a.id]) ok++; else no++; });

        var fill = Math.max(0, Math.min(1, st.fill));
        var col = a.goodWhenFull
          ? (fill <= 0.001 ? 'var(--accent-dark)' : fill < 0.3 ? 'var(--warning-dark)' : 'var(--primary-dark)')
          : (fill >= 1 ? 'var(--accent-dark)' : fill > 0.7 ? 'var(--warning-dark)' : 'var(--primary-dark)');

        /* per-window accept tally, which is what makes the fixed-window flaw
           legible: look for a window that accepted more than the limit */
        var worst = worstWindow(a.id);

        return '<div class="anim-panel">' +
          '<h4>' + esc(a.name) +
            '<span class="panel-score"><span class="ok">' + ok + ' ok</span> · <span class="no">' + no + ' 429</span></span>' +
          '</h4>' +
          '<p class="panel-sub">' + esc(a.sub) + '</p>' +
          '<svg class="anim-svg" viewBox="0 0 200 34" role="img" aria-label="' + esc(a.name + ': ' + st.label) + '">' +
            '<rect x="0" y="4" width="200" height="12" rx="6" fill="var(--bg-sunken)" stroke="var(--border-strong)" stroke-width="1"/>' +
            '<rect x="0" y="4" width="' + (fill * 200).toFixed(1) + '" height="12" rx="6" fill="' + col + '" opacity=".75"/>' +
            '<text x="0" y="30" font-size="10.5" fill="var(--text-muted)">' + esc(st.label) + '</text>' +
            (worst > LIMIT
              ? '<text x="200" y="30" text-anchor="end" font-size="10.5" font-weight="700" fill="var(--accent-dark)">' +
                 worst + ' in one ' + (WINDOW / 1000) + 's span</text>'
              : '') +
          '</svg>' +
        '</div>';
      }).join('');
    }

    /* The largest number this algorithm let through in any WINDOW-long span.
       For a correct limiter this never exceeds LIMIT; the fixed window does. */
    function worstWindow(algoId) {
      var ts = events.filter(function (ev) { return ev.results[algoId]; }).map(function (ev) { return ev.t; });
      var worst = 0;
      for (var i = 0; i < ts.length; i++) {
        var c = 0;
        for (var j = i; j < ts.length; j++) if (ts[j] - ts[i] < WINDOW) c++;
        if (c > worst) worst = c;
      }
      return worst;
    }

    function render() {
      outs.clock.textContent = (now / 1000).toFixed(1) + 's';
      renderTrack();
      renderPanels();
      outs.hint.innerHTML = lastHint;
      stage.querySelector('[data-act="play"]').textContent = running ? 'Pause' : 'Run';
    }

    /* ---- the simulated clock -------------------------------------------- */
    function advance(ms) {
      var target = now + ms;
      /* process every pending arrival in order, at its own timestamp */
      pending.sort(function (a, b) { return a - b; });
      while (pending.length && pending[0] <= target) {
        var t = pending.shift();
        now = t;
        var results = {};
        ALGOS.forEach(function (a) { results[a.id] = limiters[a.id].allow(now); });
        events.push({ t: now, results: results });
      }
      now = target;
      /* keep history bounded */
      var cutoff = now - SPAN * 2;
      events = events.filter(function (ev) { return ev.t >= cutoff; });
    }

    function loop() {
      if (!running) return;
      advance(TICK);
      render();
      if (!pending.length && !running) return;
      raf = window.setTimeout(loop, 60);
    }

    function setRunning(on) {
      running = on;
      if (raf) { window.clearTimeout(raf); raf = null; }
      if (on) loop(); else render();
    }

    /* ---- interaction ---------------------------------------------------- */
    stage.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('button') : null;
      if (!b || b.disabled) return;

      var send = b.getAttribute('data-send');
      if (send && SCENARIOS[send]) {
        var sc = SCENARIOS[send];
        /* start the pattern a little ahead of now so you can see it arrive */
        pending = pending.concat(sc.build(now + 500));
        lastHint = '<strong>' + esc(sc.label) + ':</strong> ' + sc.hint;
        if (!running) setRunning(true); else render();
        return;
      }

      switch (b.getAttribute('data-act')) {
        case 'step':
          setRunning(false);
          advance(1000);
          render();
          break;
        case 'play':
          setRunning(!running);
          break;
        case 'reset':
          setRunning(false);
          now = 0; pending = []; events = [];
          ALGOS.forEach(function (a) { limiters[a.id].reset(); });
          lastHint = 'Pick a traffic pattern and send it. Every panel sees the same requests.';
          render();
          break;
        default: break;
      }
    });

    /* Pause while off-screen: no point animating what nobody is looking at. */
    var wasRunning = false;
    if (window.IntersectionObserver) {
      new window.IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            if (wasRunning) setRunning(true);
          } else {
            wasRunning = running;
            if (running) setRunning(false);
          }
        });
      }, { threshold: 0.05 }).observe(fig);
    }

    render();
    /* Reduced motion: wait for an explicit Run or Step rather than ticking. */
    if (!reduceMotion) setRunning(true);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var fig = document.querySelector('[data-anim="' + MOUNT + '"]');
    if (fig) mount(fig);
  });
})();
