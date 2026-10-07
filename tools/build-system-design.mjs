#!/usr/bin/env node
/* ==========================================================================
   build-system-design.mjs
   --------------------------------------------------------------------------
   Generates ../SystemDesign/ from ../system-design-notes/*.md.

   The markdown is the single source of truth and is never modified: every
   word on the generated site is extracted from it. Re-run this after editing
   a note and the site catches up.

   What it has to cope with, all verified against the actual notes:
     - Chapter folders are inconsistently named (Readme.md vs README.md, and
       "27.  Digital Wallet" has a double space), so everything is globbed.
     - Images are raw HTML <img src="./images/..." width="450">, not markdown
       ![](), so a markdown converter passes them straight through and their
       src has to be rewritten afterwards.
     - 100+ cross-chapter links use GitHub's directory + heading-slug form,
       e.g. ](../01. Scaling/#section-6-caching). Anchor generation must match
       GitHub's slugifier exactly, including the -1 suffix on repeats.
     - 38 ```mermaid blocks, pre-rendered to inline SVG so the site stays
       offline-first with no runtime JS.

   Usage:  node build-system-design.mjs [--no-mermaid] [--quiet]
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import MarkdownIt from 'markdown-it';

const execFileAsync = promisify(execFile);

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const NOTES = path.join(ROOT, 'system-design-notes');
const OUT = path.join(ROOT, 'SystemDesign');
const DOTNET_ASSETS = path.join(ROOT, 'DotNet', 'assets');
const CACHE = path.join(HERE, '.cache', 'mermaid');

const ARGS = new Set(process.argv.slice(2));
const NO_MERMAID = ARGS.has('--no-mermaid');
const QUIET = ARGS.has('--quiet');

const SITE_TITLE = 'System Design';
const SITE_SUBTITLE = 'Alex Xu Vol 1 & 2 · 28 chapters';

/* Relative path from SystemDesign/chapters/*.html back to the notes folder,
   used for images. Spaces are percent-encoded so file:// is happy. */
const NOTES_REL = '../../system-design-notes';

const log = (...a) => { if (!QUIET) console.log(...a); };
const warn = (...a) => console.warn(...a);

/* ==========================================================================
   1. GitHub-compatible heading slugs
   --------------------------------------------------------------------------
   GitHub lowercases, strips anything that is not a word char / space / dash,
   turns spaces into dashes, and appends -1, -2 … to repeats within a document.

   Verified against real links in the notes:
     "Section 6: Caching"        -> section-6-caching
     "Gotchas & failure modes"   -> gotchas--failure-modes
   The double dash is not a typo: the "&" is removed first, leaving two
   spaces, and each becomes a dash.
   ========================================================================== */
