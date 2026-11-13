// `jupiter-docs init [dir]`: scaffold docs.config.json and docs-src for a new project (like scripts/new-project.mjs does for apps).
import { existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

export function init(dir) {
  const root = resolve(dir); const cfg = join(root, "docs.config.json");
  if (existsSync(cfg)) { console.error(`${cfg} already exists`); return 1; }
  mkdirSync(join(root, "docs-src"), { recursive: true });
  const pkgFile = join(root, "package.json"); const pkg = existsSync(pkgFile) ? JSON.parse(readFileSync(pkgFile, "utf8")) : null;
  const name = (pkg?.name ?? basename(root)).replace(/^@[^/]+\//, "").replace(/[-_]+/g, " ").replace(/^./, (c) => c.toUpperCase());
  // no sections in the config: the folders start, guides, reference, concepts and develop are sections with fixed titles
  const repo = typeof pkg?.repository === "string" ? pkg.repository : pkg?.repository?.url; const url = /github\.com[/:]([\w.-]+\/[\w.-]+?)(\.git)?$/.exec(repo ?? "")?.[1];
  const config = { project: name, description: pkg?.description || "What this project does, in one sentence.", ...(pkg ? { versionFrom: "package.json" } : {}), ...(url ? { repo: `https://github.com/${url}` } : {}) };
  writeFileSync(cfg, JSON.stringify(config, null, 2) + "\n");
  const page = (file, head, body) => { const f = join(root, "docs-src", file); mkdirSync(join(f, ".."), { recursive: true }); writeFileSync(f, `---\n${head}\n---\n\n${body}\n`); };
  page("index.md", `title: ${name}\nsummary: ${config.description}`, "Say what the project is for in two or three sentences, and who it is for.");
  page("start/install.md", "title: Install\nsummary: Install the project and run it for the first time.\norder: 10\nicon: terminal\naudience: users\nstatus: draft", `## Install\n\n\`\`\`sh title="Install"\nnpm install\n\`\`\`\n\n## Run\n\n:::note\nReplace this page with the real steps and the output of the first run.\n:::`);
  if (pkg) {
    pkg.scripts = { ...pkg.scripts, "docs:check": "jupiter-docs check", "docs:build": "jupiter-docs build" }; writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + "\n");
  }
  mkdirSync(join(root, ".claude/skills"), { recursive: true });
  try { symlinkSync("../../node_modules/@belikh/jupiter-docs/skill", join(root, ".claude/skills/jupiter-docs")); } catch { /* exists */ }
  console.log(`Created docs.config.json and docs-src in ${root}\n  npm install --save-dev @belikh/jupiter-docs\n  npx jupiter-docs check && npx jupiter-docs build\n  Commit docs.config.json, docs-src and the generated docs/.
  Add pages in the folders start, guides, reference, concepts and develop of docs-src; each folder is a section.
  A public repository of belikh then appears on docs.jupiter.au at the next daily build. Other repositories add
  { "repo": "owner/name" } to sources in docs.config.json of belikh/docs.`);
  return 0;
}
