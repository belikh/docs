// `jupiter-docs import`: fetch the documentation of other projects and write it to docs-src/_imported/<project id>/, with the
// list of projects in docs-src/_imported/projects.json. The source of a project stays in its own repository; this folder is
// gitignored and is never written back to docs/.
//
// A project is found in one of three ways:
//   discover { owner }        every public repository of the owner that has a docs.config.json at its root
//   sources  { repo }         one repository, read the same way (its docs.config.json and its source folder)
//   sources  { repo, files }  hand-written Markdown files of a repository that has no docs.config.json
import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, posix, relative, resolve, sep } from "node:path";
import YAML from "yaml";
import { designRelease } from "./resolve.mjs";
import { splitFrontMatter } from "./source.mjs";
import { isFolder } from "./config.mjs";
import { MAX_DIAGRAM_BYTES } from "./diagram.mjs";

const UA = { "user-agent": "jupiter-docs-import" };
const slugId = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** The tag of the newest release of owner/name, found from the redirect of /releases/latest (no API rate limit).
 *  null when the repository has no release. */
export async function latestTag(repo) {
  const r = await fetch(`https://github.com/${repo}/releases/latest`, { redirect: "manual", headers: UA });
  const m = /\/releases\/tag\/([^/?#]+)/.exec(r.headers.get("location") ?? "");
  if (m) return decodeURIComponent(m[1]);
  if (r.status === 404) throw new Error(`${repo}: repository not found`);
  return null;
}

async function get(url, as = "text") {
  let last;
  for (let i = 1; i <= 4; i++) {
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(60000) });
      if (r.ok) return as === "text" ? await r.text() : Buffer.from(await r.arrayBuffer());
      if (r.status === 404) throw Object.assign(new Error(`${url}: not found`), { fatal: true });
      last = new Error(`${url}: HTTP ${r.status}`);
    } catch (e) { if (e.fatal) throw e; last = e; }
    await new Promise((res) => setTimeout(res, i * 1500));
  }
  throw last;
}

/** owner/name of every public repository of a GitHub user or organisation (forks and archived ones left out) whose default
 *  branch has a docs.config.json. One API request per 100 repositories; set GITHUB_TOKEN to raise the rate limit. */
