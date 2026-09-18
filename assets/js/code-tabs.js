/* ==========================================================================
   code-tabs.js — per-snippet language tabs, copy button, tiny highlighter
   --------------------------------------------------------------------------
   Markup:
     <div class="code-tabs">
       <div class="code-tabs-bar" role="tablist">
         <button role="tab" aria-selected="true" data-lang="csharp">C#</button>
         <button role="tab" data-lang="python">Python</button>
         <button class="code-copy" type="button">Copy</button>
       </div>
       <pre data-lang="csharp"><code>…</code></pre>
       <pre data-lang="python" hidden><code>…</code></pre>
     </div>
   The highlighter is regex based and deliberately small — no CDN, works
   offline. It only wraps keywords, strings, comments, numbers and types.
   ========================================================================== */

(function () {
  'use strict';

  var KW = {
    csharp: 'abstract as async await base bool break byte case catch char checked class const continue decimal default delegate do double else enum event explicit extern false finally fixed float for foreach get goto if implicit in init int interface internal is lock long namespace new null object operator out override params private protected public readonly record ref required return sbyte sealed set short sizeof stackalloc static string struct switch this throw true try typeof uint ulong unchecked unsafe ushort using var virtual void volatile when where while yield with global nameof',
    python: 'False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield self print len range str int float list dict set tuple bool',
    yaml: 'true false null',
    json: 'true false null',
    bash: 'if then else fi for do done in echo export case esac while local exit',
    bicep: 'resource module param var output targetScope existing for in if else true false null using',
    hcl: 'resource variable output module provider terraform locals data backend required_providers for_each count true false null each var local',
    dockerfile: 'FROM RUN COPY ADD WORKDIR ENV ARG EXPOSE CMD ENTRYPOINT USER HEALTHCHECK LABEL VOLUME AS',
    kql: 'let where summarize project extend order by take top join union render count countif sum avg min max percentile bin ago distinct asc desc and or not has contains startswith in between',
    xml: '',
    sql: 'SELECT FROM WHERE AND OR NOT IN GROUP BY ORDER BY LIMIT JOIN ON AS INSERT UPDATE DELETE CREATE TABLE'
  };
  /* line-comment marker per language; languages absent here use '//' */
  var LINE_COMMENT = { python: '#', yaml: '#', bash: '#', hcl: '#', dockerfile: '#', xml: null, json: '//' };
  var TYPES = {
    csharp: /\b([A-Z][A-Za-z0-9_]*)(?=\s*[<(\.\s\[]|\b)/g,
    python: /\b([A-Z][A-Za-z0-9_]*)\b/g
  };

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function highlight(src, lang) {
    var out = '';
    var i = 0, n = src.length;
    var kw = (KW[lang] || '').split(' ');
    var isKw = {};
    kw.forEach(function (k) { isKw[k] = true; });
    var lineComment = LINE_COMMENT.hasOwnProperty(lang) ? LINE_COMMENT[lang] : '//';
    var typeRe = TYPES[lang];

    function flushIdent(word) {
      if (isKw[word]) return '<span class="k">' + word + '</span>';
      if (/^\d/.test(word)) return '<span class="n">' + word + '</span>';
      if (typeRe && /^[A-Z]/.test(word) && lang !== 'yaml') return '<span class="t">' + word + '</span>';
      return esc(word);
    }

    while (i < n) {
      var ch = src[i];
      // comments
      if (lineComment && src.substr(i, lineComment.length) === lineComment) {
        var e = src.indexOf('\n', i); if (e === -1) e = n;
        out += '<span class="c">' + esc(src.slice(i, e)) + '</span>'; i = e; continue;
      }
      if (lang === 'xml' && src.substr(i, 4) === '<!--') {
        var ex = src.indexOf('-->', i + 4); ex = ex === -1 ? n : ex + 3;
        out += '<span class="c">' + esc(src.slice(i, ex)) + '</span>'; i = ex; continue;
      }
      if (lang === 'csharp' && ch === '/' && src[i + 1] === '*') {
        var e2 = src.indexOf('*/', i + 2); e2 = e2 === -1 ? n : e2 + 2;
        out += '<span class="c">' + esc(src.slice(i, e2)) + '</span>'; i = e2; continue;
      }
      if (lang === 'python' && (src.substr(i, 3) === '"""' || src.substr(i, 3) === "'''")) {
        var q3 = src.substr(i, 3);
        var e3 = src.indexOf(q3, i + 3); e3 = e3 === -1 ? n : e3 + 3;
        out += '<span class="s">' + esc(src.slice(i, e3)) + '</span>'; i = e3; continue;
      }
      // strings (handles $"..." and @"..." prefixes by treating prefix as ident)
      if (ch === '"' || ch === "'") {
        var j = i + 1;
        while (j < n && src[j] !== ch) { if (src[j] === '\\') j++; if (src[j] === '\n' && ch === "'") break; j++; }
        j = Math.min(j + 1, n);
        out += '<span class="s">' + esc(src.slice(i, j)) + '</span>'; i = j; continue;
      }
      // identifiers / numbers
      if (/[A-Za-z_@$]/.test(ch) || /[0-9]/.test(ch)) {
        var k = i;
        while (k < n && /[A-Za-z0-9_@$.]/.test(src[k]) && !(src[k] === '.' && !/[0-9]/.test(src[k - 1]))) k++;
        var word = src.slice(i, k);
        if (word.indexOf('.') !== -1 && !/^[0-9]/.test(word)) { // e.g. 3.14 only; split others
          out += esc(word); i = k; continue;
        }
        out += flushIdent(word); i = k; continue;
      }
      out += esc(ch); i++;
    }
    return out;
  }

  function copyText(text, btn) {
    function done(ok) {
      var old = btn.textContent;
      btn.textContent = ok ? 'Copied' : 'Copy failed';
      setTimeout(function () { btn.textContent = old; }, 1400);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      return;
    }
    try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      done(ok);
    } catch (e) { done(false); }
  }

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('.code-tabs'), function (box) {
      // highlight every <pre data-lang> once
      Array.prototype.forEach.call(box.querySelectorAll('pre[data-lang]'), function (pre) {
        var code = pre.querySelector('code') || pre;
        var lang = pre.getAttribute('data-lang');
        code.innerHTML = highlight(code.textContent.replace(/^\n+/, '').replace(/\s+$/, ''), lang);
      });

      var bar = box.querySelector('.code-tabs-bar');
      if (!bar) return;
      if (!bar.querySelector('.code-copy')) {
        var cp = document.createElement('button');
        cp.type = 'button'; cp.className = 'code-copy'; cp.textContent = 'Copy';
        bar.appendChild(cp);
      }

      bar.addEventListener('click', function (e) {
        var t = e.target.closest ? e.target.closest('button') : null;
        if (!t) return;
        if (t.classList.contains('code-copy')) {
          var vis = box.querySelector('pre[data-lang]:not([hidden])');
          if (vis) copyText(vis.textContent, t);
          return;
        }
        if (t.getAttribute('role') !== 'tab') return;
        var lang = t.getAttribute('data-lang');
        Array.prototype.forEach.call(bar.querySelectorAll('[role="tab"]'), function (x) {
          x.setAttribute('aria-selected', x === t ? 'true' : 'false');
        });
        Array.prototype.forEach.call(box.querySelectorAll('pre[data-lang]'), function (p) {
          p.hidden = p.getAttribute('data-lang') !== lang;
        });
      });
    });
  });
})();
