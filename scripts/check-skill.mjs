#!/usr/bin/env node
// The agent skill (skill/SKILL.md) must match the generator: every path, command, flag, npm script, directive, front matter key
// and config key it names must exist, and every directive and front matter key must be documented in it.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bad = [];
const ds = readFileSync(join(root, "skill/SKILL.md"), "utf8");
const spec = await import(join(root, "packages/docs/src/spec.mjs"));
const cli = readFileSync(join(root, "packages/docs/src/cli.mjs"), "utf8");
const scripts = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).scripts;
if (!/^---\nname: jupiter-docs\ndescription: [\s\S]+?\n---\n/.test(ds)) bad.push("expected frontmatter name jupiter-docs and a description");
if (!ds.includes("DESIGN.md")) bad.push("the skill does not point to DESIGN.md");
for (const m of ds.matchAll(/`((?:packages|scripts|docs-src|latex)\/[\w./-]+)`/g)) { const f = m[1].replace(/[.,]+$/, ""); if (!f.includes("<") && !f.includes("_imported") && !existsSync(join(root, f))) bad.push(`missing ${f}`); }
for (const m of ds.matchAll(/jupiter-docs (check|build|init|import)\b/g)) if (!cli.includes(`"${m[1]}"`)) bad.push(`command not in the CLI: ${m[1]}`);
for (const m of ds.matchAll(/jupiter-docs build (--[a-z]+)/g)) if (!cli.includes(`flags.has("${m[1].slice(2)}")`) && !cli.includes(m[1])) bad.push(`flag not in the CLI: ${m[1]}`);
for (const m of ds.matchAll(/npm run ([\w:.-]+)/g)) if (!(m[1] in scripts)) bad.push(`npm script not found: ${m[1]}`);
for (const m of ds.matchAll(/(?:^|[\s`(-])(:{2,4})([a-z][a-z-]*)/gm)) if (!spec.DIRECTIVES.includes(m[2])) bad.push(`directive not in spec.mjs: ${m[2]}`);
for (const d of spec.DIRECTIVES) if (!ds.includes(d)) bad.push(`directive not documented in the skill: ${d}`);
for (const k of Object.keys(spec.FRONT_MATTER)) if (!ds.includes(`\`${k}\``)) bad.push(`front matter key not documented in the skill: ${k}`);
for (const k of ["project", "version", "versionFrom", "repo", "siteUrl", "base", "sections", "glossary", "hero", "sources"]) if (!ds.includes(k)) bad.push(`config key not documented in the skill: ${k}`);
if (bad.length) { console.error(`SKILL.md drift:\n  ${bad.join("\n  ")}`); process.exit(1); }
console.log("The agent skill matches the generator.");
