/* ==========================================================================
   anim-orderbook.js — Chapter 28, the matching engine
   --------------------------------------------------------------------------
   The order book is the one data structure the whole exchange is built
   around, and the matching rule is short enough to hold in your head:

     price first, then time.

   A buy at or above the best ask trades immediately against it, oldest order
   at that price first; whatever is left rests in the book and becomes the new
   best bid. Everything else in the chapter — the sequencer, determinism,
   event sourcing — exists to make sure every replica applies exactly this
   rule to exactly this sequence of orders.

   Send orders and watch the book fill, cross and trade.
   ========================================================================== */

(function () {
  'use strict';
  var K = window.ANIMKIT;

  K.register('anim-orderbook', function (stage) {
    var seq = 0;
    var bids = [];        /* { id, price, qty, seq } — best (highest) first */
    var asks = [];        /* best (lowest) first */
    var trades = [];
    var nextId = 1;

    stage.innerHTML =
      '<div class="anim-controls">' +
        '<label class="anim-input"><span>Price</span>' +
          '<input type="number" data-price value="101" min="90" max="110" step="1" aria-label="Limit price"></label>' +
        '<label class="anim-input"><span>Qty</span>' +
          '<input type="number" data-qty value="50" min="10" max="500" step="10" aria-label="Quantity"></label>' +
        '<button type="button" class="anim-btn primary" data-act="buy">Buy</button>' +
        '<button type="button" class="anim-btn danger" data-act="sell">Sell</button>' +
        '<span class="anim-spacer"></span>' +
        K.btn('seed', 'Seed a book') +
        K.btn('reset', 'Clear') +
      '</div>' +
      '<dl class="anim-readout">' +
        K.stat('Best bid', 'bid') +
        K.stat('Best ask', 'ask') +
        K.stat('Spread', 'spread') +
        K.stat('Last trade', 'last') +
      '</dl>' +
      '<div data-out="svg"></div>' +
      '<div class="anim-track"><h4>Executions</h4><div data-out="trades"></div></div>' +
      '<p class="anim-note" data-out="note"></p>';

    var o = K.outs(stage);
    var W = 660, H = 210;

    function bestBid() { return bids.length ? bids[0].price : null; }
    function bestAsk() { return asks.length ? asks[0].price : null; }

    /* price-time priority: better price first, then earlier sequence number */
    function sortBook() {
      bids.sort(function (a, b) { return b.price - a.price || a.seq - b.seq; });
      asks.sort(function (a, b) { return a.price - b.price || a.seq - b.seq; });
    }

    function submit(side, price, qty) {
      var incoming = { id: nextId++, price: price, qty: qty, seq: seq++, side: side };
      var book = side === 'buy' ? asks : bids;
      var filled = [];

      /* cross against the opposite side while the price allows */
      while (incoming.qty > 0 && book.length) {
        var top = book[0];
        var crosses = side === 'buy' ? top.price <= incoming.price : top.price >= incoming.price;
        if (!crosses) break;
        var q = Math.min(incoming.qty, top.qty);
        /* the resting order's price is the trade price — it was there first */
        filled.push({ price: top.price, qty: q, taker: side, at: seq });
        incoming.qty -= q;
        top.qty -= q;
        if (top.qty === 0) book.shift();
      }

      if (filled.length) {
        trades = filled.concat(trades).slice(0, 8);
      }
      /* the unfilled remainder rests in the book */
      if (incoming.qty > 0) {
        (side === 'buy' ? bids : asks).push(incoming);
      }
      sortBook();
      return filled;
    }

    function aggregate(book) {
      var levels = [];
      book.forEach(function (ordr) {
        var hit = levels.filter(function (l) { return l.price === ordr.price; })[0];
        if (hit) { hit.qty += ordr.qty; hit.orders++; }
        else levels.push({ price: ordr.price, qty: ordr.qty, orders: 1 });
      });
      return levels;
    }

    function draw() {
      var parts = [];
      var bl = aggregate(bids).slice(0, 5);
      var al = aggregate(asks).slice(0, 5);
      var maxQty = Math.max(1, Math.max(
        bl.reduce(function (m, l) { return Math.max(m, l.qty); }, 0),
        al.reduce(function (m, l) { return Math.max(m, l.qty); }, 0)));

      var midX = W / 2;
      var rowH = 26, top = 46;

      parts.push(K.t('text', { x: midX - 14, y: 22, 'text-anchor': 'end', 'font-size': 11,
        'font-weight': 700, fill: 'var(--primary-dark)', 'letter-spacing': '.06em' }, 'BIDS (BUY)'));
      parts.push(K.t('text', { x: midX + 14, y: 22, 'font-size': 11,
        'font-weight': 700, fill: 'var(--accent-dark)', 'letter-spacing': '.06em' }, 'ASKS (SELL)'));

      if (!bl.length && !al.length) {
        parts.push(K.t('text', { x: midX, y: 100, 'text-anchor': 'middle', 'font-size': 12,
          fill: 'var(--text-faint)' }, 'Empty book — send an order, or seed one'));
        return K.svg('0 0 ' + W + ' ' + H, parts.join(''), 'Empty order book');
      }

      bl.forEach(function (l, i) {
        var y = top + i * rowH;
        var w = (l.qty / maxQty) * (midX - 70);
        parts.push(K.t('rect', { x: midX - 60 - w, y: y, width: w, height: rowH - 6, rx: 3,
          fill: 'var(--primary)', opacity: i === 0 ? .4 : .22 }));
        parts.push(K.t('text', { x: midX - 56, y: y + 14, 'text-anchor': 'end', 'font-size': 11.5,
          'font-weight': i === 0 ? 700 : 500, fill: 'var(--text)' }, String(l.qty)));
        parts.push(K.t('text', { x: midX - 16, y: y + 14, 'text-anchor': 'end', 'font-size': 11.5,
          'font-weight': 700, fill: 'var(--primary-dark)' }, l.price.toFixed(0)));
      });

      al.forEach(function (l, i) {
        var y = top + i * rowH;
        var w = (l.qty / maxQty) * (midX - 70);
        parts.push(K.t('rect', { x: midX + 60, y: y, width: w, height: rowH - 6, rx: 3,
          fill: 'var(--accent)', opacity: i === 0 ? .4 : .22 }));
        parts.push(K.t('text', { x: midX + 56, y: y + 14, 'font-size': 11.5,
          'font-weight': i === 0 ? 700 : 500, fill: 'var(--text)' }, String(l.qty)));
        parts.push(K.t('text', { x: midX + 16, y: y + 14, 'font-size': 11.5,
          'font-weight': 700, fill: 'var(--accent-dark)' }, l.price.toFixed(0)));
      });

      /* the spread, drawn as the gap it is */
      parts.push(K.t('line', { x1: midX, y1: 30, x2: midX, y2: H - 22,
        stroke: 'var(--border-strong)', 'stroke-width': 1, 'stroke-dasharray': '3 3' }));

      var bb = bestBid(), ba = bestAsk();
      if (bb !== null && ba !== null) {
        parts.push(K.t('text', { x: midX, y: H - 8, 'text-anchor': 'middle', 'font-size': 11,
          'font-weight': 700, fill: 'var(--text-muted)' },
          K.esc('spread ' + (ba - bb) + ' · mid ' + ((ba + bb) / 2).toFixed(1))));
      }

      return K.svg('0 0 ' + W + ' ' + H, parts.join(''), 'Order book depth');
    }

    function renderTrades() {
      if (!trades.length) {
        o.trades.innerHTML = '<p class="anim-hint">No executions yet. A buy priced at or above the best ask trades immediately.</p>';
        return;
      }
      o.trades.innerHTML = '<ul class="anim-loglist">' + trades.map(function (t) {
        return '<li><span class="anim-log-cost ' + (t.taker === 'buy' ? 'w' : 'r') + '">' + t.qty + '</span>' +
          ' traded at <strong>' + t.price + '</strong> — ' +
          K.esc(t.taker === 'buy' ? 'buyer lifted the ask' : 'seller hit the bid') + '</li>';
      }).join('') + '</ul>';
    }

    function render(lastFill) {
      var bb = bestBid(), ba = bestAsk();
      o.bid.textContent = bb === null ? '—' : bb;
      o.ask.textContent = ba === null ? '—' : ba;
      o.spread.textContent = (bb === null || ba === null) ? '—' : (ba - bb);
      o.last.textContent = trades.length ? trades[0].price + ' × ' + trades[0].qty : '—';
      o.svg.innerHTML = draw();
      renderTrades();

      /* a crossed book should never exist after matching — it is the invariant */
      var crossed = bb !== null && ba !== null && bb >= ba;
      stage.querySelector('[data-stat="spread"]').className = 'anim-stat ' + (crossed ? 'is-bad' : '');

      if (lastFill && lastFill.length) {
        var total = lastFill.reduce(function (n, f) { return n + f.qty; }, 0);
        o.note.innerHTML = '<strong>Matched ' + total + ' immediately.</strong> The incoming order crossed the spread, ' +
          'so it traded against resting orders at <em>their</em> price, best price first and oldest first within a ' +
          'price. Any remainder is now resting in the book. Notice the trade price: the resting order got there first, ' +
          'so it sets the price — that is price-time priority, and it is the only rule the matching engine applies.';
      } else if (crossed) {
        o.note.innerHTML = '<strong>The book is crossed, which should be impossible.</strong> If you can see this, ' +
          'matching has a bug — a real engine maintains best bid &lt; best ask as an invariant after every order.';
      } else {
        o.note.innerHTML = 'The order rested in the book without trading, because it was not priced aggressively ' +
          'enough to cross the spread. Everything the rest of the chapter builds — the sequencer, deterministic ' +
          'replay, event sourcing — exists so that every replica applies <strong>this</strong> rule to ' +
          '<strong>this</strong> order sequence and reaches an identical book.';
      }
    }

    function num(sel, dflt) {
      var v = parseInt(stage.querySelector(sel).value, 10);
      return isNaN(v) ? dflt : v;
    }

    K.onClick(stage, function (b) {
      var act = b.getAttribute('data-act');
      if (act === 'buy' || act === 'sell') {
        var fills = submit(act, K.clamp(num('[data-price]', 100), 90, 110), K.clamp(num('[data-qty]', 50), 10, 500));
        render(fills);
        return;
      }
      if (act === 'seed') {
        bids = []; asks = []; trades = []; seq = 0; nextId = 1;
        [[99, 120], [98, 200], [97, 150]].forEach(function (p) {
          bids.push({ id: nextId++, price: p[0], qty: p[1], seq: seq++, side: 'buy' });
        });
        [[102, 90], [103, 180], [104, 140]].forEach(function (p) {
          asks.push({ id: nextId++, price: p[0], qty: p[1], seq: seq++, side: 'sell' });
        });
        sortBook();
        render();
        return;
      }
      if (act === 'reset') {
        bids = []; asks = []; trades = []; seq = 0; nextId = 1;
        render();
      }
    });

    /* start with a book so the first thing you see is the structure */
    [[99, 120], [98, 200], [97, 150]].forEach(function (p) {
      bids.push({ id: nextId++, price: p[0], qty: p[1], seq: seq++, side: 'buy' });
    });
    [[102, 90], [103, 180], [104, 140]].forEach(function (p) {
      asks.push({ id: nextId++, price: p[0], qty: p[1], seq: seq++, side: 'sell' });
    });
    sortBook();
    render();
  });
})();
