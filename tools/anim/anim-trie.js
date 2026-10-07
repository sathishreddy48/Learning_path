/* ==========================================================================
   anim-trie.js — Chapter 13, the trie and the top-k cache
   --------------------------------------------------------------------------
   A trie is easy to draw and easy to misread. Walking the prefix is the cheap
   part — it is O(length of prefix) and nobody cares. The expensive part is
   what happens at the node you land on: to return the top 5 you must walk the
   ENTIRE subtree beneath it, and for a one-letter prefix that subtree is most
   of the dataset.

   That is the whole reason the chapter caches the top-k at every node. Type a
   prefix with the cache off and watch the subtree-visit count; turn it on and
   watch it collapse to zero.
   ========================================================================== */

(function () {
  'use strict';
  var K = window.ANIMKIT;

  K.register('anim-trie', function (stage) {
    /* A small query log with frequencies — the numbers are what ranking uses. */
    var CORPUS = [
      ['tea', 14], ['team', 32], ['teams', 11], ['tear', 7], ['tech', 58],
      ['technology', 41], ['ted', 9], ['ten', 23], ['tennis', 35],
      ['to', 90], ['top', 26], ['tornado', 5], ['toy', 12]
    ];

    var state = { prefix: 'te', cache: false, lastVisited: 0 };

    /* ---- build the trie once -------------------------------------------- */
    var root = { ch: '', kids: {}, word: null, freq: 0 };
    CORPUS.forEach(function (entry) {
      var node = root;
      for (var i = 0; i < entry[0].length; i++) {
        var c = entry[0][i];
        if (!node.kids[c]) node.kids[c] = { ch: c, kids: {}, word: null, freq: 0 };
        node = node.kids[c];
      }
      node.word = entry[0];
      node.freq = entry[1];
    });

    /* Precompute the cached top-k at every node, which is what the chapter's
       optimisation actually stores. */
    (function annotate(node) {
      var all = [];
      if (node.word) all.push({ word: node.word, freq: node.freq });
      Object.keys(node.kids).forEach(function (c) {
        annotate(node.kids[c]);
        all = all.concat(node.kids[c].top);
      });
      all.sort(function (a, b) { return b.freq - a.freq || a.word.localeCompare(b.word); });
      node.top = all.slice(0, 5);
      node.subtreeSize = 1 + Object.keys(node.kids).reduce(function (n, c) {
        return n + node.kids[c].subtreeSize;
      }, 0);
    })(root);

    stage.innerHTML =
      '<div class="anim-controls">' +
        '<label class="anim-input"><span>Prefix</span>' +
          '<input type="text" data-prefix value="te" maxlength="10" spellcheck="false" ' +
            'autocomplete="off" aria-label="Type a prefix">' +
        '</label>' +
        '<button type="button" class="anim-btn" data-act="cache" aria-pressed="false">Top-k cached at each node: off</button>' +
        '<span class="anim-spacer"></span>' +
        '<span class="anim-hint">13 queries in the log</span>' +
      '</div>' +
      '<dl class="anim-readout">' +
        K.stat('Prefix walk', 'walk') +
        K.stat('Subtree nodes visited', 'visited') +
        K.stat('Total work', 'work') +
        K.stat('Suggestions', 'count') +
      '</dl>' +
      '<div data-out="svg"></div>' +
      '<div class="anim-track"><h4>Top 5 for this prefix</h4><div data-out="sugg"></div></div>' +
      '<p class="anim-note" data-out="note"></p>';

    var o = K.outs(stage);

    /* Walk down the prefix; returns the node or null. */
    function descend(prefix) {
      var node = root, path = [root];
      for (var i = 0; i < prefix.length; i++) {
        node = node.kids[prefix[i]];
        if (!node) return { node: null, path: path };
        path.push(node);
      }
      return { node: node, path: path };
    }

    /* The uncached path: collect every word under the node, counting visits. */
    function gatherUncached(node) {
      var visited = 0, found = [];
      (function walk(n) {
        visited++;
        if (n.word) found.push({ word: n.word, freq: n.freq });
        Object.keys(n.kids).sort().forEach(function (c) { walk(n.kids[c]); });
      })(node);
      found.sort(function (a, b) { return b.freq - a.freq || a.word.localeCompare(b.word); });
      return { visited: visited, top: found.slice(0, 5) };
    }

    /* ---- layout: assign x by in-order position, y by depth --------------- */
    var W = 660, H = 260;
    function layout() {
      var leafX = 0, nodes = [], edges = [];
      (function place(n, depth, parent) {
        var kids = Object.keys(n.kids).sort();
        var rec = { n: n, depth: depth, x: 0 };
        if (!kids.length) { rec.x = leafX++; }
        else {
          var xs = [];
          kids.forEach(function (c) { xs.push(place(n.kids[c], depth + 1, rec)); });
          rec.x = (xs[0] + xs[xs.length - 1]) / 2;
        }
        nodes.push(rec);
        if (parent) edges.push({ from: parent, to: rec });
        return rec.x;
      })(root, 0, null);
      return { nodes: nodes, edges: edges, span: leafX };
    }
    var TREE = layout();

    function draw(pathSet, subtreeSet, missAt) {
      var maxDepth = 0;
      TREE.nodes.forEach(function (r) { if (r.depth > maxDepth) maxDepth = r.depth; });
      var stepX = (W - 40) / Math.max(TREE.span, 1);
      var stepY = (H - 50) / Math.max(maxDepth, 1);
      var px = function (r) { return 20 + r.x * stepX + stepX / 2; };
      var py = function (r) { return 28 + r.depth * stepY; };

      var parts = [];
      TREE.edges.forEach(function (e) {
        var onPath = pathSet.has(e.from.n) && pathSet.has(e.to.n);
        var inSub = subtreeSet.has(e.to.n);
        parts.push(K.t('line', {
          x1: px(e.from), y1: py(e.from), x2: px(e.to), y2: py(e.to),
          stroke: onPath ? 'var(--primary)' : inSub ? 'var(--accent)' : 'var(--border-strong)',
          'stroke-width': onPath ? 2.5 : inSub ? 1.8 : 1,
          opacity: onPath || inSub ? 1 : .5
        }));
      });

      TREE.nodes.forEach(function (r) {
        var onPath = pathSet.has(r.n);
        var inSub = subtreeSet.has(r.n);
        var isWord = !!r.n.word;
        var fill = onPath ? 'var(--primary)' : inSub ? 'var(--accent-lightest)'
          : isWord ? 'var(--bg-sunken)' : 'var(--surface)';
        var stroke = onPath ? 'var(--primary-dark)' : inSub ? 'var(--accent)'
          : 'var(--border-strong)';
        parts.push(K.t('circle', {
          cx: px(r), cy: py(r), r: isWord ? 9 : 7.5,
          fill: fill, stroke: stroke, 'stroke-width': onPath || inSub ? 2 : 1,
          opacity: onPath || inSub ? 1 : .55
        }));
        if (r.n.ch) {
          parts.push(K.t('text', {
            x: px(r), y: py(r) + 4, 'text-anchor': 'middle', 'font-size': 10,
            'font-weight': isWord ? 700 : 500,
            fill: onPath ? 'var(--grey-0)' : 'var(--text-muted)',
            opacity: onPath || inSub ? 1 : .6
          }, K.esc(r.n.ch)));
        }
      });

      if (missAt) {
        parts.push(K.t('text', { x: W / 2, y: H - 6, 'text-anchor': 'middle',
          'font-size': 12, 'font-weight': 700, fill: 'var(--accent-dark)' },
          K.esc('No node for "' + missAt + '" — the walk falls off the trie and returns nothing')));
      }
      return K.svg('0 0 ' + W + ' ' + H, parts.join(''), 'Trie for the query log');
    }

    function render() {
      var prefix = state.prefix.toLowerCase().replace(/[^a-z]/g, '');
      var res = descend(prefix);
      var pathSet = new Set(res.path);
      var subtreeSet = new Set();
      var visited = 0, top = [];

      if (res.node) {
        if (state.cache) {
          /* The whole point: the answer is already sitting on the node. */
          top = res.node.top;
          visited = 0;
        } else {
          var g = gatherUncached(res.node);
          top = g.top;
          visited = g.visited;
          (function mark(n) {
            subtreeSet.add(n);
            Object.keys(n.kids).forEach(function (c) { mark(n.kids[c]); });
          })(res.node);
          pathSet.forEach(function (n) { subtreeSet.delete(n); });
        }
      }

      o.svg.innerHTML = draw(pathSet, subtreeSet, res.node ? null : prefix);
      o.walk.textContent = prefix.length + ' hop' + (prefix.length === 1 ? '' : 's');
      o.visited.textContent = state.cache ? '0 (cached)' : visited;
      o.work.textContent = prefix.length + (state.cache ? 0 : visited);
      o.count.textContent = top.length;

      stage.querySelector('[data-stat="visited"]').className =
        'anim-stat ' + (state.cache ? 'is-good' : visited > 8 ? 'is-bad' : '');

      o.sugg.innerHTML = top.length
        ? '<ol class="anim-sugg">' + top.map(function (t) {
            return '<li><span class="sugg-word">' +
              '<strong>' + K.esc(t.word.slice(0, prefix.length)) + '</strong>' +
              K.esc(t.word.slice(prefix.length)) + '</span>' +
              '<span class="sugg-freq">' + t.freq + '</span></li>';
          }).join('') + '</ol>'
        : '<p class="anim-hint">Nothing matches that prefix.</p>';

      var b = stage.querySelector('[data-act="cache"]');
      b.setAttribute('aria-pressed', state.cache ? 'true' : 'false');
      b.textContent = 'Top-k cached at each node: ' + (state.cache ? 'on' : 'off');

      if (!res.node) {
        o.note.innerHTML = 'The prefix walk is <strong>O(length of the prefix)</strong> either way — here it ran out ' +
          'of trie before it ran out of letters, so there is nothing to rank.';
        return;
      }
      o.note.innerHTML = state.cache
        ? '<strong>Cached.</strong> The top 5 are stored on the node itself, so answering costs the ' + prefix.length +
          '-hop walk and nothing else — <strong>' + visitedWas() + ' subtree visits became 0</strong>. The price is paid ' +
          'on the write side instead: every update has to refresh the cached list on every ancestor node, which is ' +
          'why the chapter rebuilds the trie offline on a schedule rather than on each query.'
        : '<strong>Uncached.</strong> Walking ' + prefix.length + ' hop' + (prefix.length === 1 ? '' : 's') +
          ' was trivial; then ranking had to visit <strong>' + visited + ' nodes</strong> in the subtree below to find the ' +
          'top 5. Shorten the prefix and watch that number climb — a one-letter prefix means scanning almost the whole ' +
          'dataset, on the most latency-sensitive request in the product. Now turn the cache on.';
    }

    function visitedWas() {
      var res = descend(state.prefix.toLowerCase().replace(/[^a-z]/g, ''));
      return res.node ? gatherUncached(res.node).visited : 0;
    }

    stage.addEventListener('input', function (e) {
      if (!e.target.hasAttribute || !e.target.hasAttribute('data-prefix')) return;
      state.prefix = e.target.value;
      render();
    });

    K.onClick(stage, function (b) {
      if (b.getAttribute('data-act') === 'cache') { state.cache = !state.cache; render(); }
    });

    render();
  });
})();