function slugify(text) {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[ -⁯⸀-⹿\\'"!@#$%^&*()+=~`[\]{}|:;,.<>?/]/g, '')
    .replace(/\s/g, '-');
}

function makeSlugger() {
  const seen = new Map();
  return (text) => {
    const base = slugify(text);
    if (!seen.has(base)) { seen.set(base, 0); return base; }
    const n = seen.get(base) + 1;
    seen.set(base, n);
    return `${base}-${n}`;
  };
}

/* ==========================================================================
   2. Chapter discovery
   ========================================================================== */
function discover() {
  const dirs = fs.readdirSync(NOTES, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d+\./.test(d.name))
    .map((d) => d.name)
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  const chapters = dirs.map((dir) => {
    const entries = fs.readdirSync(path.join(NOTES, dir));
    const mdName = entries.find((f) => /^readme\.md$/i.test(f));
    if (!mdName) throw new Error(`No Readme.md in "${dir}"`);
    const num = parseInt(dir, 10);
    // "05. Consistent Hashing" -> "05-consistent-hashing"
    const namePart = dir.replace(/^\d+\.\s*/, '');
    const slug = `${String(num).padStart(2, '0')}-${slugify(namePart)}`;
    return {
      kind: 'chapter',
      num,
      dir,
      mdPath: path.join(NOTES, dir, mdName),
      slug,
      out: `${slug}.html`,
    };
  });

  const patterns = {
    kind: 'page',
    num: 0,
    dir: null,
    mdPath: path.join(NOTES, 'Patterns.md'),
    slug: 'patterns',
    out: 'patterns.html',
  };

  return { chapters, patterns };
}

/* ==========================================================================
   3. Mermaid: extract, render once, cache by content hash
   ========================================================================== */
/* Tokenize with markdown-it rather than regex: some mermaid fences are
   indented inside list items, which a ^``` anchored regex misses, and the
   extraction must agree exactly with what the fence renderer later asks for. */
const scanner = new MarkdownIt({ html: true });

function extractMermaid(mdText) {
  const out = [];
  const walk = (tokens) => {
    for (const t of tokens) {
      if (t.type === 'fence' && (t.info || '').trim().toLowerCase() === 'mermaid') out.push(t.content);
      if (t.children) walk(t.children);
    }
  };
  walk(scanner.parse(mdText, {}));
  return out;
}

async function renderMermaidAll(sources) {
  const map = new Map();
  if (!sources.length) return { map, fresh: 0, cached: 0 };

  fs.mkdirSync(CACHE, { recursive: true });
  const mmdc = path.join(HERE, 'node_modules', '.bin', 'mmdc');
  const themeCfg = path.join(HERE, 'mermaid-theme.json');
  const pptrCfg = path.join(HERE, 'puppeteer-config.json');

  let fresh = 0; let cached = 0;
  const unique = [...new Set(sources)];

  for (const src of unique) {
    const hash = crypto.createHash('sha1').update(src).digest('hex').slice(0, 16);
    const svgPath = path.join(CACHE, `${hash}.svg`);

    if (fs.existsSync(svgPath)) {
      map.set(src, postProcessSvg(fs.readFileSync(svgPath, 'utf8'), hash));
      cached++;
      continue;
    }
    if (NO_MERMAID) continue;

    const mmdPath = path.join(CACHE, `${hash}.mmd`);
    fs.writeFileSync(mmdPath, src, 'utf8');
    try {
      await execFileAsync(mmdc, [
        '-i', mmdPath,
        '-o', svgPath,
        '-c', themeCfg,
        '-p', pptrCfg,
        '-b', 'transparent',
        '--quiet',
      ], { cwd: HERE, timeout: 120000 });
      map.set(src, postProcessSvg(fs.readFileSync(svgPath, 'utf8'), hash));
      fresh++;
      log(`  mermaid ${hash} rendered`);
    } catch (e) {
      warn(`  ! mermaid render failed (${hash}): ${String(e.message).split('\n')[0]}`);
    } finally {
      try { fs.unlinkSync(mmdPath); } catch { /* ignore */ }
    }
  }
  return { map, fresh, cached };
}

/* mmdc hard-codes a white background and gives every diagram the same id,
   "my-svg". That id cannot simply be deleted: mermaid scopes the diagram's
   entire stylesheet behind "#my-svg .node" selectors, so removing it drops
   all the theming and the nodes render as browser-default black boxes. The
   id is renamed per diagram instead, which both keeps the styles working and
   stops several diagrams on one page colliding. */
function postProcessSvg(svg, id) {
  return svg
    .replace(/<\?xml[^>]*\?>\s*/i, '')
    .replace(/background-color:\s*white;?/gi, '')
    .replace(/my-svg/g, 'mmd-' + id)   /* plain global: marker ids use my-svg_… , which a \b would miss */
    .trim();
}

/* ==========================================================================
   4. markdown-it, configured to emit the DotNet site's components
   ========================================================================== */
function createRenderer(ctx) {
  const md = new MarkdownIt({
    html: true,        // the notes contain raw <img> / <p align> / <br/>
    linkify: false,
    typographer: false,
    breaks: false,
  });

  /* ---- headings: ids + H2 section wrapping ----------------------------- */
  md.renderer.rules.heading_open = (tokens, idx) => {
    const tag = tokens[idx].tag;
    const text = tokens[idx + 1].content;
    const id = ctx.slug(text);
    ctx.headingIds.add(id);

    if (tag === 'h2') {
      ctx.sections.push({ id, label: text });
      const kind = sectionKind(id);
      const close = ctx.sectionOpen ? '</section>\n' : '';
      ctx.sectionOpen = true;
      const kindAttr = kind ? ` data-kind="${kind}"` : '';
      return `${close}<section id="${id}"${kindAttr}>\n<h2 id="${id}">`;
    }
    /* H3 "Gotchas & failure modes" etc. get a hook for CSS, and keep their
       id because other chapters link straight at them. */
    const cls = headingClass(id);
    return `<${tag} id="${id}"${cls ? ` class="${cls}"` : ''}>`;
  };

  /* ---- links: rewrite the GitHub-relative forms ------------------------ */
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const hrefIdx = token.attrIndex('href');
    if (hrefIdx >= 0) {
      const raw = token.attrs[hrefIdx][1];
      const rewritten = rewriteHref(raw, ctx);
      token.attrs[hrefIdx][1] = rewritten.href;
      if (rewritten.external) {
        token.attrSet('target', '_blank');
        token.attrSet('rel', 'noopener');
      }
      if (rewritten.internal) ctx.internalLinks.push({ href: rewritten.href, from: ctx.slugName });
    }
    return self.renderToken(tokens, idx, options);
  };

  /* ---- tables: wrap for horizontal scroll on narrow screens ------------ */
  md.renderer.rules.table_open = () => '<div class="table-wrap">\n<table>\n';
  md.renderer.rules.table_close = () => '</table>\n</div>\n';

  /* ---- fences: mermaid -> inline SVG, everything else -> .code-tabs ---- */
  md.renderer.rules.fence = (tokens, idx) => {
    const token = tokens[idx];
    const info = (token.info || '').trim().toLowerCase();
    const code = token.content;

    if (info === 'mermaid') {
      const svg = ctx.mermaid.get(code);
      ctx.mermaidSeen++;
      if (svg) {
        ctx.mermaidInlined++;
        return `<figure class="mermaid-fig">\n${svg}\n</figure>\n`;
      }
      /* No SVG available (render failed, or --no-mermaid): keep the source
         visible rather than dropping the diagram entirely. */
      return `<div class="code-tabs code-tabs-fallback">` +
        `<div class="code-tabs-bar" role="tablist">` +
        `<button role="tab" aria-selected="true" data-lang="text">mermaid (not rendered)</button>` +
        `</div><pre data-lang="text"><code>${escapeHtml(code)}</code></pre></div>\n`;
    }

    const lang = LANG_ALIASES[info] || (info && KNOWN_LANGS.has(info) ? info : 'text');
    const label = LANG_LABELS[lang] || (info ? info : 'text');
    return `<div class="code-tabs">` +
      `<div class="code-tabs-bar" role="tablist">` +
      `<button role="tab" aria-selected="true" data-lang="${lang}">${escapeHtml(label)}</button>` +
      `</div>` +
      `<pre data-lang="${lang}"><code>${escapeHtml(code)}</code></pre>` +
      `</div>\n`;
  };

  return md;
}

