// LaTeX/PDF: one PDF per project. Each is written with write-tex.mjs, compiled with xelatex using jupiter-docs.cls, and the fonts
// come from the LaTeX bundle. The hub's PDF holds the hub's pages; an imported project's PDF holds that project's pages.
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { texWriter } from "./write-tex.mjs";
import { visit } from "./parse.mjs";
import { designDir, graphicSvg, packageRoot, resolveFile } from "./resolve.mjs";

/** Find the LaTeX files: the jupiter-docs.cls of this project (latex/ next to the config, or the one shipped in this package), and the design
 *  system's jupiter-latex bundle (jupiter.sty, jupiter-tokens.sty, fonts, graphics) from config.latexDir, $JUPITER_LATEX_DIR or vendor/design/latex.
 *  The bundle's own copy of jupiter-docs.cls (older releases shipped one) is never used: our class directory comes first on TEXINPUTS. */
export function findLatex(project) {
  const { config, root } = project; const dd = designDir(root);
  const bundles = [config.latexDir && resolve(root, config.latexDir), process.env.JUPITER_LATEX_DIR, dd && join(dd, "latex")].filter(Boolean);
  const own = [join(root, "latex"), join(packageRoot, "latex"), join(packageRoot, "../../latex")].find((d) => existsSync(join(d, "jupiter-docs.cls")));
  if (!own) return null;
  for (const d of bundles) {
    const tex = ["tex", "src"].map((sub) => join(d, sub)).find((x) => existsSync(join(x, "jupiter.sty")));
    if (tex) return { ownDir: own, classDir: tex, fontDir: existsSync(join(d, "fonts/sgi-text-400.otf")) ? join(d, "fonts") : null, graphicsDir: existsSync(join(d, "graphics/flow-accent.pdf")) ? join(d, "graphics") : null, dir: d };
  }
  return null;
}
const need = (cmd) => spawnSync(cmd, ["--version"], { stdio: "ignore" }).error === undefined;

/** The file name of a project's PDF: the hub's is config.pdf (default {id}.pdf); an imported project's is {project id}.pdf. */
export const pdfFileName = (config, pr) => (pr.local ? (config.pdf ?? `${config.id}.pdf`) : `${pr.id}.pdf`);

function svgToPdf(svg, outFile, colour) {
  let s = svg.replace(/ pathLength="1"/g, "").replace(/ class="[^"]*"/, "");
  if (colour) s = s.replaceAll("currentColor", colour);
  const vb = /viewBox="([-\d. ]+)"/.exec(s)[1].split(/\s+/).map(Number);
  s = s.replace(/<svg /, `<svg width="${vb[2]}pt" height="${vb[3]}pt" `);
  const r = spawnSync("rsvg-convert", ["-f", "pdf", "-o", outFile], { input: s });
  if (r.status !== 0) throw new Error(`rsvg-convert failed: ${r.stderr}`);
}

