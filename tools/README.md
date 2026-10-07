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

Animation sources live in `anim/` and are copied to
`SystemDesign/assets/js/` by the build. Both are plain IIFEs with no shared
framework, honour `prefers-reduced-motion`, are keyboard-operable, and pause
when scrolled out of view.

## .claude/launch.json

Serves the repo root on port 8765 so the sites can be previewed over `http://`
(the sites also open fine straight from disk, except that Safari blocks
`localStorage` on `file://` — `visited.js` detects that and shows a banner).
