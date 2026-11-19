import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { MARKER, diagramUrlFor, graphicUrlFor, mdWriter } from "./write-md.mjs";
import { DIAGRAM_MARKER, bakeDiagram, readDiagram, tokenColours } from "./diagram.mjs";
import { findDiagram } from "./source.mjs";
import { visit } from "./parse.mjs";

/** Map of output path (relative to project root, posix) -> contents. */
export function renderMarkdown(project) {
  const { config, pages, root } = project; const w = mdWriter({ pages, config, graphicUrl: graphicUrlFor(config, config.mdOut), diagramUrl: diagramUrlFor() });
  const own = pages.filter((p) => p.project.local && !p.meta.source);
  const out = new Map(own.map((p) => [`${config.mdOut}/${w.file(p)}`, w.render(p)]));
  // each diagram is written twice, baked for the light and the dark theme, because a Markdown <img> cannot inherit colour
  const used = new Map();
  for (const p of own) visit(p.tree, (n) => { if (n.type === "diagram" && !used.has(n.name)) { const d = findDiagram(p, n.name); if (d) used.set(n.name, d.file); } });
  if (used.size) {
    const colours = tokenColours(root);
    for (const [name, file] of used) for (const theme of ["light", "dark"]) out.set(`${config.mdOut}/diagrams/${name}-${theme}.svg`, bakeDiagram(readDiagram(file), theme, colours, relative(root, file).split(sep).join("/")));
  }
  return out;
}

const walk = (d) => (existsSync(d) ? readdirSync(d).sort().flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; }) : []);

/** Compare with disk. Only files that carry the generated marker are owned (hand-written docs are never touched). */
export function diffMarkdown(project) {
  const out = renderMarkdown(project); const { root, config } = project; const stale = [];
  for (const [path, text] of out) {
    const f = join(root, path);
    if (!existsSync(f)) stale.push(`${path}: missing`);
    else if (readFileSync(f, "utf8") !== text) stale.push(`${path}: out of date`);
  }
  for (const f of walk(join(root, config.mdOut))) {
    const rel = relative(root, f).split(sep).join("/");
    if (f.endsWith(".md") && !out.has(rel) && readFileSync(f, "utf8").includes(`<!-- ${MARKER}`)) stale.push(`${rel}: generated file with no source (delete it)`);
    if (f.endsWith(".svg") && !out.has(rel) && readFileSync(f, "utf8").includes(`<!-- ${DIAGRAM_MARKER}`)) stale.push(`${rel}: generated diagram with no source (delete it)`);
  }
  return stale;
}

export function writeMarkdown(project) {
  const out = renderMarkdown(project); const written = [];
  for (const [path, text] of out) { const f = join(project.root, path); if (existsSync(f) && readFileSync(f, "utf8") === text) continue; mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, text); written.push(path); }
  return { total: out.size, written };
}
