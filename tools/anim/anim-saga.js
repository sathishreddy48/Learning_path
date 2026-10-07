/* ==========================================================================
   anim-saga.js — Chapter 27, three ways to spend money in two places at once
   --------------------------------------------------------------------------
   Transferring between two accounts in different services has no good answer,
   only three bad ones with different failure modes. The chapter names them;
   this runs them.

     2PC   — a coordinator holds locks across both services until everyone
             commits. Correct, and the coordinator dying mid-commit leaves
             those locks held and the resources blocked.
     TCC   — Try/Confirm/Cancel: reserve first, decide after. The reservation
             is an ordinary local transaction, so nothing is held by a remote
             lock, but every service must implement three operations.
     Saga  — commit each step for real, and undo with a compensating
             transaction if a later step fails. Never blocks, but intermediate
             states are visible to everyone and compensation can itself fail.

   Inject a failure at any step and watch what each one does about it.
   ========================================================================== */

(function () {
  'use strict';
  var K = window.ANIMKIT;

  var PROTOCOLS = {
    twopc: {
      label: '2PC',
      steps: [
        { t: 'Coordinator: prepare?',        svc: 'both',  lock: true },
        { t: 'A: prepared, row locked',      svc: 'A',     lock: true },
        { t: 'B: prepared, row locked',      svc: 'B',     lock: true },
        { t: 'Coordinator: commit',          svc: 'both',  lock: true },
        { t: 'A: committed, lock released',  svc: 'A' },
        { t: 'B: committed, lock released',  svc: 'B' }
      ],
      onFail: function (i) {
        if (i >= 3) {
          return { kind: 'blocked', text:
            'The coordinator failed <em>after</em> telling someone to commit. The other participant is still holding ' +
            'its lock and has no idea what was decided — it cannot commit (it might contradict the first) and cannot ' +
            'abort (it might contradict the first). It blocks until the coordinator comes back. This is the ' +
            'single-point-of-failure the chapter warns about, and no amount of retrying fixes it.' };
        }
        return { kind: 'abort', text:
          'A participant voted no (or timed out) during prepare, so the coordinator aborts and every participant ' +
          'rolls back its local transaction. This is 2PC working correctly — the failure happened in the one phase ' +
          'where aborting is still safe.' };
      }
    },
    tcc: {
      label: 'TCC',
      steps: [
        { t: 'Try: reserve 100 from A',     svc: 'A', reserve: true },
        { t: 'Try: reserve credit on B',    svc: 'B', reserve: true },
        { t: 'Confirm: debit A for real',   svc: 'A' },
        { t: 'Confirm: credit B for real',  svc: 'B' }
      ],
      onFail: function (i) {
        if (i >= 2) {
          return { kind: 'retry', text:
            'A confirm failed. Confirms are not allowed to fail logically — the resources were already reserved in ' +
            'the Try phase, so nobody else can have taken them. The only correct response is to retry until it ' +
            'succeeds, which is why every Confirm must be idempotent.' };
        }
        return { kind: 'cancel', text:
          'A Try failed, so the coordinator issues <strong>Cancel</strong> for whatever was already reserved. Nothing ' +
          'was ever visible as a real balance change, and no remote lock was ever held — each reservation was an ' +
          'ordinary local transaction. The price is that every service now has to implement three operations ' +
          'instead of one.' };
      }
    },
    saga: {
      label: 'Saga',
      steps: [
        { t: 'Debit 100 from A (committed)',  svc: 'A', committed: true },
        { t: 'Credit 100 to B (committed)',   svc: 'B', committed: true },
        { t: 'Record transfer (committed)',   svc: 'L', committed: true }
      ],
      onFail: function (i) {
        return { kind: 'compensate', text:
          'Step ' + (i + 1) + ' failed, and the earlier steps are <strong>already committed and visible to everyone</strong>. ' +
          'There is nothing to roll back — the saga has to run compensating transactions in reverse to undo them. ' +
          'Note what that means: for a window, money really had left A and not arrived at B, and anyone reading ' +
          'either account saw that. Compensation is also itself a transaction that can fail, which is why sagas need ' +
          'durable state and retries rather than hope.' };
      }
    }
  };

  K.register('anim-saga', function (stage) {
    var state = { proto: 'twopc', at: 0, failAt: -1, outcome: null };

    stage.innerHTML =
      '<div class="anim-controls">' +
        K.seg('Protocol', [
          { id: 'twopc', label: '2PC' },
          { id: 'tcc',   label: 'TCC' },
          { id: 'saga',  label: 'Saga' }
        ], 'twopc') +
        '<span class="anim-spacer"></span>' +
        K.btn('step', 'Step', 'primary') +
        K.btn('run', 'Run to end') +
        K.btn('reset', 'Reset') +
      '</div>' +
      '<div class="anim-controls">' +
        '<span class="anim-hint">Inject a failure at:</span>' +
        '<span data-out="failpicker"></span>' +
      '</div>' +
      '<div data-out="svg"></div>' +
      '<p class="anim-note" data-out="note"></p>';

    var o = K.outs(stage);
    var W = 660;

    function proto() { return PROTOCOLS[state.proto]; }

    function stepHeight() { return 34; }
    function height() { return 54 + proto().steps.length * stepHeight(); }

    function draw() {
      var p = proto();
      var parts = [];
      var H = height();

      parts.push(K.t('text', { x: 12, y: 18, 'font-size': 11, 'font-weight': 700,
        fill: 'var(--text-faint)', 'letter-spacing': '.06em' },
        'TRANSFER 100 FROM ACCOUNT A TO ACCOUNT B — ' + p.label.toUpperCase()));

      p.steps.forEach(function (s, i) {
        var y = 36 + i * stepHeight();
        var done = i < state.at;
        var failed = state.failAt === i && state.at > i;
        var current = i === state.at && !state.outcome;

        var fill = failed ? 'var(--accent-lightest)'
          : done ? 'var(--primary-lightest)'
          : current ? 'var(--bg-alt)' : 'var(--bg-sunken)';
        var stroke = failed ? 'var(--accent)' : done ? 'var(--primary)'
          : current ? 'var(--text-faint)' : 'var(--border-strong)';

        parts.push(K.t('rect', { x: 14, y: y, width: W - 28, height: 26, rx: 5,
          fill: fill, stroke: stroke, 'stroke-width': failed || done ? 2 : 1,
          opacity: done || failed || current ? 1 : .6 }));

        parts.push(K.t('text', { x: 28, y: y + 17, 'font-size': 11.5,
          fill: failed ? 'var(--accent-dark)' : 'var(--text)',
          'font-weight': failed || current ? 700 : 500 },
          K.esc((i + 1) + '. ' + s.t)));

        var badge = failed ? 'FAILED' : done ? 'done' : current ? 'next' : '';
        if (badge) {
          parts.push(K.t('text', { x: W - 28, y: y + 17, 'text-anchor': 'end', 'font-size': 10,
            'font-weight': 700,
            fill: failed ? 'var(--accent-dark)' : done ? 'var(--primary-dark)' : 'var(--text-faint)' }, badge));
        }

        /* what is being held while this step is in flight */
        if (done && s.lock) {
          parts.push(K.t('text', { x: W - 86, y: y + 17, 'text-anchor': 'end', 'font-size': 9.5,
            fill: 'var(--warning-dark)', 'font-weight': 700 }, 'LOCK HELD'));
        } else if (done && s.reserve) {
          parts.push(K.t('text', { x: W - 86, y: y + 17, 'text-anchor': 'end', 'font-size': 9.5,
            fill: 'var(--warning-dark)' }, 'reserved'));
        } else if (done && s.committed) {
          parts.push(K.t('text', { x: W - 86, y: y + 17, 'text-anchor': 'end', 'font-size': 9.5,
            fill: 'var(--accent-dark)', 'font-weight': 700 }, 'VISIBLE TO ALL'));
        }
      });

      return K.svg('0 0 ' + W + ' ' + H, parts.join(''), p.label + ' step ' + state.at);
    }

    function renderFailPicker() {
      var p = proto();
      var html = '<span class="anim-seg" role="group" aria-label="Failure point">' +
        '<button type="button" data-fail="-1" aria-pressed="' + (state.failAt === -1 ? 'true' : 'false') + '">none</button>';
      p.steps.forEach(function (s, i) {
        html += '<button type="button" data-fail="' + i + '" aria-pressed="' +
          (state.failAt === i ? 'true' : 'false') + '">' + (i + 1) + '</button>';
      });
      return html + '</span>';
    }

    function render() {
      var p = proto();
      o.failpicker.innerHTML = renderFailPicker();
      o.svg.innerHTML = draw();

      Array.prototype.forEach.call(stage.querySelectorAll('[data-pick]'), function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-pick') === state.proto ? 'true' : 'false');
      });
      stage.querySelector('[data-act="step"]').disabled = !!state.outcome || state.at >= p.steps.length;
      stage.querySelector('[data-act="run"]').disabled = !!state.outcome || state.at >= p.steps.length;

      if (state.outcome) {
        o.note.innerHTML = '<strong>' + K.esc(state.outcome.kind.toUpperCase()) + '.</strong> ' + state.outcome.text;
      } else if (state.at >= p.steps.length) {
        o.note.innerHTML = '<strong>Committed cleanly.</strong> Every protocol looks the same when nothing goes wrong — ' +
          'which is exactly why the choice between them cannot be made on the happy path. Pick a failure point above ' +
          'and run it again.';
      } else {
        o.note.innerHTML = {
          twopc: 'A coordinator asks every participant to prepare, then tells them all to commit. Participants hold ' +
            'their locks from prepare until commit. Fail it at step 4 or later to see the problem.',
          tcc: 'Reserve first, decide second. Each Try is an ordinary local transaction, so no remote lock is ever ' +
            'held — but every service has to implement Try, Confirm and Cancel.',
          saga: 'Each step commits for real, immediately. Nothing blocks and nothing is locked — but there is no ' +
            'rollback either, only compensation, and the intermediate states are visible to everyone.'
        }[state.proto];
      }
    }

    function stepOnce() {
      var p = proto();
      if (state.outcome || state.at >= p.steps.length) return false;
      if (state.failAt === state.at) {
        state.at++;
        state.outcome = p.onFail(state.failAt);
        return false;
      }
      state.at++;
      return true;
    }

    K.onClick(stage, function (b) {
      var pick = b.getAttribute('data-pick');
      if (pick) { state.proto = pick; state.at = 0; state.outcome = null; state.failAt = -1; render(); return; }

      var fail = b.getAttribute('data-fail');
      if (fail !== null) { state.failAt = parseInt(fail, 10); state.at = 0; state.outcome = null; render(); return; }

      switch (b.getAttribute('data-act')) {
        case 'step': stepOnce(); break;
        case 'run': while (stepOnce()) { /* until done or failed */ } break;
        case 'reset': state.at = 0; state.outcome = null; break;
        default: return;
      }
      render();
    });

    render();
  });
})();
