/* ==========================================================================
   visited.js — remembers which topic pages you have opened
   --------------------------------------------------------------------------
   State lives in localStorage as { topicId: "ISO date" }. Safari blocks
   localStorage on file:// pages, so we probe once and fall back to an
   in-memory store (the page still works, state just does not persist).

   Any page with <body data-topic="core-concepts"> is marked visited on load.
   Exposes window.VISITED = { all, isVisited, mark, reset, count, storageOk }
   and fires a "visited:change" event on document whenever state changes.
   ========================================================================== */

(function () {
  'use strict';

  var KEY = 'learningPath.v1.visited';
  var memory = null;

  var storageOk = (function () {
    try {
      var t = '__lp_test__';
      window.localStorage.setItem(t, '1');
      window.localStorage.removeItem(t);
      return true;
    } catch (e) { return false; }
  })();

  function load() {
    if (!storageOk) return memory || {};
    try { return JSON.parse(window.localStorage.getItem(KEY) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function save(state) {
    if (storageOk) {
      try { window.localStorage.setItem(KEY, JSON.stringify(state)); return; } catch (e) { /* fall through */ }
    }
    memory = state;
  }
  function emit() {
    try { document.dispatchEvent(new CustomEvent('visited:change')); } catch (e) { /* old browsers */ }
  }

  var api = {
    storageOk: storageOk,
    all: function () { return load(); },
    isVisited: function (id) { return Object.prototype.hasOwnProperty.call(load(), id); },
    count: function () { return Object.keys(load()).length; },
    mark: function (id) {
      if (!id) return;
      var s = load();
      if (!s[id]) { s[id] = new Date().toISOString(); save(s); emit(); }
    },
    reset: function () { save({}); emit(); }
  };
  window.VISITED = api;

  document.addEventListener('DOMContentLoaded', function () {
    var id = document.body.getAttribute('data-topic');
    if (id) api.mark(id);

    // Storage warning (only shown where a .storage-banner placeholder exists)
    if (!storageOk) {
      var b = document.querySelector('.storage-banner');
      if (b) {
        b.classList.add('show');
        b.innerHTML = '<strong>Visited state will not be saved in this browser.</strong> ' +
          'Safari blocks local storage on <code>file://</code> pages. Serve the folder instead: ' +
          '<code>python3 -m http.server 8000 --directory ~/Learning_path</code> then open ' +
          '<code>http://localhost:8000/</code>.';
      }
    }
  });
})();
