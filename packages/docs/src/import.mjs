// `jupiter-docs import`: fetch the Markdown files named in config.sources from other repositories at their latest release
// tag (or a fixed ref) and write them to docs-src/_imported/<id>.md with front matter, so the site shows what each project
// released without a commit here. Imported files are gitignored and are never written back to docs/.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, posix } from "node:path";
import YAML from "yaml";
import { designRelease } from "./resolve.mjs";

const UA = { "user-agent": "jupiter-docs-import" };

/** The tag of the newest release of owner/name, found from the redirect of /releases/latest (no API rate limit). */
export async function latestTag(repo) {
  const r = await fetch(`https://github.com/${repo}/releases/latest`, { redirect: "manual", headers: UA });
  const loc = r.headers.get("location") ?? "";
  const m = /\/releases\/tag\/([^/?#]+)/.exec(loc);
  if (!m) throw new Error(`${repo}: no release found (HTTP ${r.status}); set "ref" to a tag or branch`);
  return decodeURIComponent(m[1]);
}

async function get(url) {
  let last;
  for (let i = 1; i <= 4; i++) {
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) });
      if (r.ok) return await r.text();
      if (r.status === 404) throw Object.assign(new Error(`${url}: not found`), { fatal: true });
      last = new Error(`${url}: HTTP ${r.status}`);
    } catch (e) { if (e.fatal) throw e; last = e; }
    await new Promise((res) => setTimeout(res, i * 1500));
  }
  throw last;
}

/** Turn a hand-written GitHub Markdown file into a docs-src page body: drop the leading generator comment and the first
 *  # title (the title lives in front matter), and rewrite relative links. */
export function convertBody(text, { repo, ref, path, idByPath }) {
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
      const base = bang ? `https://raw.githubusercontent.com/${repo}/${ref}/` : `https://github.com/${repo}/blob/${ref}/`;
      return `${bang}[${text2}](${base}${target}${anchor ? `#${anchor}` : ""})`;
    });
  });
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

export async function runImport(config, root, log = console.log) {
  const out = join(root, config.src, "_imported");
  rmSync(out, { recursive: true, force: true });
  const sources = config.sources ?? [];
  if (!sources.length) { log("import: no sources in the config"); return { pages: 0 }; }
  mkdirSync(out, { recursive: true }); let pages = 0;
  const rel = designRelease(root);
  for (const src of sources) {
    // the same release the design files were downloaded from, so the site is consistent
    const ref = process.env.JUPITER_IMPORT_REF || (src.ref && src.ref !== "latest" ? src.ref : rel?.repo === src.repo && rel.tag ? rel.tag : await latestTag(src.repo));   // JUPITER_IMPORT_REF forces one ref for every source (testing a design build that is not released yet)
    const idByPath = Object.fromEntries(Object.entries(src.files).map(([p, m]) => [p, m.id]));
    for (const [path, m] of Object.entries(src.files)) {
      const text = await get(`https://raw.githubusercontent.com/${src.repo}/${ref}/${path}`);
      const meta = { title: m.title, summary: m.summary, section: m.section, ...(m.order !== undefined && { order: m.order }), ...(m.icon && { icon: m.icon }), ...(m.audience && { audience: m.audience }), ...(m.status && { status: m.status }),
        source: { repo: src.repo, ref, path, url: `https://github.com/${src.repo}/blob/${ref}/${path}` } };
      const file = join(out, `${m.id}.md`); mkdirSync(join(file, ".."), { recursive: true });
      writeFileSync(file, `---\n${YAML.stringify(meta)}---\n\n${convertBody(text, { repo: src.repo, ref, path, idByPath })}`);
      pages++; log(`import: ${src.repo}@${ref}:${path} -> ${config.src}/_imported/${m.id}.md`);
    }
  }
  return { pages };
}
