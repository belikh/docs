// Reads the source folder into pages and projects, then resolves page links.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, posix, relative, sep } from "node:path";
import YAML from "yaml";
import { parseBody, visit, plain } from "./parse.mjs";
import { STANDARD_SECTIONS } from "./spec.mjs";
import { documentErrors, isFolder, pdfFile } from "./config.mjs";

const walk = (dir) => readdirSync(dir).sort().flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? walk(p) : p.endsWith(".md") ? [p] : []; });

export function splitFrontMatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(text);
  if (!m) return { meta: {}, body: text, lineBase: 0, error: "missing front matter (--- block with title and summary)" };
  try { const meta = YAML.parse(m[1]) ?? {}; return { meta: typeof meta === "object" && !Array.isArray(meta) ? meta : {}, body: text.slice(m[0].length), lineBase: m[0].split("\n").length - 1, error: null }; }
  catch (e) { return { meta: {}, body: text.slice(m[0].length), lineBase: m[0].split("\n").length - 1, error: `front matter is not valid YAML: ${e.message.split("\n")[0]}` }; }
}

/** The SVG file of `::diagram name` for a page: { file } in the first of its project's diagram folders that has it, or null. */
export function findDiagram(page, name) {
  for (const dir of page.project.diagramDirs ?? []) { const file = join(dir, `${name}.svg`); if (existsSync(file)) return { file }; }
  return null;
}

const titleCase = (s) => s.replace(/[-_]+/g, " ").replace(/^./, (c) => c.toUpperCase());

/** A glossary term for a page: its own project's glossary first, then the hub's. { name, def, page, owner } or null. */
export function findTerm(page, key) {
  for (const pr of new Set([page.project, page.project.hub])) {
    const name = Object.keys(pr.glossary).find((k) => k.toLowerCase() === key);
    if (name) return { name, def: pr.glossary[name], page: pr.glossaryPage, owner: pr };
  }
  return null;
}

