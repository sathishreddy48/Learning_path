/* ==========================================================================
   anim-fanout.js — Chapter 11, fan-out on write vs fan-out on read
   --------------------------------------------------------------------------
   This is the pattern the notes return to more than any other, so it is worth
   making concrete. The two strategies move the same total work to opposite
   sides of the system:

     on write  — one post costs F cache writes; a feed read costs 1 lookup
     on read   — one post costs 1 write; a feed read costs F lookups

   Neither is "correct". Which one hurts depends on the follower distribution,
   and the real answer in the chapter is the hybrid: push for ordinary users,
   pull for the celebrity whose fan-out is pathological.

   Post as an ordinary user and then as the celebrity, and the asymmetry does
   the arguing.
   ========================================================================== */

(function () {
  'use strict';
  var K = window.ANIMKIT;

  K.register('anim-fanout', function (stage) {
    /* A small, deliberately skewed social graph — the skew is the point. */
    var USERS = [
      { id: 'ana',   label: 'Ana',       followers: 120,     kind: 'normal' },
      { id: 'ben',   label: 'Ben',       followers: 340,     kind: 'normal' },
      { id: 'cleo',  label: 'Cleo',      followers: 1800,    kind: 'normal' },
      { id: 'star',  label: 'Pop star',  followers: 40000000, kind: 'celeb' }
    ];

    var state = { mode: 'write', totals: reset() };

    function reset() {
      return { posts: 0, feedReads: 0, writeOps: 0, readOps: 0, log: [] };
    }

    stage.innerHTML =
      '<div class="anim-controls">' +
        K.seg('Strategy', [
          { id: 'write',  label: 'Fan-out on write' },
          { id: 'read',   label: 'Fan-out on read' },
          { id: 'hybrid', label: 'Hybrid' }
        ], 'write') +
        '<span class="anim-spacer"></span>' +
        K.btn('reset', 'Reset counters') +
      '</div>' +
      '<div class="anim-controls">' +
        USERS.map(function (u) {
          return '<button type="button" class="anim-btn' + (u.kind === 'celeb' ? ' danger' : '') +
            '" data-post="' + u.id + '">' + K.esc(u.label) + ' posts</button>';
        }).join('') +
        K.btn('read', 'Someone opens their feed') +
      '</div>' +
      '<dl class="anim-readout">' +
        K.stat('Posts', 'posts') +
        K.stat('Write-side ops', 'writeOps') +
        K.stat('Feed opens', 'feedReads') +
        K.stat('Read-side ops', 'readOps') +
      '</dl>' +
      '<div data-out="svg"></div>' +
      '<div class="anim-track"><h4>What each action cost</h4><div data-out="log"></div></div>' +
      '<p class="anim-note" data-out="note"></p>';

    var o = K.outs(stage);
    var W = 660, H = 190;

    function fmt(n) {
      if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
      if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
      if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
      return String(n);
    }

    /* Does this user get pushed, under the current strategy? */
    function isPush(u) {
      if (state.mode === 'write') return true;
      if (state.mode === 'read') return false;
      return u.kind !== 'celeb';        /* hybrid: everyone but the celebrity */
    }

    function post(u) {
      var push = isPush(u);
      state.totals.posts++;
      if (push) {
        state.totals.writeOps += u.followers;
        state.totals.log.unshift({
          who: u.label, text: 'pushed into ' + fmt(u.followers) + ' follower feeds',
          cost: u.followers, side: 'write'
        });
      } else {
        state.totals.writeOps += 1;
        state.totals.log.unshift({
          who: u.label, text: 'wrote 1 row; followers will pull it at read time',
          cost: 1, side: 'write'
        });
      }
    }

    /* Opening a feed costs one lookup per pulled author you follow, plus one
       for the precomputed list. We model a reader who follows everybody. */
    function readFeed() {
      var pulled = USERS.filter(function (u) { return !isPush(u); }).length;
      var ops = 1 + pulled;
      state.totals.feedReads++;
      state.totals.readOps += ops;
      state.totals.log.unshift({
        who: 'Reader', side: 'read', cost: ops,
        text: pulled
          ? '1 precomputed feed read + ' + pulled + ' live pull' + (pulled === 1 ? '' : 's') + ', then a merge'
          : '1 precomputed feed read, already materialised'
      });
    }

    function draw() {
      var parts = [];
      var cx = 90, cy = H / 2;

      parts.push(K.t('text', { x: 12, y: 16, 'font-size': 11, 'font-weight': 700,
        fill: 'var(--text-faint)', 'letter-spacing': '.06em' }, 'WHERE THE WORK HAPPENS'));

      /* author column */
      USERS.forEach(function (u, i) {
        var y = 40 + i * 34;
        var push = isPush(u);
        parts.push(K.t('rect', { x: 14, y: y - 11, width: 108, height: 24, rx: 5,
          fill: push ? 'var(--primary-lightest)' : 'var(--accent-lightest)',
          stroke: push ? 'var(--primary)' : 'var(--accent)', 'stroke-width': 1.5 }));
        parts.push(K.t('text', { x: 24, y: y + 5, 'font-size': 12, fill: 'var(--text)',
          'font-weight': 600 }, K.esc(u.label)));
        parts.push(K.t('text', { x: 116, y: y + 5, 'text-anchor': 'end', 'font-size': 10.5,
          fill: 'var(--text-faint)' }, fmt(u.followers)));

        /* arrow toward whichever side pays */
        var toX = push ? 300 : 300;
        parts.push(K.t('path', {
          d: 'M 126 ' + y + ' L ' + (toX - 6) + ' ' + y,
          stroke: push ? 'var(--primary)' : 'var(--accent)', 'stroke-width': push ? 2 : 1.2,
          'stroke-dasharray': push ? null : '3 3', fill: 'none', 'marker-end': null
        }));
        parts.push(K.t('text', { x: 214, y: y - 4, 'text-anchor': 'middle', 'font-size': 9.5,
          fill: push ? 'var(--primary-dark)' : 'var(--accent-dark)' },
          push ? K.esc('push ×' + fmt(u.followers)) : 'store once'));
      });

      /* the two stores */
      parts.push(K.t('rect', { x: 300, y: 32, width: 150, height: 120, rx: 8,
        fill: 'var(--bg-sunken)', stroke: 'var(--border-strong)', 'stroke-width': 1.5 }));
      parts.push(K.t('text', { x: 375, y: 54, 'text-anchor': 'middle', 'font-size': 11.5,
        'font-weight': 700, fill: 'var(--text-muted)' }, 'Feed cache'));
      parts.push(K.t('text', { x: 375, y: 72, 'text-anchor': 'middle', 'font-size': 10,
        fill: 'var(--text-faint)' }, 'precomputed per user'));
      parts.push(K.t('text', { x: 375, y: 106, 'text-anchor': 'middle', 'font-size': 20,
        'font-weight': 700, fill: 'var(--primary-dark)' }, fmt(state.totals.writeOps)));
      parts.push(K.t('text', { x: 375, y: 124, 'text-anchor': 'middle', 'font-size': 10,
        fill: 'var(--text-faint)' }, 'write-side ops'));

      /* reader */
      parts.push(K.t('rect', { x: 500, y: 60, width: 146, height: 66, rx: 8,
        fill: 'var(--bg-alt)', stroke: 'var(--border-strong)', 'stroke-width': 1.5 }));
      parts.push(K.t('text', { x: 573, y: 82, 'text-anchor': 'middle', 'font-size': 11.5,
        'font-weight': 700, fill: 'var(--text-muted)' }, 'Feed read'));
      parts.push(K.t('text', { x: 573, y: 106, 'text-anchor': 'middle', 'font-size': 18,
        'font-weight': 700, fill: 'var(--accent-dark)' }, fmt(state.totals.readOps)));
      parts.push(K.t('path', { d: 'M 452 92 L 496 92', stroke: 'var(--text-faint)',
        'stroke-width': 1.5, fill: 'none' }));

      return K.svg('0 0 ' + W + ' ' + H, parts.join(''), 'Fan-out strategy: ' + state.mode);
    }

    function renderLog() {
      if (!state.totals.log.length) {
        o.log.innerHTML = '<p class="anim-hint">Post as an ordinary user, then as the pop star, and compare the cost.</p>';
        return;
      }
      o.log.innerHTML = '<ul class="anim-loglist">' + state.totals.log.slice(0, 6).map(function (l) {
        return '<li><span class="anim-log-cost ' + (l.side === 'write' ? 'w' : 'r') + '">' +
          fmt(l.cost) + '</span> <strong>' + K.esc(l.who) + '</strong> — ' + K.esc(l.text) + '</li>';
      }).join('') + '</ul>';
    }

    function render() {
      o.posts.textContent = state.totals.posts;
      o.writeOps.textContent = fmt(state.totals.writeOps);
      o.feedReads.textContent = state.totals.feedReads;
      o.readOps.textContent = fmt(state.totals.readOps);
      o.svg.innerHTML = draw();
      renderLog();

      Array.prototype.forEach.call(stage.querySelectorAll('[data-pick]'), function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-pick') === state.mode ? 'true' : 'false');
      });

      o.note.innerHTML = {
        write: '<strong>Fan-out on write.</strong> Every post is copied into each follower’s feed immediately, so ' +
          'opening a feed is a single read of a list that is already built. That is why it is the default — reads ' +
          'vastly outnumber posts. Now press <strong>Pop star posts</strong>: one action costs 40M cache writes, the ' +
          'write takes minutes to settle, and the followers at the end of the queue see the post late. This is the ' +
          'hot-key problem, and no amount of partitioning fixes it, because the key is one user.',
        read: '<strong>Fan-out on read.</strong> A post is one row. Nothing is precomputed, so the cost moves to every ' +
          'feed open: fetch each followed author’s recent posts and merge them, on every refresh, for every user. ' +
          'Posting by the pop star is now trivially cheap — but the ordinary reader pays for it forever, and the ' +
          'merge is on the latency path of the most common request in the product.',
        hybrid: '<strong>Hybrid — what the chapter actually lands on.</strong> Push for ordinary users, pull for the ' +
          'celebrity. The 40M-write spike disappears, and the read cost rises by only the handful of high-fan-out ' +
          'accounts a reader follows. The general shape is worth keeping: when one key is pathological, stop trying ' +
          'to make one strategy cover both and special-case the tail.'
      }[state.mode];
    }

    K.onClick(stage, function (b) {
      var pick = b.getAttribute('data-pick');
      if (pick) { state.mode = pick; state.totals = reset(); render(); return; }

      var who = b.getAttribute('data-post');
      if (who) {
        post(USERS.filter(function (u) { return u.id === who; })[0]);
        render(); return;
      }
      switch (b.getAttribute('data-act')) {
        case 'read': readFeed(); break;
        case 'reset': state.totals = reset(); break;
        default: return;
      }
      render();
    });

    render();
  });
})();
