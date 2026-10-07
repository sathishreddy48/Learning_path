# tools/

Build scripts for the static study sites in this repo. Dev-only — the generated
sites themselves have no runtime dependencies, no CDN, and work offline over
`file://`.

## build-system-design.mjs

Generates `SystemDesign/` and the root `index.html` from `system-design-notes/`.

```bash
cd tools && npm install        # once
node build-system-design.mjs
```

The markdown is the single source of truth and is **never modified**. Every word
on the generated site — chapter titles, section titles, dashboard card blurbs —
is extracted from the notes. Edit a note, re-run the build, and the site catches
up. The only text authored here is the four sidebar group labels and the
dashboard's "how to use this site" box.

| Flag | Effect |
|---|---|
| `--no-mermaid` | Skip Mermaid rendering (fast iteration on the HTML conversion). Diagrams fall back to showing their source. |
| `--quiet` | Suppress the per-page log and the report. |

Mermaid SVGs are cached in `.cache/mermaid/` keyed by diagram content: a cold
build takes ~12s, a warm one ~0.1s. Delete the folder to force a re-render.

The build **fails with a non-zero exit code if any internal link breaks**. With
390+ cross-chapter links written by hand in the notes, that check is the main
guard against silently shipping a broken site.

### What it has to handle

Things in these notes that a naive markdown-to-HTML conversion gets wrong:

- **Images are raw HTML**, not markdown — 388 `<img src="./images/…" width="450">`
  tags and zero `![]()`. A converter passes them straight through, so their `src`
  is rewritten afterwards to point back at `system-design-notes/`, and `width`
  becomes an inline `max-width` so the authored sizing survives but still
  shrinks on a phone.
- **Cross-chapter links use GitHub's directory + heading-slug form**, e.g.
  `](../01. Scaling/#section-6-caching)`. Anchor generation matches GitHub's
  slugifier exactly, including the `-1` suffix on repeated headings (four
  chapters need it). `Gotchas & failure modes` → `gotchas--failure-modes`: the
  double dash is correct, the `&` is dropped and each surviving space becomes a
  dash.
- **Chapter folders are inconsistently named** — `Readme.md` vs `README.md`, and
  `27.  Digital Wallet` has a double space. Everything is globbed.
- **Mermaid's SVG ids** are all `my-svg`, and mermaid scopes the diagram's whole
  stylesheet behind `#my-svg .node` selectors. The id is renamed per diagram
  rather than removed — deleting it strips all theming and the nodes render as
  black boxes.

### Site assets

`SystemDesign/assets/` is copied from `DotNet/assets/` with three deliberate
changes, all applied by the build (`DotNet/` is never modified):

- **`visited.js` / `nav.js`: namespaced storage keys.** `VISITED.count()` counts
  every key in the store, so sharing `learningPath.v1.visited` would make the C#
  site's visited topics inflate this site's progress bar and vice versa.
- **`code-tabs.js`: two comment markers** — `text: null` (189 bare fences land on
  `data-lang="text"`; without this the highlighter eats `//` in prose as a
  comment) and `sql: '#'` (these notes comment SQL MySQL-style, never with `--`).
- **`site.css`: `site-additions.css` appended** for the components the C# site
  does not have — the notes' raw `<img>` diagrams, Mermaid figures, section
  accents and the interactive explainers. Nothing existing is edited.

Mermaid figures sit on a permanently light panel in both themes, because the
SVGs are rendered once with the light palette baked in. That matches how the
notes' PNG diagrams already behave; the alternative is shipping two renders of
all 40 diagrams.

## animations.json

Declares where the interactive explainers are injected — `{ chapter slug →
[{ afterSection, module, mount, title, caption }] }`. `afterSection` is a
heading's GitHub anchor slug. **The markdown is never edited to make room for
them**, and if `afterSection` does not match a real section the build fails
loudly rather than dropping the animation silently.

`title` is plain text and is HTML-escaped by the build, so write literal
characters (`>`, not `&gt;`). `caption` is injected as HTML and may contain
tags such as `<code>`.

Sources live in `anim/` and every `*.js` there is published automatically;
`_kit.js` is special and becomes `anim-kit.js`, loaded before any module on
pages that have one. Thirteen chapters currently carry one:

| Chapter | Explainer | What it makes visible |
|---|---|---|
| 4 Rate Limiter | five algorithms, one request stream | the fixed window passing 2× the budget across a boundary |
| 5 Consistent Hashing | the ring | ~1/N keys move on the ring vs ~(N−1)/N with `hash % N` |
| 6 Key-Value Store | quorum N/W/R | why `W + R > N` is just pigeonhole |
| 7 Unique ID Generator | the 64-bit budget | every bit one field gains, another loses |
| 11 News Feed | fan-out on write vs read | one celebrity post costing 40M writes |
| 13 Search Autocomplete | trie + cached top-k | the walk is cheap, the subtree scan is not |
| 16 Proximity Service | geohash cells | two points 1.5 km apart sharing no prefix |
| 19 Message Queue | partitions & consumer groups | partition count as a hard ceiling on parallelism |
| 21 Ad Click Aggregation | event time & watermarks | completeness traded against latency |
| 24 Object Storage | erasure coding vs replication | same durability, half the storage |
| 25 Leaderboard | skip list search | 7.3 average comparisons against 12.0 |
| 27 Digital Wallet | 2PC vs TCC vs Saga | identical on the happy path, divergent under failure |
| 28 Stock Exchange | order book matching | price-time priority as the only rule |

### Writing another one

Add `anim/anim-<name>.js`, then an entry in `animations.json`. The module is a
plain IIFE with no build step:

```js
(function () {
  'use strict';
  var K = window.ANIMKIT;
  K.register('anim-<mount>', function (stage, fig) {
    stage.innerHTML = '…';
    // K.esc, K.t, K.svg, K.btn, K.seg, K.stat, K.outs, K.onClick,
    // K.onVisible, K.clamp, K.reduceMotion
  });
})();
```

`K.register` contains anything the module throws, so a bug in one explainer
shows a fallback line in that figure instead of blanking the chapter.

Conventions that matter: colours come from CSS variables (`var(--primary)`,
not a hex) so the figures follow the light and dark themes; anything that
ticks pauses off-screen via `K.onVisible` and does not auto-run under
`prefers-reduced-motion`; and the numbers on screen should be computed, not
asserted — the point of these is that the chapter's claim can be checked.

## .claude/launch.json

Serves the repo root on port 8765 so the sites can be previewed over `http://`
(the sites also open fine straight from disk, except that Safari blocks
`localStorage` on `file://` — `visited.js` detects that and shows a banner).
