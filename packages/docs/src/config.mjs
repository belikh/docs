import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { CONFIG_KEYS } from "./spec.mjs";

export const DEFAULT_GRAPHICS_URL = "https://raw.githubusercontent.com/belikh/design/latest/packages/github/graphics/{tier}/{name}-{theme}.svg";
const DEFAULTS = { src: "docs-src", mdOut: "docs", siteOut: "dist/site", pdfOut: "dist", base: "/", repoBranch: "main", sections: [], glossary: {}, graphicsUrl: DEFAULT_GRAPHICS_URL };

const REPO = /^[\w.-]+\/[\w.-]+$/;
/** A folder name below the source folder: no absolute path, no "..". */
export const isFolder = (d) => typeof d === "string" && d.trim() !== "" && !d.startsWith("/") && !/(^|[\\/])\.\.([\\/]|$)/.test(d);
const SOURCE_KEYS = ["repo", "path", "ref", "id", "title", "summary", "icon", "sections", "files"];

/** Load docs.config.json. Returns { config, root, errors }. */
export function loadConfig(file) {
  const path = resolve(file); const root = dirname(path); const errors = [];
  if (!existsSync(path)) return { config: null, root, errors: [`${file}: not found (run: jupiter-docs init)`] };
  let raw; try { raw = JSON.parse(readFileSync(path, "utf8")); } catch (e) { return { config: null, root, errors: [`${file}: ${e.message}`] }; }
  for (const k of Object.keys(raw)) if (!(k in CONFIG_KEYS)) errors.push(`${file}: unknown key "${k}" (known: ${Object.keys(CONFIG_KEYS).join(", ")})`);
  if (typeof raw.project !== "string" || !raw.project.trim()) errors.push(`${file}: "project" is required`);
  const c = { ...DEFAULTS, ...raw };
  if (!Array.isArray(c.sections)) errors.push(`${file}: "sections" must be a list`);
  else c.sections.forEach((s, i) => { if (!s || typeof s.id !== "string" || typeof s.title !== "string") errors.push(`${file}: sections[${i}] needs id and title`); });
  if (c.sources !== undefined) {
    if (!Array.isArray(c.sources)) errors.push(`${file}: "sources" must be a list`);
    else c.sources.forEach((src, i) => {
      const at = `${file}: sources[${i}]`;
      if (!src || typeof src !== "object") { errors.push(`${at} must be an object`); return; }
      for (const k of Object.keys(src)) if (!SOURCE_KEYS.includes(k)) errors.push(`${at}: unknown key "${k}" (known: ${SOURCE_KEYS.join(", ")})`);
      if (src.path !== undefined ? typeof src.path !== "string" : !REPO.test(src.repo ?? "")) errors.push(`${at} needs repo (owner/name) or path (a local folder)`);
      if (src.id !== undefined && !/^[a-z0-9][a-z0-9-]*$/.test(src.id)) errors.push(`${at}.id must be lower case letters, digits and -`);
      if (src.sections !== undefined && (!Array.isArray(src.sections) || src.sections.some((s) => !s || typeof s.id !== "string" || typeof s.title !== "string"))) errors.push(`${at}.sections must be a list of { id, title }`);
      if (src.files === undefined) return;
      if (!src.files || typeof src.files !== "object" || !Object.keys(src.files).length) { errors.push(`${at}.files needs at least one path`); return; }
      const known = Array.isArray(src.sections) ? src.sections.map((s) => s?.id) : [];
      for (const [path, m] of Object.entries(src.files)) {
        if (!m?.id || !m.title || !m.summary || !m.section) errors.push(`${at}.files["${path}"] needs id, title, summary and section`);
        else if (!known.includes(m.section)) errors.push(`${at}.files["${path}"]: section "${m.section}" is not in sources[${i}].sections`);
      }
    });
  }
  if (c.diagrams !== undefined && (!Array.isArray(c.diagrams) || c.diagrams.some((d) => !isFolder(d)))) errors.push(`${file}: "diagrams" must be a list of folders below the source folder, such as ["diagrams"] (no .. and no absolute paths)`);
  if (c.redirects !== undefined && (!c.redirects || typeof c.redirects !== "object" || Array.isArray(c.redirects) || Object.values(c.redirects).some((v) => typeof v !== "string"))) errors.push(`${file}: "redirects" must be an object of old address to page id`);
  if (c.discover !== undefined) {
    const d = c.discover;
    if (!d || typeof d !== "object" || !/^[\w.-]+$/.test(d.owner ?? "")) errors.push(`${file}: "discover" needs owner (a GitHub user or organisation)`);
    else if (d.exclude !== undefined && (!Array.isArray(d.exclude) || d.exclude.some((x) => typeof x !== "string"))) errors.push(`${file}: "discover.exclude" must be a list of repository names`);
  }
  const ids = c.sections.map((s) => s.id); ids.forEach((id, i) => { if (ids.indexOf(id) !== i) errors.push(`${file}: duplicate section id "${id}"`); });
  if (!c.base.startsWith("/") || !c.base.endsWith("/")) errors.push(`${file}: "base" must start and end with / (got "${c.base}")`);
  if (c.versionFrom) { const vf = join(root, c.versionFrom); if (existsSync(vf)) c.version = JSON.parse(readFileSync(vf, "utf8")).version; else errors.push(`${file}: versionFrom file not found: ${c.versionFrom}`); }
  c.id ??= String(c.project ?? "docs").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  c.repo = (c.repo ?? "").replace(/\/$/, "");
  return { config: c, root, errors };
}