const KNOWN_LANGS = new Set(['sql', 'yaml', 'json', 'bash', 'python', 'csharp', 'text', 'xml']);
const LANG_ALIASES = { yml: 'yaml', sh: 'bash', shell: 'bash', js: 'text', py: 'python', cs: 'csharp', plaintext: 'text', '': 'text' };
const LANG_LABELS = { sql: 'SQL', yaml: 'YAML', json: 'JSON', bash: 'Shell', python: 'Python', csharp: 'C#', text: 'Example', xml: 'XML' };

function sectionKind(id) {
  if (id === 'self-check' || id.startsWith('self-check')) return 'self-check';
  if (id === 'glossary' || id.startsWith('glossary')) return 'glossary';
  if (id.startsWith('where-to-go-next')) return 'further';
  return '';
}
function headingClass(id) {
  if (id.startsWith('gotchas')) return 'h-gotchas';
  return '';
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ==========================================================================
   5. Link rewriting
   --------------------------------------------------------------------------
   Forms found in the notes:
     ../05. Consistent Hashing/              -> 05-consistent-hashing.html
     ../05. Consistent Hashing/#anchor       -> 05-consistent-hashing.html#anchor
     ./28. Stock Exchange/                   -> 28-stock-exchange.html   (root Readme)
     ./Patterns.md                           -> patterns.html
     #anchor                                 -> unchanged
     https://…                               -> unchanged, opened in a new tab
   ========================================================================== */
function rewriteHref(raw, ctx) {
  let href = raw;

  if (/^(https?:|mailto:|tel:)/i.test(href)) return { href, external: true };
  if (href.startsWith('#')) return { href, internal: true };

  const decoded = decodeURIComponent(href);

  // split off the anchor
  const hashAt = decoded.indexOf('#');
  const target = hashAt === -1 ? decoded : decoded.slice(0, hashAt);
  const anchor = hashAt === -1 ? '' : decoded.slice(hashAt);

  const bare = target.replace(/^\.\.?\//, '').replace(/\/+$/, '');

  if (/^patterns\.md$/i.test(bare)) return { href: `patterns.html${anchor}`, internal: true };

  // "05. Consistent Hashing" or "05. Consistent Hashing/Readme.md"
  const dirPart = bare.replace(/\/?(readme\.md)$/i, '');
  const hit = ctx.dirToSlug.get(dirPart) || ctx.dirToSlug.get(dirPart.replace(/\s+/g, ' '));
  if (hit) return { href: `${hit}.html${anchor}`, internal: true };

  if (target === '' && anchor) return { href: anchor, internal: true };

  // Anything else (stray relative path) is left alone but reported.
  ctx.unresolvedHrefs.push({ raw, from: ctx.slugName });
  return { href, internal: false };
}

/* ==========================================================================
   6. Blockquote -> callout transform (token level, before rendering)
   --------------------------------------------------------------------------
   "> **Interview angle:** …"  (52 of them)  -> .callout.callout-interview
   "> **A note on these figures:** …"        -> .callout.callout-note
   A bold lead-in only counts as a title when it ends in a colon and is short.
   That keeps "> **Shard last.** Sharding is…" and
   "> **When a network partition occurs, …**" as ordinary pull-quotes instead
   of mangling them into titles.
   ========================================================================== */
function transformCallouts(tokens) {
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type !== 'blockquote_open') continue;

    const level = tokens[i].level;
    let close = -1;
    for (let j = i + 1; j < tokens.length; j++) {
      if (tokens[j].type === 'blockquote_close' && tokens[j].level === level) { close = j; break; }
    }
    if (close === -1) continue;

    let kind = 'quote';
    let title = '';

    const pOpen = tokens[i + 1];
    const inline = tokens[i + 2];
    if (pOpen && pOpen.type === 'paragraph_open' && inline && inline.type === 'inline') {
      const ch = inline.children || [];
      /* markdown-it emits a leading empty text token before inline markup,
         so the <strong> is not necessarily at index 0. */
      let s = 0;
      while (ch[s] && ch[s].type === 'text' && ch[s].content === '') s++;

      if (ch[s] && ch[s].type === 'strong_open' &&
          ch[s + 1] && ch[s + 1].type === 'text' &&
          ch[s + 2] && ch[s + 2].type === 'strong_close') {
        const label = ch[s + 1].content.trim();
        if (/:$/.test(label) && label.length <= 48) {
          title = label.replace(/:$/, '').trim();
          kind = /^interview angle$/i.test(title) ? 'interview' : 'note';
          // drop the <strong> lead-in; it becomes the callout title
          ch.splice(s, 3);
          if (ch[s] && ch[s].type === 'text') ch[s].content = ch[s].content.replace(/^\s*:?\s*/, '');
        }
      }
    }

    const titleHtml = title ? `<span class="callout-title">${escapeHtml(title)}</span>\n` : '';
    tokens[i].type = 'html_block';
    tokens[i].content = `<div class="callout callout-${kind}">\n${titleHtml}`;
    tokens[i].block = true;
    tokens[close].type = 'html_block';
    tokens[close].content = '</div>\n';
    tokens[close].block = true;
  }
  return tokens;
}