// Projects. The pages of the source folder belong to the hub project (id ""). `jupiter-docs import` writes the pages of every
// other project to docs-src/_imported/<project id>/ and lists the projects in docs-src/_imported/projects.json. A page id is
// its path below docs-src without _imported/, so the pages of project "design" are design/consuming, design/index and so on.
// Returns { pages, projects }; projects[0] is the hub. `skip` is a set of project ids to leave out.
export function loadPages(root, config, skip = new Set()) {
  const srcDir = join(root, config.src); const pages = [];
  const manifest = join(srcDir, "_imported/projects.json");
  const listed = existsSync(manifest) ? JSON.parse(readFileSync(manifest, "utf8")) : [];
  const make = (p) => ({ ...p, sections: (p.sections ?? []).map((s) => ({ ...s })), glossary: p.glossary ?? {}, pages: [] });
  const hub = make({ id: "", documents: config.documents, diagrams: config.diagrams, title: config.project, summary: config.description ?? "", sections: config.sections, glossary: config.glossary, local: true });
  const projects = [hub, ...listed.filter((p) => !skip.has(p.id)).map(make)];
  const byPid = new Map(projects.map((p) => [p.id, p]));
  for (const pr of projects) {
    pr.hub = hub;
    // the folders that hold this project's diagrams, as absolute paths: its own source folder, or the folder `import` wrote
    const base = pr.local ? srcDir : join(srcDir, "_imported", pr.id);
    pr.diagramDirs = (Array.isArray(pr.diagrams) ? pr.diagrams.filter(isFolder) : pr.local ? (config.diagrams ?? ["diagrams"]) : ["diagrams"]).map((d) => join(base, d));
  }
  for (const f of walk(srcDir)) {
    const rel = relative(srcDir, f).split(sep).join("/"); const id = rel.replace(/\.md$/, "").replace(/^_imported\//, "");
    const first = rel.startsWith("_imported/") ? id.split("/")[0] : ""; if (first && skip.has(first)) continue;
    const project = byPid.get(first) ?? hub; const local = project.id ? id.slice(project.id.length + 1) : id;
    const { meta, body, lineBase, error } = splitFrontMatter(readFileSync(f, "utf8")); const tree = parseBody(body, lineBase);
    const page = { id, local, project, file: `${config.src}/${rel}`, rel, abs: f, meta, tree, lineBase, fmError: error, headings: [] };
    // a page in a folder belongs to the section with the folder's name; a folder that is not a declared section becomes one
    if (meta.section === undefined && local.includes("/")) {
      const sid = local.split("/")[0]; meta.section = sid;
      if (!project.sections.some((s) => s.id === sid)) project.sections.push({ ...(STANDARD_SECTIONS.find((s) => s.id === sid) ?? { id: sid, title: titleCase(sid) }), auto: true });
    }
    pages.push(page); project.pages.push(page);
  }
  pages.sort((a, b) => a.id.localeCompare(b.id));
  const byId = new Map(pages.map((p) => [p.id, p]));
  const std = (s) => { const i = STANDARD_SECTIONS.findIndex((x) => x.id === s.id); return i < 0 ? STANDARD_SECTIONS.length : i; };
  for (const pr of projects) {
    const declared = pr.sections.filter((s) => !s.auto); const auto = pr.sections.filter((s) => s.auto).sort((a, b) => std(a) - std(b) || a.id.localeCompare(b.id));
    pr.sections = [...declared, ...auto];
    pr.pages.sort((a, b) => (a.meta.order ?? 100) - (b.meta.order ?? 100) || String(a.meta.title).localeCompare(String(b.meta.title)));
    pr.index = pr.pages.find((p) => p.local === "index");
    pr.glossaryPage = pr.pages.find((p) => { let hit = false; visit(p.tree, (n) => { if (n.type === "glossary") hit = true; }); return hit; });
    pr.nav = pr.sections.map((s) => ({ ...s, pages: pr.pages.filter((p) => p !== pr.index && p.meta.section === s.id) })).filter((s) => s.pages.length);
    // The PDFs of the project. Without `documents` there is one, with every section. With it, each entry is a PDF holding the
    // sections it lists, in that order. documentSpec keeps what the config said, for `check`; a list with a problem is not used.
    const name = pr.local ? config.id : pr.id; pr.documentSpec = pr.documents;
    const spec = pr.documentSpec !== undefined && !documentErrors(pr.documentSpec, "").length ? pr.documentSpec : null;
    pr.documents = spec
      ? spec.map((d) => ({ id: d.id, title: d.title, summary: d.summary ?? "", file: pdfFile(name, d.id), nav: d.sections.map((id) => pr.nav.find((s) => s.id === id)).filter(Boolean) }))
      : [{ id: "", title: "", summary: "", file: pr.local ? (config.pdf ?? pdfFile(name)) : pdfFile(name), nav: pr.nav }];
  }
  // [[id]] names a page of the same project first, then a page of the whole site; a project id alone names its landing page
  const resolveId = (p, id) => { const pre = p.project.id ? `${p.project.id}/` : ""; return [pre + id, `${pre}${id}/index`, id, `${id}/index`].find((c) => byId.has(c)) ?? id; };
  for (const p of pages) {
    visit(p.tree, (n) => { if (n.type === "heading") p.headings.push({ depth: n.depth, id: n.id, text: plain(n.children) }); });
    visit(p.tree, (n) => {
      if (n.type === "xref") { n.id = resolveId(p, n.id); return; }
      // `[text](other.md#anchor)` links between pages become the same xref node as [[other]]
      if (n.type !== "link" || /^[a-z][a-z0-9+.-]*:|^#|^\//i.test(n.href)) return;
      const [path, anchor = ""] = n.href.split("#"); if (!path.endsWith(".md")) return;
      const target = posix.normalize(posix.join(posix.dirname(p.id), path)).replace(/\.md$/, "");
      if (byId.has(target)) { n.type = "xref"; n.id = target; n.anchor = anchor; n.text = ""; }
      else if (!target.startsWith("..")) n.broken = target;
    });
  }
  return { pages, projects };
}
