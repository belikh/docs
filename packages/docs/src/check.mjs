// `jupiter-docs check`: validates the source and reports file:line problems.
import { existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { AUDIENCES, FRONT_MATTER, STATUSES } from "./spec.mjs";
import { visit, plain } from "./parse.mjs";
import { findDiagram, findTerm } from "./source.mjs";
import { DIAGRAM_NAME, lintDiagram, readDiagram } from "./diagram.mjs";
import { pageDir } from "./write-html.mjs";
import { documentErrors } from "./config.mjs";
import { checkVoice, proseOf } from "./voice.mjs";
import { graphicsSet } from "./resolve.mjs";

/** @returns {{errors: string[], warnings: string[]}} */
export function checkProject({ config, root, pages, projects }) {
  const errors = []; const warnings = [];
  const err = (p, line, msg) => errors.push(`${p.file}:${line || 1}: ${msg}`);
  const warn = (p, line, msg) => warnings.push(`${p.file}:${line || 1}: ${msg}`);
  const g = graphicsSet(root); const byId = new Map(pages.map((p) => [p.id, p]));
  if (!g) warnings.push("@belikh/jupiter-graphics not found: graphic names are not checked");
  const where = (pr) => (pr.local ? "docs.config.json" : `${config.src}/_imported/${pr.id}`); const noGlossaryPage = new Set();
  for (const pr of projects) {
    for (const s of pr.sections) if (g && s.icon && !g.names.has(`icon/${s.icon}`)) errors.push(`${where(pr)}: section "${s.id}": unknown icon "${s.icon}"`);
    if (g && pr.icon && !g.names.has(`icon/${pr.icon}`)) errors.push(`${where(pr)}: unknown icon "${pr.icon}"`);
    if (!pr.local && pr.id && projects[0].pages.some((p) => p.id === pr.id || p.id.startsWith(`${pr.id}/`))) errors.push(`${where(pr)}: the project id "${pr.id}" is also a page or folder of ${config.src}; set "id" on its entry in sources`);
  }
  if (config.hero && g && !g.names.has(config.hero)) errors.push(`docs.config.json: hero "${config.hero}" is not a graphic (use tier/name, for example spot/summit)`);
  const paths = new Map();
  if (!pages.some((p) => p.id === "index")) warnings.push(`${config.src}/index.md: missing; the site has no landing text`);
  for (const p of pages) {
    const m = p.meta; const sectionIds = new Set(p.project.sections.map((s) => s.id));
    const dir = pageDir(p.id); if (paths.has(dir)) err(p, 1, `this page and ${paths.get(dir).file} would both be published at /${dir}`); else paths.set(dir, p);
    if (p.fmError) err(p, 1, p.fmError);
    for (const k of Object.keys(m)) if (!(k in FRONT_MATTER)) err(p, 1, `unknown front matter key "${k}" (known: ${Object.keys(FRONT_MATTER).join(", ")})`);
    if (typeof m.title !== "string" || !m.title.trim()) err(p, 1, "front matter: title is required");
    if (typeof m.summary !== "string" || !m.summary.trim()) err(p, 1, "front matter: summary is required (one sentence)");
    if (p !== p.project.index) {
      if (!m.section) err(p, 1, "front matter: section is required for a page that is not in a folder (or move the page into a folder such as guides/)");
      else if (!sectionIds.has(m.section)) err(p, 1, `front matter: unknown section "${m.section}" (known: ${[...sectionIds].join(", ") || "none, add sections to docs.config.json"})`);
    }
    if (m.order !== undefined && typeof m.order !== "number") err(p, 1, "front matter: order must be a number");
    if (m.audience !== undefined && !AUDIENCES.includes(m.audience)) err(p, 1, `front matter: audience must be one of ${AUDIENCES.join(", ")}`);
    if (m.status !== undefined && !STATUSES.includes(m.status)) err(p, 1, `front matter: status must be one of ${STATUSES.join(", ")}`);
    if (m.icon !== undefined && g && !g.names.has(`icon/${m.icon}`)) err(p, 1, `front matter: unknown icon "${m.icon}" (icon tier name, for example home)`);
    if (/[^a-z0-9/_-]/.test(p.id)) warn(p, 1, `file name "${p.rel}" should be lower case letters, digits, - and _ (it becomes the URL)`);
    // voice: an error in the pages of this repository. In an imported page every finding is a warning, so the project stays
    // on the site and the build log names what its own repository has to fix.
    for (const u of [{ line: 1, text: `${m.title ?? ""}. ${m.summary ?? ""}` }, ...proseOf(p.tree)]) for (const v of checkVoice(String(u.text))) (v.level === "error" && p.project.local ? err : warn)(p, u.line, `voice: ${v.message}`);
    let prev = 1;
    visit(p.tree, (n) => {
      switch (n.type) {
        case "heading":
          if (n.depth === 1) err(p, n.line, "the page title comes from front matter; start the body at ## (found #)");
          else if (n.depth > prev + 1) err(p, n.line, `heading level skips from ${prev === 1 ? "the title" : "h" + prev} to h${n.depth}: "${plain(n.children)}"`);
          if (!plain(n.children).trim()) err(p, n.line, "empty heading");
          prev = n.depth; break;
        case "html": err(p, n.line, "raw HTML is not supported (put literal <tags> in backticks, or use Markdown or a directive)"); break;
        case "unknown-directive": err(p, n.line, `unknown directive "${n.name}"`); break;
        case "callout": case "seealso": if (n.unclosed) err(p, n.line, `directive "${n.type === "callout" ? n.kind : "see-also"}" is not closed with :::`); break;
        case "graphic": {
          if (!/^[a-z]+\/[a-z0-9-]+$/.test(n.ref)) err(p, n.line, `::graphic needs tier/name (for example rule/end), got "${n.ref}"`);
          else if (g && !g.names.has(n.ref)) err(p, n.line, `unknown graphic "${n.ref}" (see the manifest of @belikh/jupiter-graphics)`);
          break;
        }
        case "diagram": {
          if (!DIAGRAM_NAME.test(n.name)) { err(p, n.line, `::diagram needs a name such as wiring or timing/line (lower case letters, digits and -), got "${n.name}"`); break; }
          if (!n.alt) err(p, n.line, `::diagram ${n.name} needs alt text: a diagram is never decoration, so say what it shows`);
          const d = findDiagram(p, n.name);
          if (!d) { err(p, n.line, `diagram "${n.name}" not found: put ${n.name}.svg in ${(p.project.diagramDirs ?? []).map((x) => relative(root, x) || ".").join(" or ")}`); break; }
          const r = lintDiagram(readDiagram(d.file));
          // an imported project's drawing is its own repository's to fix: style breaks are warnings there, unsafe content is never allowed
          for (const e of r.errors) (p.project.local || r.unsafe ? err : warn)(p, n.line, `diagram ${n.name}: ${e}`);
          for (const w of r.warnings) warn(p, n.line, `diagram ${n.name}: ${w}`);
          break;
        }
        case "glossary": if (!Object.keys(p.project.glossary).length) err(p, n.line, "::glossary used but docs.config.json has no glossary"); break;
        case "codeblock": if (!n.lang) warn(p, n.line, "code block without a language (use text for plain output)"); break;
        case "term": { const t = findTerm(p, n.key); if (!t) err(p, 0, `unknown glossary term "${n.text}" (add it to glossary in docs.config.json)`); else if (!t.page) noGlossaryPage.add(t.owner); break; }
        case "xref": {
          const t = byId.get(n.id);
          if (!t) err(p, 0, `link to unknown page "${n.id}"`);
          else if (n.anchor && !t.headings.some((h) => h.id === n.anchor)) err(p, 0, `page "${n.id}" has no heading anchor "#${n.anchor}" (anchors: ${t.headings.map((h) => h.id).join(", ") || "none"})`);
          break;
        }
        case "link": {
          if (n.broken) { err(p, 0, `link to ${n.href}: no such page`); break; }
          if (n.href.startsWith("#")) { if (n.href.length > 1 && !p.headings.some((h) => h.id === n.href.slice(1))) err(p, 0, `link ${n.href}: no such heading on this page`); break; }
          if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(n.href)) break;
          const path = n.href.split("#")[0]; if (path && !existsSync(join(dirname(p.abs), path))) err(p, 0, `link to ${n.href}: file not found`); break;
        }
        case "image": if (!/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(n.src) && !existsSync(join(dirname(p.abs), n.src))) err(p, 0, `image ${n.src}: file not found`); if (!n.alt) warn(p, 0, `image ${n.src} has no alt text`); break;
        default: break;
      }
    });
  }
  // redirects: an old address must not be a page, and its target must exist (a warning: the target can belong to a project that was left out)
  for (const [from, to] of Object.entries(config.redirects ?? {})) {
    if (paths.has(from.replace(/^\/|\/$/g, ""))) errors.push(`docs.config.json: redirects: "${from}" is the address of a page`);
    if (!byId.has(to) && !byId.has(`${to}/index`)) warnings.push(`docs.config.json: redirects: "${from}" points to "${to}", which is not a page; no redirect is written`);
  }
  for (const pr of noGlossaryPage) errors.push(`${pr.local ? config.src : where(pr)}: glossary terms are used but no page contains ::glossary`);
  for (const pr of projects) for (const s of pr.sections) if (!pr.nav.some((x) => x.id === s.id)) warnings.push(`${where(pr)}: section "${s.id}" has no pages`);
  // documents: the hub's list was checked when the config was read; an imported project's list is checked here
  for (const pr of projects) {
    const spec = pr.documentSpec; if (spec === undefined) continue;
    const shape = documentErrors(spec, `${where(pr)}: documents`);
    if (shape.length) { if (!pr.local) errors.push(...shape); continue; }
    const known = new Set(pr.sections.map((s) => s.id)); const used = new Set();
    for (const d of spec) for (const id of d.sections) { used.add(id); if (!known.has(id)) errors.push(`${where(pr)}: document "${d.id}": unknown section "${id}" (known: ${[...known].join(", ") || "none"})`); }
    for (const d of pr.documents) if (!d.nav.length) warnings.push(`${where(pr)}: document "${d.id}" has no pages; no PDF is built for it`);
    for (const s of pr.nav) if (!used.has(s.id)) warnings.push(`${where(pr)}: section "${s.id}" is in no document, so its pages are in no PDF`);
  }
  return { errors, warnings };
}