/* ==========================================================================
   7. Raw-HTML image rewriting (post-render, per chapter)
   --------------------------------------------------------------------------
   The notes' 388 <img> tags are raw HTML with src="./images/x.png" relative to
   the chapter folder. Generated pages live in SystemDesign/chapters/, so point
   them back at the notes folder, percent-encoding the spaces in folder names.
   width="450" becomes style="max-width:450px" so authored sizing survives but
   the image still shrinks on a phone.
   ========================================================================== */
function rewriteImages(html, chapterDir, stats) {
  if (!chapterDir) return html;
  const encDir = chapterDir.split(' ').join('%20');

  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    let out = tag;

    out = out.replace(/src\s*=\s*"\.?\/?images\/([^"]+)"/i, (_m, file) => {
      stats.images++;
      const abs = path.join(NOTES, chapterDir, 'images', decodeURIComponent(file));
      if (!fs.existsSync(abs)) {
        stats.missingImages.push(`${chapterDir}/images/${file}`);
      }
      return `src="${NOTES_REL}/${encDir}/images/${file}"`;
    });

    // width="450" -> inline max-width, and the same for height
    out = out.replace(/\s(width|height)\s*=\s*"(\d+)"/gi, (_m, attr, px) => {
      const prop = attr.toLowerCase() === 'width' ? 'max-width' : 'max-height';
      return ` data-${attr.toLowerCase()}="${px}" style="${prop}:${px}px"`;
    });
    // merge the case where both width and height produced a style attribute
    const styles = [...out.matchAll(/style="([^"]*)"/gi)].map((m) => m[1]);
    if (styles.length > 1) {
      out = out.replace(/\sstyle="[^"]*"/gi, '');
      out = out.replace(/<img/i, `<img style="${styles.join(';')}"`);
    }

    if (!/\balt\s*=/i.test(out)) out = out.replace(/<img/i, '<img alt=""');
    if (!/\bloading\s*=/i.test(out)) out = out.replace(/<img/i, '<img loading="lazy" decoding="async"');
    return out;
  });
}

/* ==========================================================================
   8. Blurb extraction  (extracted from the notes, never written here)
   ========================================================================== */
