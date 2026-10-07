/* ==========================================================================
   anim-consistent-hashing.js — interactive explainer for Chapter 5
   --------------------------------------------------------------------------
   The chapter's whole claim is a pair of fractions: plain hash(key) % N
   remaps roughly (N-1)/N of keys when N changes, a hash ring remaps roughly
   1/N. This lets you add and remove servers and watch that number.

   Both modes use the same keys and the same hash, so the comparison is
   honest — only the placement rule changes.

   No framework, no CDN, works over file://. Mounted into the
   <figure data-anim="anim-consistent-hashing"> that the build injects.
   ========================================================================== */

(function () {
  'use strict';
  var K = window.ANIMKIT;

  var RING = 1 << 16;           /* a 16-bit ring keeps the numbers readable */
  var VNODES = 40;              /* virtual nodes per server when enabled */
  var SERVER_NAMES = ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7'];
  /* Categorical palette, chosen to stay legible on both the light and the
     dark theme background — no very dark or very pale entries. */
  var COLORS = ['#2fae9e', '#f2795a', '#5b9bd5', '#d4a02c', '#a579d0', '#41b06e', '#d96a92', '#8fa3b5'];

  /* ---- a small deterministic hash, folded onto the ring ----------------
     FNV-1a alone is not good enough here. Its low bits barely avalanche for
     short similar strings, so taking "% RING" (the low 16 bits) of
     's0'..'s3' lands every server inside one narrow arc and hands one of
     them every key — which would misrepresent the very property the chapter
     is about. The murmur3 finalizer below mixes the high bits down before
     the fold, which spreads both servers and keys evenly. */
  function hash(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
    }
    h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d) >>> 0;
    h ^= h >>> 12; h = Math.imul(h, 0x297a2d39) >>> 0;
    h ^= h >>> 15;
    return (h >>> 0) % RING;
  }

  /* ======================================================================
     model
     ====================================================================== */
  function createModel() {
    return {
      mode: 'ring',            /* 'ring' | 'modn' */
      vnodes: false,
      servers: ['s0', 's1', 's2', 's3'],
      keys: [],
      lastMoved: null,         /* { moved, total, label } after a change */
      highlight: null          /* server name just added/removed */
    };
  }

  function addKeys(model, n) {
    for (var i = 0; i < n; i++) {
      var name = 'key' + model.keys.length;
      model.keys.push({ name: name, pos: hash(name) });
    }
  }

  /* ring positions for a server, honouring the virtual-node toggle */
  function serverPositions(model, name) {
    if (!model.vnodes) return [hash(name)];
    var out = [];
    for (var i = 0; i < VNODES; i++) out.push(hash(name + '#vn' + i));
    return out;
  }

  /* owner of a key under the current placement rule */
  function ownerOf(model, key, servers) {
    if (!servers.length) return null;

    if (model.mode === 'modn') {
      /* hash(key) % N — the index depends on N, which is the whole problem */
      return servers[hash(key.name) % servers.length];
    }

    /* ring: walk clockwise to the first server position at or after the key */
    var best = null, bestGap = Infinity;
    for (var i = 0; i < servers.length; i++) {
      var ps = serverPositions(model, servers[i]);
      for (var j = 0; j < ps.length; j++) {
        var gap = ps[j] - key.pos;
        if (gap < 0) gap += RING;          /* wrap past 0 */
        if (gap < bestGap) { bestGap = gap; best = servers[i]; }
      }
    }
    return best;
  }

  function assignAll(model, servers) {
    var map = {};
    for (var i = 0; i < model.keys.length; i++) {
      map[model.keys[i].name] = ownerOf(model, model.keys[i], servers);
    }
    return map;
  }

  /* Apply a change to the server list and measure how many keys moved. */
  function applyChange(model, nextServers, label) {
    var before = assignAll(model, model.servers);
    model.servers = nextServers;
    var after = assignAll(model, model.servers);

    var moved = 0, total = 0;
    for (var k in before) {
      if (!Object.prototype.hasOwnProperty.call(before, k)) continue;
      total++;
      if (before[k] !== after[k]) moved++;
    }
    model.lastMoved = { moved: moved, total: total, label: label };
    return after;
  }

  /* ======================================================================
     view
     ====================================================================== */
  var W = 660, H = 360, CX = 185, CY = 180, R = 125;

  function polar(pos, radius) {
    /* position 0 at the top, increasing clockwise — matches the book's figures */
    var a = (pos / RING) * Math.PI * 2 - Math.PI / 2;
    return { x: CX + Math.cos(a) * radius, y: CY + Math.sin(a) * radius };
  }

  function colorFor(model, name) {
    var i = SERVER_NAMES.indexOf(name);
    return i === -1 ? 'var(--text-faint)' : COLORS[i % COLORS.length];
  }

  var esc = K.esc;

  function svgRing(model, owners) {
    var parts = [];
    var i, j;

    parts.push('<svg class="anim-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" ' +
      'aria-label="Hash ring with ' + model.servers.length + ' servers and ' + model.keys.length + ' keys">');

    /* ---- ring ---- */
    parts.push('<circle cx="' + CX + '" cy="' + CY + '" r="' + R + '" fill="none" stroke="var(--border-strong)" stroke-width="10"/>');

    if (model.mode === 'ring') {
      /* coloured arcs showing each server's slice of the ring */
      var marks = [];
      for (i = 0; i < model.servers.length; i++) {
        var ps = serverPositions(model, model.servers[i]);
        for (j = 0; j < ps.length; j++) marks.push({ pos: ps[j], server: model.servers[i] });
      }
      marks.sort(function (a, b) { return a.pos - b.pos; });

      for (i = 0; i < marks.length; i++) {
        var from = marks[(i - 1 + marks.length) % marks.length].pos;
        var to = marks[i].pos;
        var owner = marks[i].server;      /* clockwise walk: this mark owns the arc behind it */
        var sweep = to - from;
        if (sweep < 0) sweep += RING;
        if (sweep <= 0) continue;
        var p0 = polar(from, R), p1 = polar(to, R);
        var large = sweep > RING / 2 ? 1 : 0;
        parts.push('<path d="M ' + p0.x.toFixed(1) + ' ' + p0.y.toFixed(1) +
          ' A ' + R + ' ' + R + ' 0 ' + large + ' 1 ' + p1.x.toFixed(1) + ' ' + p1.y.toFixed(1) + '"' +
          ' fill="none" stroke="' + colorFor(model, owner) + '" stroke-width="10" opacity="' +
          (model.highlight === owner ? '.95' : '.55') + '"/>');
      }
    } else {
      parts.push('<circle cx="' + CX + '" cy="' + CY + '" r="' + R + '" fill="none" stroke="var(--text-faint)" ' +
        'stroke-width="10" stroke-dasharray="4 6"/>');
      parts.push('<text x="' + CX + '" y="' + (CY - 6) + '" text-anchor="middle" font-size="12" fill="var(--text-faint)">no ring:</text>');
      parts.push('<text x="' + CX + '" y="' + (CY + 11) + '" text-anchor="middle" font-size="13" fill="var(--text-muted)" font-weight="600">hash(key) % ' + model.servers.length + '</text>');
      parts.push('<text x="' + CX + '" y="' + (CY + 29) + '" text-anchor="middle" font-size="11" fill="var(--text-faint)">position on the ring is ignored</text>');
    }

    /* ---- server markers (single node mode only; vnodes would be a blur) -- */
    if (model.mode === 'ring' && !model.vnodes) {
      for (i = 0; i < model.servers.length; i++) {
        var sp = polar(hash(model.servers[i]), R);
        var lp = polar(hash(model.servers[i]), R + 24);
        parts.push('<rect x="' + (sp.x - 7) + '" y="' + (sp.y - 7) + '" width="14" height="14" rx="3" ' +
          'fill="' + colorFor(model, model.servers[i]) + '" stroke="var(--surface)" stroke-width="2"/>');
        parts.push('<text x="' + lp.x.toFixed(1) + '" y="' + lp.y.toFixed(1) + '" text-anchor="middle" ' +
          'dominant-baseline="middle" font-size="11" font-weight="700" fill="' + colorFor(model, model.servers[i]) + '">' +
          esc(model.servers[i]) + '</text>');
      }
    }

    /* ---- keys ---- */
    for (i = 0; i < model.keys.length; i++) {
      var key = model.keys[i];
      var owner = owners[key.name];
      var kp = model.mode === 'ring'
        ? polar(key.pos, R - 26)
        /* mod-N mode: keys have no ring position, so lay them out in a grid
           inside the circle, grouped by owner, to show the mapping is arbitrary */
        : gridPoint(i, model.keys.length);
      parts.push('<circle cx="' + kp.x.toFixed(1) + '" cy="' + kp.y.toFixed(1) + '" r="4.2" ' +
        'fill="' + colorFor(model, owner) + '" opacity=".9"/>');
    }

    /* ---- legend ---- */
    var lx = 390, ly = 48;
    parts.push('<text x="' + lx + '" y="28" font-size="11" font-weight="700" fill="var(--text-faint)" letter-spacing=".06em">KEYS PER SERVER</text>');

    var counts = {};
    for (i = 0; i < model.servers.length; i++) counts[model.servers[i]] = 0;
    for (i = 0; i < model.keys.length; i++) {
      if (counts[owners[model.keys[i].name]] !== undefined) counts[owners[model.keys[i].name]]++;
    }
    var maxCount = 1;
    for (var s in counts) if (counts[s] > maxCount) maxCount = counts[s];

    for (i = 0; i < model.servers.length; i++) {
      var nm = model.servers[i];
      var y = ly + i * 27;
      var barW = Math.round((counts[nm] / maxCount) * 150);
      parts.push('<rect x="' + lx + '" y="' + (y - 9) + '" width="11" height="11" rx="2.5" fill="' + colorFor(model, nm) + '"/>');
      parts.push('<text x="' + (lx + 18) + '" y="' + y + '" font-size="12" dominant-baseline="middle" fill="var(--text-muted)" font-weight="600">' + esc(nm) + '</text>');
      parts.push('<rect x="' + (lx + 48) + '" y="' + (y - 6) + '" width="' + Math.max(barW, 2) + '" height="12" rx="2" fill="' + colorFor(model, nm) + '" opacity=".3"/>');
      parts.push('<text x="' + (lx + 48 + Math.max(barW, 2) + 6) + '" y="' + y + '" font-size="11" dominant-baseline="middle" fill="var(--text-faint)" font-variant-numeric="tabular-nums">' + counts[nm] + '</text>');
    }

    /* ideal share line, so imbalance is visible rather than asserted */
    if (model.servers.length && model.keys.length) {
      var ideal = model.keys.length / model.servers.length;
      var idealY = ly + model.servers.length * 27 + 4;
      parts.push('<text x="' + lx + '" y="' + idealY + '" font-size="10.5" fill="var(--text-faint)">even split would be ' + ideal.toFixed(1) + ' each</text>');
    }

    parts.push('</svg>');
    return parts.join('');
  }

  function gridPoint(i, total) {
    var cols = Math.ceil(Math.sqrt(total)) || 1;
    var rows = Math.ceil(total / cols);
    var step = Math.min(18, 170 / Math.max(cols, 1));
    var col = i % cols, row = Math.floor(i / cols);
    return {
      x: CX - ((cols - 1) * step) / 2 + col * step,
      y: CY + 52 - ((rows - 1) * step) / 2 + row * step
    };
  }

  /* ======================================================================
     mount
     ====================================================================== */
  K.register('anim-consistent-hashing', function (stage) {
    var model = createModel();
    addKeys(model, 24);

    stage.innerHTML =
      '<div class="anim-controls">' +
        '<span class="anim-seg" role="group" aria-label="Placement rule">' +
          '<button type="button" data-mode="modn" aria-pressed="false">hash(key) % N</button>' +
          '<button type="button" data-mode="ring" aria-pressed="true">Hash ring</button>' +
        '</span>' +
        '<button type="button" class="anim-btn primary" data-act="add">+ Add server</button>' +
        '<button type="button" class="anim-btn danger" data-act="remove">− Remove server</button>' +
        '<button type="button" class="anim-btn" data-act="keys">+ 24 keys</button>' +
        '<button type="button" class="anim-btn" data-act="vnodes" aria-pressed="false">Virtual nodes: off</button>' +
        '<span class="anim-spacer"></span>' +
        '<button type="button" class="anim-btn" data-act="reset">Reset</button>' +
      '</div>' +
      '<dl class="anim-readout">' +
        '<div class="anim-stat"><dt>Servers</dt><dd data-out="servers">—</dd></div>' +
        '<div class="anim-stat"><dt>Keys</dt><dd data-out="keys">—</dd></div>' +
        '<div class="anim-stat" data-stat="moved"><dt>Keys moved by last change</dt><dd data-out="moved">—</dd></div>' +
        '<div class="anim-stat"><dt>Theory says</dt><dd data-out="theory">—</dd></div>' +
      '</dl>' +
      '<div data-out="svg"></div>' +
      '<p class="anim-note" data-out="note"></p>';

    var outs = {};
    Array.prototype.forEach.call(stage.querySelectorAll('[data-out]'), function (el) {
      outs[el.getAttribute('data-out')] = el;
    });
    var movedStat = stage.querySelector('[data-stat="moved"]');

    function render() {
      var owners = assignAll(model, model.servers);

      outs.svg.innerHTML = svgRing(model, owners);
      outs.servers.textContent = model.servers.length;
      outs.keys.textContent = model.keys.length;

      var n = model.servers.length;
      if (model.mode === 'modn') {
        outs.theory.textContent = n > 1 ? Math.round(((n - 1) / n) * 100) + '%' : '—';
      } else {
        outs.theory.textContent = n >= 1 ? '~' + Math.round((1 / n) * 100) + '%' : '—';
      }

      if (model.lastMoved && model.lastMoved.total) {
        var lm = model.lastMoved;
        var pct = Math.round((lm.moved / lm.total) * 100);
        outs.moved.textContent = lm.moved + ' / ' + lm.total + ' (' + pct + '%)';
        movedStat.className = 'anim-stat ' + (pct >= 50 ? 'is-bad' : 'is-good');
      } else {
        outs.moved.textContent = '—';
        movedStat.className = 'anim-stat';
      }

      outs.note.innerHTML = noteFor(model);

      /* keep the controls honest about what is possible */
      stage.querySelector('[data-act="remove"]').disabled = model.servers.length <= 1;
      stage.querySelector('[data-act="add"]').disabled = model.servers.length >= SERVER_NAMES.length;
      var vb = stage.querySelector('[data-act="vnodes"]');
      vb.disabled = model.mode !== 'ring';
      vb.setAttribute('aria-pressed', model.vnodes ? 'true' : 'false');
      vb.textContent = 'Virtual nodes: ' + (model.vnodes ? 'on' : 'off');
      Array.prototype.forEach.call(stage.querySelectorAll('[data-mode]'), function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-mode') === model.mode ? 'true' : 'false');
      });
    }

    function noteFor(m) {
      var n = m.servers.length;
      if (m.lastMoved && m.lastMoved.total) {
        var pct = Math.round((m.lastMoved.moved / m.lastMoved.total) * 100);
        if (m.mode === 'modn') {
          return '<strong>' + esc(m.lastMoved.label) + ':</strong> ' + pct + '% of keys changed owner. ' +
            'The modulus changed, so almost every key computes a different answer. If these servers are a cache, ' +
            'that is a near-total cache miss arriving at the database at the worst possible moment.';
        }
        return '<strong>' + esc(m.lastMoved.label) + ':</strong> ' + pct + '% of keys changed owner. ' +
          'Only the keys in the arc next to the change had to move — every other key found the same server it had before. ' +
          (m.vnodes
            ? 'With virtual nodes each server owns many small arcs, so the load it gives up or takes on is spread evenly.'
            : 'Notice how uneven the per-server counts are: with one position per server the arcs are whatever the hash happened to give. Turn on virtual nodes.');
      }
      if (m.mode === 'modn') {
        return 'Keys are placed by <strong>hash(key) % ' + n + '</strong> — their ring position is ignored entirely. ' +
          'Add or remove a server and watch the moved count.';
      }
      return 'Each key walks clockwise to the first server it meets. Server positions do not move when another server ' +
        'joins or leaves, so most keys keep the same owner. Add or remove a server and compare with <strong>hash(key) % N</strong>.';
    }

    /* ---- interaction ---- */
    stage.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('button') : null;
      if (!b || b.disabled) return;

      var mode = b.getAttribute('data-mode');
      if (mode) {
        model.mode = mode;
        model.lastMoved = null;
        model.highlight = null;
        render();
        return;
      }

      switch (b.getAttribute('data-act')) {
        case 'add': {
          var next = model.servers.concat([SERVER_NAMES[model.servers.length]]);
          model.highlight = SERVER_NAMES[model.servers.length];
          applyChange(model, next, 'Added ' + model.highlight);
          break;
        }
        case 'remove': {
          var gone = model.servers[model.servers.length - 1];
          model.highlight = null;
          applyChange(model, model.servers.slice(0, -1), 'Removed ' + gone);
          break;
        }
        case 'keys':
          addKeys(model, 24);
          model.lastMoved = null;
          break;
        case 'vnodes':
          model.vnodes = !model.vnodes;
          model.lastMoved = null;
          break;
        case 'reset': {
          var mode0 = model.mode;
          model = createModel();
          model.mode = mode0;
          addKeys(model, 24);
          break;
        }
        default: return;
      }
      render();
    });

    render();
  });
})();
