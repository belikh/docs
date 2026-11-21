#!/usr/bin/env node
// The agent skills must match what they describe. skill/SKILL.md must match the generator: every path, command, flag, npm script, directive, front matter key
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
for (const sec of spec.STANDARD_SECTIONS) if (!ds.includes(`| \`${sec.id}\` | ${sec.title} |`)) bad.push(`standard section not documented in the skill: ${sec.id}`);
for (const k of Object.keys(spec.FRONT_MATTER)) if (!ds.includes(`\`${k}\``)) bad.push(`front matter key not documented in the skill: ${k}`);
for (const k of ["project", "version", "versionFrom", "repo", "siteUrl", "base", "sections", "glossary", "hero", "diagrams", "documents", "sources", "discover", "description", "icon"]) if (!ds.includes(k)) bad.push(`config key not documented in the skill: ${k}`);
// The github-readme skill (skill-readme/SKILL.md) names templates and graphics of the design system: check them against the
// release in vendor/design, so a renamed template or graphic is caught here.
const rs = readFileSync(join(root, "skill-readme/SKILL.md"), "utf8"); const gh = join(root, "vendor/design/node_modules/@belikh/jupiter-github");
if (!/^---\nname: github-readme\ndescription: [\s\S]+?\n---\n/.test(rs)) bad.push("github-readme: expected frontmatter name github-readme and a description");
if (!rs.includes("DESIGN.md")) bad.push("github-readme: the skill does not point to DESIGN.md");
if (!ds.includes("`github-readme`")) bad.push("the jupiter-docs skill does not name the github-readme skill");
if (/belikh\/design\/main\//.test(rs)) bad.push("github-readme: a link points at main of belikh/design; use the latest tag");
if (existsSync(gh)) {
  for (const t of ["README.rst", "profile-README.rst", "org-profile-README.rst"]) if (!rs.includes(t) || !existsSync(join(gh, "templates", t))) bad.push(`github-readme: template ${t} is not named in the skill or not in the design release`);
  for (const m of rs.matchAll(/packages\/github\/graphics\/(icon|rule|spot|scene)\/([\w-]+)-(light|dark)\.svg/g)) if (!existsSync(join(gh, "graphics", m[1], `${m[2]}-${m[3]}.svg`))) bad.push(`github-readme: graphic not in the design release: ${m[1]}/${m[2]}-${m[3]}.svg`);
} else console.warn("warning: vendor/design is missing (npm run update:design): the templates and graphics named by github-readme are not checked");
// The voice guide (skill/VOICE.md): both skills point to it, each skill hands over to the other, and every word list entry
// of spec.VOICE is shown in the guide.
const voice = readFileSync(join(root, "skill/VOICE.md"), "utf8");
if (!ds.includes("`VOICE.md`")) bad.push("the jupiter-docs skill does not point to VOICE.md");
if (!rs.includes("`VOICE.md`")) bad.push("the github-readme skill does not point to VOICE.md");
if (!/README[^\n]*`github-readme` skill/.test(ds)) bad.push("the jupiter-docs skill does not hand README files to the github-readme skill");
if (!/`docs-src\/`[^\n]*`jupiter-docs` skill/.test(rs)) bad.push("the github-readme skill does not hand documentation pages to the jupiter-docs skill");
for (const s2 of [ds, rs]) if (!s2.includes("jupiter-docs voice")) bad.push("a skill does not name the jupiter-docs voice command");
if (!cli.includes('"voice"')) bad.push("command not in the CLI: voice");
for (const [label] of [...spec.VOICE.error, ...spec.VOICE.warning]) if (!voice.toLowerCase().includes(`\`${label.toLowerCase()}\``)) bad.push(`VOICE.md does not show the listed wording: ${label}`);
if (!voice.includes(`over ${spec.VOICE.maxSentenceWords} words`)) bad.push(`VOICE.md does not state the sentence limit of ${spec.VOICE.maxSentenceWords} words`);
// Everything written by hand in this repository passes the voice check (docs-src is checked by jupiter-docs check).
const { checkVoiceFiles } = await import(join(root, "packages/docs/src/voice.mjs"));
const prose = ["README.rst", "AGENTS.md", "skill/SKILL.md", "skill/VOICE.md", "skill-readme/SKILL.md", "packages/docs/README.md"];
const v = checkVoiceFiles(prose.map((f) => join(root, f)));
for (const m of [...v.errors, ...v.warnings]) bad.push(m.replace(`${root}/`, ""));
if (bad.length) { console.error(`SKILL.md drift:\n  ${bad.join("\n  ")}`); process.exit(1); }
console.log("The agent skills match the generator and the design release.");