function extractBlurb(mdText) {
  const oneLiner = mdText.match(/\*\*The one-sentence version:\*\*\s*([^\n]+)/);
  if (oneLiner) return cleanInline(oneLiner[1]);

  // first real paragraph after "## Introduction" (or after the H1)
  const afterIntro = mdText.split(/^##\s+Introduction\s*$/m)[1] || mdText.replace(/^#\s+[^\n]*\n/, '');
  const para = (afterIntro || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find((p) => p && !p.startsWith('#') && !p.startsWith('<') && !p.startsWith('|') && !p.startsWith('>') && !p.startsWith('```'));
  return cleanInline(para || '');
}

function cleanInline(s) {
  return String(s)
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')   // links -> text
    .replace(/[*_`]/g, '')                      // emphasis / code marks
    .replace(/<[^>]+>/g, '')                    // stray tags
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(s, n) {
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  const at = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '), cut.lastIndexOf(', '), cut.lastIndexOf(' '));
  return `${cut.slice(0, at > n * 0.5 ? at : n).replace(/[,;.\s]+$/, '')}…`;
}

/* ==========================================================================
   9. Page template — mirrors DotNet/topics/*.html exactly
   ========================================================================== */
function pageHtml({ title, topicId, breadcrumb, h1, lede, toc, body, animModules }) {
  const tocHtml = toc.length
    ? `  <div class="toc">\n    <h4>On this page</h4>\n    <ol>${toc
        .map((s) => `<li><a href="#${s.id}">${escapeHtml(s.label)}</a></li>`)
        .join('')}</ol>\n  </div>\n`
    : '';
  const animScripts = (animModules || []).length
    ? ['anim-kit.js', ...animModules]
        .map((m) => `<script src="../assets/js/${m}"></script>`)
        .join('\n')
    : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — ${escapeHtml(SITE_TITLE)}</title>
<link rel="stylesheet" href="../assets/css/site.css">
</head>
<body data-root="../" data-topic="${escapeHtml(topicId)}">
<div class="layout">
<main class="main">

  <div class="breadcrumb">${breadcrumb}</div>
  <h1>${escapeHtml(h1)}</h1>
${lede ? `  <p class="lede">${lede}</p>\n` : ''}${tocHtml}
${body}

  <p class="footer-note">Generated from <code>system-design-notes/</code> · Works offline by opening <code>index.html</code> · Visited state is stored locally in your browser · No data leaves this machine.</p>

</main>
</div>
<script src="../assets/js/curriculum.js"></script>
<script src="../assets/js/visited.js"></script>
<script src="../assets/js/nav.js"></script>
<script src="../assets/js/code-tabs.js"></script>
${animScripts}
</body>
</html>
`;
}

/* ==========================================================================
   10. Animation injection
   ========================================================================== */
function injectAnimations(html, slugName, animConfig, ctx, stats) {
  const specs = animConfig[slugName];
  if (!specs || !specs.length) return { html, modules: [] };

  const modules = [];
  let out = html;

  for (const spec of specs) {
    const anchor = `<section id="${spec.afterSection}"`;
    const at = out.indexOf(anchor);
    if (at === -1) {
      throw new Error(
        `Animation for "${slugName}" targets section "#${spec.afterSection}", which does not exist. ` +
        `Available: ${ctx.sections.map((s) => s.id).join(', ')}`
      );
    }
    // find the end of that section
    const endMarker = '</section>';
    const end = out.indexOf(endMarker, at);
    const insertAt = end === -1 ? out.length : end;

    const figure =
      `\n<figure class="anim" id="${spec.mount}" data-anim="${spec.mount}">\n` +
      `  <figcaption class="anim-head">\n` +
      `    <span class="anim-title">${escapeHtml(spec.title)}</span>\n` +
      `    <span class="anim-caption">${spec.caption}</span>\n` +
      `  </figcaption>\n` +
      `  <div class="anim-stage" data-anim-stage>\n` +
      `    <noscript><p class="anim-fallback">This interactive explainer needs JavaScript. The surrounding text and diagrams carry the same information.</p></noscript>\n` +
      `  </div>\n` +
      `</figure>\n`;

    out = out.slice(0, insertAt) + figure + out.slice(insertAt);
    modules.push(spec.module);
    stats.animations++;
  }
  return { html: out, modules };
}

/* ==========================================================================
   11. Build one markdown file into one page
   ========================================================================== */
function buildPage(entry, meta, shared, stats) {
  const mdText = fs.readFileSync(entry.mdPath, 'utf8');

  const ctx = {
    slug: makeSlugger(),
    slugName: entry.slug,
    headingIds: new Set(),
    sections: [],
    sectionOpen: false,
    dirToSlug: shared.dirToSlug,
    mermaid: shared.mermaid,
    mermaidSeen: 0,
    mermaidInlined: 0,
    internalLinks: [],
    unresolvedHrefs: shared.unresolvedHrefs,
  };

  const md = createRenderer(ctx);

  // H1 is the page title; drop it from the body so it is not rendered twice.
  const h1Match = mdText.match(/^#\s+([^\n]+)/m);
  const h1Raw = h1Match ? cleanInline(h1Match[1]) : meta.label;
  const bodyMd = h1Match ? mdText.replace(h1Match[0], '') : mdText;

  const tokens = md.parse(bodyMd, {});
  transformCallouts(tokens);
  let body = md.renderer.render(tokens, md.options, {});
  if (ctx.sectionOpen) body += '</section>\n';

  body = rewriteImages(body, entry.dir, stats);

  const anim = injectAnimations(body, entry.slug, shared.animConfig, ctx, stats);
  body = anim.html;

  stats.mermaidSeen += ctx.mermaidSeen;
  stats.mermaidInlined += ctx.mermaidInlined;
  stats.sections += ctx.sections.length;

  shared.linkTargets.set(entry.out, ctx.headingIds);
  shared.allLinks.push(...ctx.internalLinks.map((l) => ({ ...l, fromFile: entry.out })));

  const html = pageHtml({
    title: h1Raw,
    topicId: entry.slug,
    breadcrumb: meta.breadcrumb,
    h1: h1Raw,
    lede: meta.lede,
    toc: ctx.sections,
    body,
    animModules: anim.modules,
  });

  fs.writeFileSync(path.join(OUT, 'chapters', entry.out), html, 'utf8');
  return { sections: ctx.sections, blurb: extractBlurb(mdText), h1: h1Raw };
}

/* ==========================================================================
   12. curriculum.js — same shape as DotNet/assets/js/curriculum.js
   ========================================================================== */
const GROUP_DEFS = [
  {
    id: 'foundations',
    label: 'Foundations',
    blurb: 'The scaling story, the estimation maths and the interview process itself. Read these first — every chapter after them assumes this vocabulary.',
    match: (e) => e.slug === 'patterns' || (e.num >= 1 && e.num <= 3),
  },
  {
    id: 'building-blocks',
    label: 'Building Blocks',
    blurb: 'Four mechanisms that reappear inside almost every system later in the book. Technique chapters rather than design chapters.',
    match: (e) => e.num >= 4 && e.num <= 7,
  },
  {
    id: 'volume-1',
    label: 'Volume 1 Systems',
    blurb: 'The classic end-to-end designs: shorteners, crawlers, feeds, chat, video and file sync.',
    match: (e) => e.num >= 8 && e.num <= 15,
  },
  {
    id: 'volume-2',
    label: 'Volume 2 Systems',
    blurb: 'The harder half — geospatial search, streaming aggregation, money, storage and exchanges, where correctness under failure is the whole problem.',
    match: (e) => e.num >= 16 && e.num <= 28,
  },
];

function writeCurriculum(entries) {
  const groups = GROUP_DEFS.map((g) => ({
    id: g.id,
    label: g.label,
    blurb: g.blurb,
    topics: entries
      .filter(g.match)
      .map((e) => ({
        id: e.slug,
        label: e.label,
        href: `chapters/${e.out}`,
        blurb: e.blurb,
        sections: e.sections.map((s) => ({ hash: `#${s.id}`, label: s.label })),
      })),
  })).filter((g) => g.topics.length);

  const data = {
    meta: { title: SITE_TITLE, subtitle: SITE_SUBTITLE },
    groups,
  };

  const js = `/* ==========================================================================
   curriculum.js — SINGLE SOURCE OF TRUTH for the sidebar and dashboard
   --------------------------------------------------------------------------
   GENERATED by tools/build-system-design.mjs from system-design-notes/.
   Do not edit by hand: edit the markdown and re-run the build.

   Every label, section title and blurb here is extracted from the notes.
   \`id\` is the localStorage key for visited state — it is derived from the
   chapter folder name, so renaming a chapter folder resets its visited mark.
   Loaded via <script src>, never fetch(), so the site works over file://.
   ========================================================================== */

window.CURRICULUM = ${JSON.stringify(data, null, 2)};

/* Flat list in study order — what nav.js, visited.js and the dashboard iterate. */
window.CURRICULUM.topics = window.CURRICULUM.groups.reduce(function (acc, g) {
  g.topics.forEach(function (t) { t.group = g.id; t.groupLabel = g.label; acc.push(t); });
  return acc;
}, []);
`;
  fs.writeFileSync(path.join(OUT, 'assets', 'js', 'curriculum.js'), js, 'utf8');
  return data;
}

/* ==========================================================================
   13. Link check — the main guard against a silently broken site
   ========================================================================== */
function checkLinks(shared) {
  const problems = [];
  for (const link of shared.allLinks) {
    const [file, anchor] = link.href.split('#');
    const targetFile = file || link.fromFile;

    if (file && !shared.linkTargets.has(file)) {
      problems.push(`${link.fromFile}: link to missing page "${link.href}"`);
      continue;
    }
    if (anchor) {
      const ids = shared.linkTargets.get(targetFile);
      if (ids && !ids.has(anchor)) {
        problems.push(`${link.fromFile}: anchor "#${anchor}" not found in ${targetFile}`);
      }
    }
  }
  return problems;
}

/* ==========================================================================
   14. Assets — copied from DotNet, with three deliberate edits
   ========================================================================== */
function writeAssets() {
  const jsOut = path.join(OUT, 'assets', 'js');

  // nav.js: namespace the collapsed-groups key
  let nav = fs.readFileSync(path.join(DOTNET_ASSETS, 'js', 'nav.js'), 'utf8');
  nav = nav.replace("'learningPath.v1.collapsedGroups'", "'systemDesign.v1.collapsedGroups'");
  fs.writeFileSync(path.join(jsOut, 'nav.js'), nav, 'utf8');

  /* visited.js: namespace the storage key. VISITED.count() counts every key in
     the store, so sharing 'learningPath.v1.visited' with the DotNet site would
     make its visited topics inflate this site's progress bar and vice versa. */
  let visited = fs.readFileSync(path.join(DOTNET_ASSETS, 'js', 'visited.js'), 'utf8');
  visited = visited.replace("'learningPath.v1.visited'", "'systemDesign.v1.visited'");
  visited = visited.replace('__lp_test__', '__sd_test__');
  visited = visited.replace(
    '<code>python3 -m http.server 8000 --directory ~/Learning_path</code>',
    '<code>python3 -m http.server 8000 --directory ~/Learning_path</code>'
  );
  fs.writeFileSync(path.join(jsOut, 'visited.js'), visited, 'utf8');

  /* code-tabs.js: two comment-marker entries the C# site does not need.
       text: null — the notes have 189 bare fences that land on
         data-lang="text"; without a null marker the highlighter treats "//"
         in prose-style example blocks as a comment.
       sql: '#'  — the SQL blocks in these notes comment with # (MySQL style),
         never with --, and the highlighter supports one marker per language. */
  let tabs = fs.readFileSync(path.join(DOTNET_ASSETS, 'js', 'code-tabs.js'), 'utf8');
  tabs = tabs.replace(
    'var LINE_COMMENT = { python:',
    "var LINE_COMMENT = { text: null, sql: '#', python:"
  );
  if (!tabs.includes('text: null')) throw new Error('code-tabs.js LINE_COMMENT patch did not apply');
  fs.writeFileSync(path.join(jsOut, 'code-tabs.js'), tabs, 'utf8');

  // site.css: DotNet stylesheet + additions for this site's extra components
  const base = fs.readFileSync(path.join(DOTNET_ASSETS, 'css', 'site.css'), 'utf8');
  const extra = fs.readFileSync(path.join(HERE, 'site-additions.css'), 'utf8');
  fs.writeFileSync(path.join(OUT, 'assets', 'css', 'site.css'), `${base}\n${extra}`, 'utf8');

  /* the shared kit plus every explainer module in anim/ ("_kit.js" is
     published as anim-kit.js and must load before any module) */
  fs.copyFileSync(path.join(HERE, 'anim', '_kit.js'), path.join(jsOut, 'anim-kit.js'));
  for (const f of fs.readdirSync(path.join(HERE, 'anim'))) {
    if (!f.endsWith('.js') || f.startsWith('_')) continue;
    fs.copyFileSync(path.join(HERE, 'anim', f), path.join(jsOut, f));
  }
}

/* ==========================================================================
   15. Dashboard + root landing page
   ========================================================================== */
function writeDashboard(curriculum, counts) {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dashboard — ${escapeHtml(SITE_TITLE)}</title>
<link rel="stylesheet" href="assets/css/site.css">
</head>
<body data-root="">
<div class="layout">
<main class="main">

  <h1>${escapeHtml(SITE_TITLE)}</h1>
  <p class="lede">A self-paced study site built from the <strong>System Design Interview — An Insider's Guide (Vol 1 &amp; 2)</strong>
  notes in this repository. ${counts.chapters} chapters plus a patterns index, ${counts.sections} sections,
  ${counts.images} diagrams and ${counts.mermaidInlined} rendered flow diagrams — all generated straight from the
  markdown, so the notes stay the single source of truth. Pages you have opened turn
  <span class="badge badge-visited">✓ visited</span>.</p>

  <div class="storage-banner"></div>

  <div class="stats-row">
    <div class="progress">
      <span>Visited</span>
      <span class="progress-bar"><span class="progress-fill" data-progress-fill></span></span>
      <span class="progress-num" data-progress-num>0 / 0</span>
    </div>
    <button type="button" class="btn btn-danger btn-sm" data-reset-visited>Reset visited chapters</button>
  </div>

  <div class="callout callout-note">
    <span class="callout-title">How to use this site</span>
    <ul>
      <li><strong>Start with the Patterns index</strong> — it names the dozen ideas that recur across all 28 chapters and links to the chapters that work each one through. Recognising a pattern is most of the job in an interview.</li>
      <li>Then <strong>Foundations</strong> (chapters 1–3) and <strong>Building Blocks</strong> (4–7) in order; the system chapters assume both.</li>
      <li><strong>Interview angle</strong> callouts flag what an interviewer is actually probing for. <strong>Gotchas &amp; failure modes</strong> sections are the things that bite in production.</li>
      <li>Every chapter ends with <strong>Self-check</strong> questions and a glossary. Answer them out loud before moving on.</li>
      <li>Two chapters — <a href="chapters/04-rate-limiter.html#anim-rate-limiter">Rate Limiter</a> and <a href="chapters/05-consistent-hashing.html#anim-consistent-hashing">Consistent Hashing</a> — have interactive explainers you can drive yourself.</li>
      <li>Visited state lives in your browser only, separate from the C# path's.</li>
    </ul>
  </div>

  <h2 id="chapters">Chapters</h2>
  <div data-topic-groups></div>

  <p class="footer-note">Generated from <code>system-design-notes/</code> by <code>tools/build-system-design.mjs</code> ·
  Works offline by opening <code>index.html</code> · Visited state is stored locally in your browser · No data leaves this machine.</p>

</main>
</div>
<script src="assets/js/curriculum.js"></script>
<script src="assets/js/visited.js"></script>
<script src="assets/js/nav.js"></script>
<script src="assets/js/code-tabs.js"></script>
<script>
/* Dashboard: chapter cards + progress, kept in sync with visited state */
(function () {
  'use strict';
  var C = window.CURRICULUM, V = window.VISITED;
  if (!C || !V) return;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }

  function cardHtml(t) {
    var i = C.topics.indexOf(t);
    var visited = V.isVisited(t.id);
    return '<div class="card' + (visited ? ' visited' : '') + '">' +
      '<h3><span class="card-num">' + (visited ? '✓' : (i + 1)) + '</span><a href="' + t.href + '">' + esc(t.label) + '</a></h3>' +
      '<p>' + esc(t.blurb) + '</p>' +
      '<div class="card-foot"><span>' + t.sections.length + ' sections</span>' +
      (visited ? '<span class="badge badge-visited">Visited</span>' : (i === 0 ? '<span class="badge badge-start">Start here</span>' : '')) +
      '</div></div>';
  }

  function render() {
    var host = document.querySelector('[data-topic-groups]');
    if (host) {
      host.innerHTML = C.groups.map(function (g) {
        var done = g.topics.filter(function (t) { return V.isVisited(t.id); }).length;
        return '<div class="group-head" id="group-' + esc(g.id) + '"><h3>' + esc(g.label) + '</h3>' +
          '<span class="group-count">' + done + ' / ' + g.topics.length + ' visited</span></div>' +
          '<p class="group-blurb">' + esc(g.blurb) + '</p>' +
          '<div class="cards">' + g.topics.map(cardHtml).join('') + '</div>';
      }).join('');
    }
    var n = V.count(), total = C.topics.length;
    var fill = document.querySelector('[data-progress-fill]');
    var num = document.querySelector('[data-progress-num]');
    if (fill) fill.style.width = (total ? Math.round(n / total * 100) : 0) + '%';
    if (num) num.textContent = n + ' / ' + total;
  }

  document.addEventListener('DOMContentLoaded', render);
  document.addEventListener('visited:change', render);
})();
</script>
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT, 'index.html'), html, 'utf8');
}

function writeRootLanding(counts) {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Learning Path</title>
<link rel="stylesheet" href="SystemDesign/assets/css/site.css">
<style>
  .layout { display: block; }
  .main { max-width: 56rem; margin: 0 auto; padding: 3rem 1.5rem 4rem; }
  .path-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr)); gap: 1.25rem; margin: 2rem 0; }
  .path-card { display: flex; flex-direction: column; border: 1px solid var(--border); border-top: 3px solid var(--primary);
    border-radius: var(--radius); padding: 1.25rem; background: var(--surface); text-decoration: none; color: inherit; }
  .path-card:hover { border-color: var(--border-strong); box-shadow: 0 2px 10px rgba(22,28,36,.07); }
  .path-card.sd { border-top-color: var(--accent); }
  .path-card h2 { margin: 0 0 .4rem; font-size: 1.15rem; }
  .path-card p { margin: 0 0 .9rem; font-size: .9rem; color: var(--text-muted); }
  .path-card .meta { margin-top: auto; font-size: .78rem; color: var(--text-faint); }