/** Build the PDF of one project: `only` is a project from project.projects (default: the hub). Returns { pdf, project, fonts }. */
export async function buildPdf(project, { only = null, date } = {}) {
  const { config, root, pages, projects } = project;
  const pr = only ?? projects[0];
  const latex = findLatex(project); if (!latex) throw new Error("jupiter.sty not found: run npm run update:design (it downloads jupiter-latex.tgz into vendor/design/latex), or set latexDir / JUPITER_LATEX_DIR to an unpacked jupiter-latex.tgz");
  if (!latex.fontDir || !latex.graphicsDir) throw new Error(`${latex.dir}: the bundle has no fonts/ or graphics/; the PDF must use SGI Text, SGI Alt and JetBrains Mono`);
  if (!need("xelatex")) throw new Error("xelatex not found (install TeX Live: texlive-xetex texlive-latex-extra)");
  const tokens = resolveFile("@belikh/jupiter-tokens/tokens.sty", root); const tokensDir = join(tokens, "..");
  const name = pr.local ? config.id : pr.id; const file = pdfFileName(config, pr);
  const work = join(root, config.pdfOut, ".pdf-build", name); rmSync(work, { recursive: true, force: true }); mkdirSync(work, { recursive: true });
  const sty = readFileSync(tokens, "utf8"); const accent = "#" + /\\definecolor\{jplightAccent\}\{HTML\}\{([0-9A-Fa-f]{6})\}/.exec(sty)?.[1];
  const hasSvg = need("rsvg-convert") && /^#[0-9A-Fa-f]{6}$/.test(accent);
  if (!hasSvg) console.warn("warning: rsvg-convert not found (librsvg2-bin): the PDF is built without logo and line art");
  else {
    const refs = new Set(["rule/end"]); for (const p of pages) visit(p.tree, (n) => { if (n.type === "graphic") refs.add(n.ref); });
    for (const ref of refs) { const svg = graphicSvg(ref, root); if (svg) svgToPdf(svg, join(work, `jpg-${ref.replace("/", "-")}.pdf`), accent); }
  }
  const d = date ?? (process.env.SOURCE_DATE_EPOCH ? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000) : new Date());
  const dateText = d.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const w = texWriter({ pages, config, only: pr });
  const version = pr.local ? (config.version ? `v${config.version}` : "") : (pr.version ? `v${pr.version}` : "");
  const cover = pr.local ? {} : { title: pr.title, subtitle: pr.summary ?? "", repo: pr.url ?? "" };
  writeFileSync(join(work, `${name}.tex`), w.document({ nav: pr.nav, intro: pr.index ?? null, date: dateText, version, cover }));
  const fonts = latex.fontDir ? latex.fontDir + "/" : "";
  const env = { ...process.env, TEXINPUTS: `.:${work}:${latex.ownDir}:${latex.classDir}:${latex.graphicsDir}:${tokensDir}:`, max_print_line: "10000", SOURCE_DATE_EPOCH: process.env.SOURCE_DATE_EPOCH ?? String(Math.floor(d.getTime() / 1000)) };
  let log = "";
  for (let pass = 1; pass <= 3; pass++) {
    const r = spawnSync("xelatex", ["-interaction=nonstopmode", "-halt-on-error", `-output-directory=${work}`, `\\def\\jpfontdir{${fonts}}\\input{${name}.tex}`], { cwd: work, env, encoding: "utf8" });
    log = r.stdout + r.stderr; writeFileSync(join(work, `${name}.log.txt`), log);
    if (r.status !== 0) throw new Error(`xelatex failed for ${pr.local ? "this repository" : pr.id} (log: ${join(work, name + ".log.txt")}):\n${log.split("\n").slice(-25).join("\n")}`);
    if (pass >= 2 && !/Rerun to get|Label\(s\) may have changed/.test(log)) break;
  }
  // the TeX log file also records what a font could not draw; xelatex prints it to the screen only sometimes
  try { log += "\n" + readFileSync(join(work, `${name}.log`), "utf8"); } catch { /* no log file */ }
  const cls = /\(([^()\s]*jupiter-docs\.cls)/.exec(log)?.[1]; // max_print_line is raised above, so the path is not wrapped
  if (!cls || !cls.startsWith(latex.ownDir)) throw new Error(`xelatex loaded ${cls ?? "no jupiter-docs.cls"}, expected the one in ${latex.ownDir}`);
  const missing = [...new Set([...log.matchAll(/Missing character: There is no (.+?) in font ([^\n!]+)/g)].map((m) => `${m[1]} in ${m[2].trim()}`))];
  if (missing.length) throw new Error(`xelatex: glyphs missing from the fonts:\n  ${missing.join("\n  ")}\nMap it to a glyph of SGI Text, SGI Alt or JetBrains Mono with \\newunicodechar in latex/jupiter-docs.cls, or change the text (no other font is allowed).`);
  const outDir = join(root, config.pdfOut); mkdirSync(outDir, { recursive: true });
  copyFileSync(join(work, `${name}.pdf`), join(outDir, file));
  return { pdf: join(config.pdfOut, file), project: pr.id, fonts: Boolean(latex.fontDir) };
}

/** Build the PDF of every project that has pages. A project whose PDF fails is reported in `errors`; the others still build. */
export async function buildAllPdfs(project, { date } = {}) {
  const out = []; const errors = [];
  for (const pr of project.projects) {
    if (!pr.nav.length) continue;
    try { out.push(await buildPdf(project, { only: pr, date })); }
    catch (e) { errors.push(`${pr.local ? "this repository" : pr.id}: ${e.message}`); }
  }
  return { out, errors };
}
