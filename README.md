# Learning Path

Five self-paced, offline-first study sites — C# & .NET, System Design, DSA, LLD and
the Interview Playbook. Everything is static HTML, CSS and plain JavaScript: no
framework, no CDN, no runtime dependencies. The only build step regenerates the
System Design site from its markdown notes.

Start at [`index.html`](index.html).

## Run it on localhost

Any static file server pointed at the repo root works. Pick one:

### Python (no install needed)

```bash
python3 -m http.server 8765 --directory .
```

Then open <http://localhost:8765/>.

### Node

```bash
npx --yes serve -l 8765 .
```

### Claude Code / VS Code preview

`.claude/launch.json` already defines a `learning-path` configuration that runs the
Python server above on port 8765, so the preview pane can start it directly.

Stop any of these with `Ctrl+C`.

The port is arbitrary — if 8765 is already taken by something else, any free
port works; just change it in the command (and in `.claude/launch.json` if you
use the preview pane).

## Or just open the files

The sites are built to work straight off disk — double-click `index.html` and
everything, including the interactive explainers, renders over `file://`.

One caveat: **Safari blocks `localStorage` on `file://`**, so visited-topic
tracking and the progress bars do not persist there. `visited.js` detects this and
shows a banner. Chrome and Firefox are fine, and serving over `http://localhost`
fixes it everywhere — that's the main reason to bother with a server.

Each site namespaces its own storage keys, so progress on one track never bleeds
into another.

## Rebuilding the System Design site

`SystemDesign/` and the root `index.html` are **generated** from
`system-design-notes/`. Edit the markdown, never the generated HTML, then:

```bash
cd tools && npm install
node build-system-design.mjs
```

`npm install` is only needed the first time. A cold build takes ~12s (Mermaid
diagrams render once and are cached in `tools/.cache/`); a warm one ~0.1s. The
build **exits non-zero if any internal link breaks**, which is the guard against
shipping a broken site with 390+ hand-written cross-chapter links.

Useful flags: `--no-mermaid` (skip diagram rendering for fast HTML iteration),
`--quiet`.

The other four sites are hand-authored — edit their HTML under `DotNet/`, `DSA/`,
`LLD/` and `Playbook/` directly; there is nothing to build.

See [`tools/README.md`](tools/README.md) for how the generator works and how to add
an interactive explainer.

## Requirements

| What | Needed for | Verified with |
|---|---|---|
| A browser | reading the sites | — |
| Python 3 *or* Node | serving over `http://localhost` | Python 3.13, Node 24 |
| Node + npm | rebuilding the System Design site | Node 24, npm 11 |

## Layout

```
index.html              generated landing page
DotNet/ DSA/ LLD/ Playbook/   hand-authored sites
SystemDesign/           generated from system-design-notes/
system-design-notes/    the markdown source of truth
tools/                  build script, animation modules, dev deps
```