</style>
</head>
<body data-root="">
<div class="layout">
<main class="main">
  <h1>Learning Path</h1>
  <p class="lede">Two self-paced study sites, both offline-first and both storing their progress separately in this browser.</p>

  <div class="path-cards">
    <a class="path-card" href="DotNet/index.html">
      <h2>C# &amp; .NET →</h2>
      <p>The language core through threading, Web API, security, data access and patterns, then the Azure platform and the DevOps practice that ships it. Every sample paired with Python.</p>
      <span class="meta">23 topics · C# | Python tabs</span>
    </a>
    <a class="path-card sd" href="SystemDesign/index.html">
      <h2>System Design →</h2>
      <p>Alex Xu's Insider's Guide, Volumes 1 and 2 — the scaling story, the recurring building blocks, and 28 end-to-end designs from URL shorteners to stock exchanges.</p>
      <span class="meta">${counts.chapters} chapters · ${counts.sections} sections · 2 interactive explainers</span>
    </a>
  </div>

  <p class="footer-note">Both sites are static and work offline over <code>file://</code>. The System Design site is generated from
  <code>system-design-notes/</code> by <code>tools/build-system-design.mjs</code>; the markdown stays the source of truth.</p>
</main>
</div>
</body>
</html>
`;
  fs.writeFileSync(path.join(ROOT, 'index.html'), html, 'utf8');
}

/* ==========================================================================
   main
   ========================================================================== */
async function main() {
  const t0 = Date.now();
  log('Building SystemDesign/ from system-design-notes/\n');

  for (const d of ['chapters', 'assets/css', 'assets/js']) {
    fs.mkdirSync(path.join(OUT, d), { recursive: true });
  }

  const { chapters, patterns } = discover();
  const entries = [patterns, ...chapters];
  log(`  discovered ${chapters.length} chapters + Patterns.md`);

  // folder name -> output slug, for cross-chapter link rewriting
  const dirToSlug = new Map();
  for (const c of chapters) {
    dirToSlug.set(c.dir, c.slug);
    dirToSlug.set(c.dir.replace(/\s+/g, ' '), c.slug);   // "27.  Digital Wallet" double space
  }

  // pass 1: render every mermaid diagram once
  const allMermaid = entries.flatMap((e) => extractMermaid(fs.readFileSync(e.mdPath, 'utf8')));
  log(`  found ${allMermaid.length} mermaid blocks (${new Set(allMermaid).size} unique)`);
  const { map: mermaid, fresh, cached } = await renderMermaidAll(allMermaid);

  const animConfig = JSON.parse(fs.readFileSync(path.join(HERE, 'animations.json'), 'utf8'));

  const shared = {
    dirToSlug,
    mermaid,
    animConfig,
    linkTargets: new Map(),
    allLinks: [],
    unresolvedHrefs: [],
  };
  const stats = {
    sections: 0, images: 0, missingImages: [],
    mermaidSeen: 0, mermaidInlined: 0, animations: 0,
  };

  // pass 2: build each page
  const built = [];
  for (const entry of entries) {
    const isPatterns = entry.slug === 'patterns';
    const groupLabel = isPatterns ? 'Foundations'
      : entry.num <= 3 ? 'Foundations'
      : entry.num <= 7 ? 'Building Blocks'
      : entry.num <= 15 ? 'Volume 1 Systems'
      : 'Volume 2 Systems';

    const position = isPatterns ? 'Patterns index' : `Chapter ${entry.num} of ${chapters.length}`;
    const meta = {
      label: entry.slug,
      breadcrumb: `<a href="../index.html">Dashboard</a> › ${escapeHtml(groupLabel)} › ${escapeHtml(position)}`,
      lede: '',
    };

    const res = buildPage(entry, meta, shared, stats);
    built.push({
      ...entry,
      label: res.h1.replace(/^Chapter\s+\d+:\s*/i, ''),
      blurb: truncate(res.blurb, 190),
      sections: res.sections,
    });
    log(`  ${entry.out.padEnd(34)} ${String(res.sections.length).padStart(2)} sections`);
  }

  // assets, curriculum, dashboard
  writeAssets();
  const curriculum = writeCurriculum(built);
  const counts = {
    chapters: chapters.length,
    sections: stats.sections,
    images: stats.images,
    mermaidInlined: stats.mermaidInlined,
  };
  writeDashboard(curriculum, counts);
  writeRootLanding(counts);

  // link check
  const problems = checkLinks(shared);

  log('\n--- report -------------------------------------------------');
  log(`  pages            ${built.length} (${chapters.length} chapters + patterns + dashboard + root landing)`);
  log(`  sections         ${stats.sections}`);
  log(`  images rewritten ${stats.images}${stats.missingImages.length ? `  (${stats.missingImages.length} MISSING)` : ''}`);
  log(`  mermaid          ${stats.mermaidInlined}/${stats.mermaidSeen} inlined  (${fresh} rendered, ${cached} from cache)`);
  log(`  animations       ${stats.animations}`);
  log(`  internal links   ${shared.allLinks.length} checked`);
  log(`  elapsed          ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  if (stats.missingImages.length) {
    warn('\n  Missing image files:');
    for (const m of stats.missingImages.slice(0, 20)) warn(`    - ${m}`);
  }
  if (shared.unresolvedHrefs.length) {
    warn(`\n  ${shared.unresolvedHrefs.length} relative link(s) left as-is:`);
    for (const u of shared.unresolvedHrefs.slice(0, 20)) warn(`    - ${u.from}: ${u.raw}`);
  }
  if (problems.length) {
    warn(`\n  ${problems.length} BROKEN internal link(s):`);
    for (const p of problems.slice(0, 40)) warn(`    - ${p}`);
    warn('\nBuild finished with broken links.');
    process.exitCode = 1;
  } else {
    log('\n  ✓ all internal links resolve');
  }
}

main().catch((e) => {
  console.error('\nBuild failed:', e.message);
  console.error(e.stack);
  process.exit(1);
});