export async function discover(owner) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN; const repos = [];
  for (let page = 1; ; page++) {
    const r = await fetch(`https://api.github.com/users/${owner}/repos?type=owner&per_page=100&page=${page}`, { headers: { ...UA, accept: "application/vnd.github+json", ...(token && { authorization: `Bearer ${token}` }) }, signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw new Error(`discover ${owner}: HTTP ${r.status} from api.github.com${r.status === 403 || r.status === 429 ? " (rate limit: set GITHUB_TOKEN)" : ""}`);
    const list = await r.json(); repos.push(...list); if (list.length < 100) break;
  }
  const open = repos.filter((r) => !r.private && !r.fork && !r.archived && !r.disabled);
  const has = await Promise.all(open.map(async (r) => {
    const res = await fetch(`https://raw.githubusercontent.com/${r.full_name}/HEAD/docs.config.json`, { method: "HEAD", headers: UA, signal: AbortSignal.timeout(30000) });
    if (!res.ok && res.status !== 404) throw new Error(`discover ${r.full_name}: HTTP ${res.status}`);
    return res.ok;
  }));
  return open.filter((_, i) => has[i]).map((r) => r.full_name).sort();
}

/** Turn a Markdown file of another repository into a docs-src page body: drop the leading generator comment and the first
 *  # title (the title lives in front matter), turn links to the project's other pages into [[id]] and point every other
 *  relative link at the repository. */
export function convertBody(text, { repo, ref, path, idByPath, local }) {
  let t = text.replace(/\r\n/g, "\n").replace(/^\s*<!--[\s\S]*?-->\s*/, "");
  t = t.replace(/^\s*# .*\n+/, "");
  const dir = posix.dirname(path);
  let fence = null;
  const lines = t.split("\n").map((line) => {
    const f = /^\s*(`{3,}|~{3,})/.exec(line);
    if (f) { if (!fence) fence = f[1][0]; else if (f[1][0] === fence) fence = null; return line; }
    if (fence) return line;
    return line.replace(/(!?)\[([^\]]*)\]\(([^)\s]+)\)/g, (m, bang, text2, href) => {
      if (/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(href)) return m;
      const [p, anchor] = href.split("#"); const target = posix.normalize(posix.join(dir, p));
      if (!bang && idByPath[target]) return `[[${idByPath[target]}${anchor ? `#${anchor}` : ""}|${text2}]]`;
      if (!repo) return local ? `${bang}[${text2}](file://${posix.join(local.split(sep).join("/"), target)}${anchor ? `#${anchor}` : ""})` : m;   // a local folder: link the file itself
      const base = bang ? `https://raw.githubusercontent.com/${repo}/${ref}/` : `https://github.com/${repo}/blob/${ref}/`;
      return `${bang}[${text2}](${base}${target}${anchor ? `#${anchor}` : ""})`;
    });
  });
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

const walk = (dir) => readdirSync(dir).sort().flatMap((n) => { const p = join(dir, n); const st = lstatSync(p); return st.isSymbolicLink() ? [] : st.isDirectory() ? walk(p) : p.endsWith(".md") ? [p] : []; });
const walkSvg = (dir) => readdirSync(dir).sort().flatMap((n) => { const p = join(dir, n); const st = lstatSync(p); return st.isSymbolicLink() ? [] : st.isDirectory() ? walkSvg(p) : p.endsWith(".svg") ? [p] : []; });
const sourceOf = (repo, ref, path) => ({ repo: repo ?? "", ref, path, url: repo ? `https://github.com/${repo}/blob/${ref}/${path}` : "" });
const page = (meta, body) => `---\n${YAML.stringify(meta)}---\n\n${body}`;

/** A project that describes itself: `dir` is its repository (a checkout or a local folder) with docs.config.json and a source
 *  folder. Returns { project, pages: Map of "<page id>.md" -> text }, or throws when there is no usable docs.config.json. */
export function readProject(dir, src, ref) {
  const file = join(dir, "docs.config.json");
  if (!existsSync(file)) throw new Error("no docs.config.json");
  const pc = JSON.parse(readFileSync(file, "utf8")); const srcDir = pc.src ?? "docs-src"; const abs = join(dir, srcDir);
  if (typeof pc.project !== "string" || !pc.project.trim()) throw new Error('docs.config.json: "project" is required');
  if (!existsSync(abs)) throw new Error(`${srcDir}: source folder not found`);
  const files = walk(abs).map((f) => relative(abs, f).split(sep).join("/")).filter((rel) => !rel.startsWith("_imported/"));
  const idByPath = Object.fromEntries(files.map((rel) => [`${srcDir}/${rel}`, rel.replace(/\.md$/, "")]));
  const pages = new Map(); let lead = "";
  for (const rel of files) {
    const path = `${srcDir}/${rel}`; const text = readFileSync(join(abs, rel), "utf8"); const { meta, body, error } = splitFrontMatter(text);
    if (rel === "index.md" && typeof meta.summary === "string") lead = meta.summary;
    // a page whose header cannot be read is written as it is, so `check` reports the problem with the file name
    pages.set(rel, error ? text : page({ ...meta, source: sourceOf(src.repo, ref, path) }, convertBody(body, { repo: src.repo, ref, path, idByPath, local: dir })));
  }
  // the diagram folders of the project (SVG files for ::diagram), copied next to its pages. A file over the size limit is left
  // out, so `check` reports the diagram as missing and says where it looked.
  const dirs = Array.isArray(pc.diagrams) ? pc.diagrams.filter(isFolder) : ["diagrams"]; const assets = new Map();
  for (const d of dirs) {
    const base = join(abs, d); if (!existsSync(base) || !lstatSync(base).isDirectory()) continue;
    for (const f of walkSvg(base)) { const text = readFileSync(f, "utf8"); if (Buffer.byteLength(text) <= MAX_DIAGRAM_BYTES) assets.set(posix.join(d.split(sep).join("/"), relative(base, f).split(sep).join("/")), text); }
  }
  let version = typeof pc.version === "string" ? pc.version : "";
  if (!version && pc.versionFrom && existsSync(join(dir, pc.versionFrom))) { try { version = String(JSON.parse(readFileSync(join(dir, pc.versionFrom), "utf8")).version ?? ""); } catch { /* not JSON: no version */ } }
  const project = { id: pc.id, title: src.title ?? pc.project, summary: src.summary ?? pc.description ?? lead, icon: src.icon ?? pc.icon, version, sections: src.sections ?? pc.sections ?? [], glossary: pc.glossary ?? {}, diagrams: dirs };
  return { project, pages, assets };
}

/** Download owner/name at a ref and unpack it into a temporary folder (one request, no API rate limit). */
async function checkout(repo, ref, temp) {
  const dir = mkdtempSync(join(tmpdir(), "jpdocs-src-")); temp.push(dir);
  const tgz = join(dir, "src.tgz"); writeFileSync(tgz, await get(`https://codeload.github.com/${repo}/tar.gz/${ref}`, "buffer"));
  const tree = join(dir, "tree"); mkdirSync(tree);
  const t = spawnSync("tar", ["-xzf", tgz, "-C", tree, "--strip-components=1"], { encoding: "utf8" });
  if (t.status !== 0) throw new Error(`${repo}@${ref}: tar failed: ${t.stderr || t.error?.message}`);
  return tree;
}

export async function runImport(config, root, log = console.log) {
  const out = join(root, config.src, "_imported");
  rmSync(out, { recursive: true, force: true });
  const sources = [...(config.sources ?? [])];
  if (config.discover) {
    const self = /github\.com\/([\w.-]+\/[\w.-]+)/.exec(config.repo ?? "")?.[1];
    const not = new Set([self, ...sources.map((s) => s.repo), ...(config.discover.exclude ?? [])].filter(Boolean).map((s) => s.toLowerCase()));
    for (const repo of await discover(config.discover.owner)) if (!not.has(repo.toLowerCase()) && !not.has(repo.split("/")[1].toLowerCase())) sources.push({ repo, discovered: true });
  }
  if (!sources.length) { log("import: no projects (add sources or discover to the config)"); return { pages: 0, projects: 0 }; }
  mkdirSync(out, { recursive: true }); let count = 0; const projects = []; const temp = [];
  const rel = designRelease(root);
  try {
    for (const src of sources) {
      const name = src.repo ?? basename(resolve(root, src.path));
      // JUPITER_IMPORT_REF forces one ref for every source (testing a build that is not released yet). The design repository
      // is read at the release the design files were downloaded from, so the site is consistent.
      const fixed = process.env.JUPITER_IMPORT_REF || (src.ref && src.ref !== "latest" ? src.ref : rel?.repo === src.repo && rel.tag ? rel.tag : null);
      let ref = src.path ? "local" : fixed ?? (await latestTag(src.repo)) ?? "HEAD";
      let project; let pages; let assets = new Map();
      if (src.files) {
        const idByPath = Object.fromEntries(Object.entries(src.files).map(([p, m]) => [p, m.id])); pages = new Map();
        for (const [path, m] of Object.entries(src.files)) {
          const text = await get(`https://raw.githubusercontent.com/${src.repo}/${ref}/${path}`);
          const meta = { title: m.title, summary: m.summary, section: m.section, ...(m.order !== undefined && { order: m.order }), ...(m.icon && { icon: m.icon }), ...(m.audience && { audience: m.audience }), ...(m.status && { status: m.status }), source: sourceOf(src.repo, ref, path) };
          pages.set(`${m.id}.md`, page(meta, convertBody(text, { repo: src.repo, ref, path, idByPath })));
        }
        project = { title: src.title ?? name.split("/").pop(), summary: src.summary ?? "", icon: src.icon, version: "", sections: src.sections ?? [], glossary: {} };
      } else {
        try {
          let dir = src.path ? resolve(root, src.path) : await checkout(src.repo, ref, temp);
          // the newest release can be older than the project's documentation: read the default branch then
          if (!src.path && !fixed && ref !== "HEAD" && !existsSync(join(dir, "docs.config.json"))) { ref = "HEAD"; dir = await checkout(src.repo, ref, temp); }
          ({ project, pages, assets } = readProject(dir, src, ref));
        } catch (e) {
          if (!src.discovered || e.cause || /HTTP|fetch|tar failed|timeout/i.test(e.message)) throw new Error(`${name}@${ref}: ${e.message}`);
          log(`warning: ${name}@${ref} is left out: ${e.message}`); continue;
        }
      }
      // the id is the first part of the project's addresses: the sources entry, then the project's own config, then the repository name
      const id = src.id ?? (/^[a-z0-9][a-z0-9-]*$/.test(project.id ?? "") ? project.id : slugId(name.split("/").pop())); delete project.id;
      if (projects.some((p) => p.id === id)) throw new Error(`${name}: the project id "${id}" is used twice; set "id" on one entry of sources`);
      if (!project.version && /^v?\d+\.\d+/.test(ref)) project.version = ref.replace(/^v/, "");
      if (!pages.has("index.md")) pages.set("index.md", page({ title: project.title, summary: project.summary || `Documentation of ${project.title}.` }, ""));
      for (const [file, text] of [...pages, ...assets]) { const f = join(out, id, file); mkdirSync(join(f, ".."), { recursive: true }); writeFileSync(f, text); }
      projects.push({ id, ...project, repo: src.repo ?? "", ref, url: src.repo ? `https://github.com/${src.repo}` : "" });
      count += pages.size; log(`import: ${name}@${ref} -> ${config.src}/_imported/${id}/ (${pages.size} page(s)${assets.size ? `, ${assets.size} diagram(s)` : ""})`);
    }
  } finally { for (const d of temp) rmSync(d, { recursive: true, force: true }); }
  writeFileSync(join(out, "projects.json"), JSON.stringify(projects, null, 2) + "\n");
  return { pages: count, projects: projects.length };
}
