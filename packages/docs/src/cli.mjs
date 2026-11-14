import { loadProject } from "./project.mjs";
import { diffMarkdown, writeMarkdown } from "./build-md.mjs";

const HELP = `jupiter-docs: one Markdown source, three outputs (site, repo Markdown, PDF)

  jupiter-docs check [--strict]            validate the source (exit 1 on errors; --strict also on warnings)
  jupiter-docs build [--md] [--site] [--pdf]   build outputs (default: --md --site); --pdf writes one PDF per project
  jupiter-docs build --check               fail when the generated Markdown is out of date
  jupiter-docs import                      fetch the projects named by sources and discover in the config (docs-src/_imported)
  jupiter-docs voice <file>...             check the wording of a README, a skill or any Markdown or .rst file (--strict: warnings fail too)
  jupiter-docs init [dir]                  scaffold docs-src and docs.config.json

Options: --config <file> (default docs.config.json)`;

function parse(argv) {
  const flags = new Set(); const vals = {}; const rest = [];
  for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (a === "--config") vals.config = argv[++i]; else if (a.startsWith("--")) flags.add(a.slice(2)); else rest.push(a); }
  return { flags, vals, rest };
}
const print = (project, strict) => {
  // on GitHub Actions a warning is also an annotation on the run, so a project that was left out is seen
  for (const w of project.warnings) console.error(`${process.env.GITHUB_ACTIONS ? "::warning::" : "warning: "}${w}`);
  for (const e of project.errors) console.error(`error: ${e}`);
  return project.errors.length > 0 || (strict && project.warnings.length > 0);
};

export async function main(argv) {
  const [cmd, ...args] = argv; const { flags, vals, rest } = parse(args); const configFile = vals.config ?? "docs.config.json";
  if (!cmd || cmd === "help" || flags.has("help")) { console.log(HELP); return cmd ? 0 : 1; }
  if (cmd === "init") { const { init } = await import("./init.mjs"); return init(rest[0] ?? "."); }
  if (cmd === "import") {
    const { loadConfig } = await import("./config.mjs"); const { runImport } = await import("./import.mjs"); const { config, root, errors } = loadConfig(configFile);
    if (!config) { for (const e of errors) console.error(`error: ${e}`); return 1; }
    try { const r = await runImport(config, root); console.log(`import: ${r.projects} project(s), ${r.pages} page(s)`); return 0; } catch (e) { console.error(`error: ${e.message}`); return 1; }
  }
  if (cmd === "voice") {
    if (!rest.length) { console.error("voice: name at least one file, for example: jupiter-docs voice README.rst"); return 1; }
    const { checkVoiceFiles } = await import("./voice.mjs"); let r;
    try { r = checkVoiceFiles(rest); } catch (e) { console.error(`error: ${e.message}`); return 1; }
    if (print(r, flags.has("strict"))) { console.error(`${r.errors.length} error(s), ${r.warnings.length} warning(s)`); return 1; }
    console.log(`${rest.length} file(s) OK`); return 0;
  }
  if (cmd !== "check" && cmd !== "build") { console.error(`unknown command "${cmd}"\n\n${HELP}`); return 1; }
  const project = loadProject(configFile);
  if (print(project, flags.has("strict"))) { console.error(`${project.errors.length} error(s)`); return 1; }
  if (cmd === "check") { console.log(`${project.pages.length} page(s) OK`); return 0; }
  if (flags.has("check")) {
    const stale = diffMarkdown(project);
    if (stale.length) { console.error(`Generated Markdown is stale:\n  ${stale.join("\n  ")}\nRun: jupiter-docs build --md`); return 1; }
    console.log(`Generated Markdown is current (${project.pages.length} page(s)).`); return 0;
  }
  const any = flags.has("md") || flags.has("site") || flags.has("pdf"); const want = (k) => flags.has(k) || (!any && k !== "pdf");
  if (want("md")) { const r = writeMarkdown(project); console.log(`markdown: ${r.total} file(s), ${r.written.length} written`); }
  if (want("site")) { const { buildSite } = await import("./build-site.mjs"); const r = await buildSite(project); console.log(`site: ${r.files} file(s) in ${r.out}`); }
  if (want("pdf")) {
    const { buildAllPdfs } = await import("./build-pdf.mjs"); const r = await buildAllPdfs(project);
    for (const f of r.out) console.log(`pdf: ${f.pdf}`);
    if (r.errors.length) { for (const e of r.errors) console.error(`error: pdf ${e}`); console.error(`${r.errors.length} PDF(s) did not build; the others are written`); return 1; }
  }
  return 0;
}
