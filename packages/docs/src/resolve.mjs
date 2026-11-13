// Finds the design-system packages (tokens, graphics, fonts, logo) and the LaTeX bundle.
// Lookup order: $JUPITER_DESIGN_DIR, the project's vendor/design (written by scripts/update-design.mjs from the latest
// belikh/design release; packages sit in vendor/design/node_modules/@belikh/jupiter-*), the project's node_modules, this package's.
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const packageRoot = join(here, "..");

/** The directory update-design fills: $JUPITER_DESIGN_DIR, else <project>/vendor/design when it exists. */
export function designDir(from) {
  const env = process.env.JUPITER_DESIGN_DIR; if (env) return resolve(env);
  const d = from && join(from, "vendor/design"); return d && existsSync(d) ? d : null;
}
/** The release that was downloaded ({ repo, tag, version, files }), or null. */
export function designRelease(from) {
  const d = designDir(from); const f = d && join(d, "release.json");
  return f && existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : null;
}
const bases = (from) => [designDir(from) && join(designDir(from), "noop.js"), from && join(from, "noop.js"), join(packageRoot, "noop.js")].filter(Boolean);

export function pkgDir(name, from) {
  for (const base of bases(from)) {
    try { return dirname(createRequire(base).resolve(`${name}/package.json`)); } catch { /* try next */ }
  }
  return null;
}

let graphicsCache = null;
/** { names: Set of "tier/name", dir } or null when @belikh/jupiter-graphics is missing. */
export function graphicsSet(from) {
  const dir = pkgDir("@belikh/jupiter-graphics", from); if (!dir) return null;
  if (graphicsCache?.dir === dir) return graphicsCache;
  const f = join(dir, "dist/manifest.json"); if (!existsSync(f)) return null;
  const m = JSON.parse(readFileSync(f, "utf8"));
  graphicsCache = { dir, names: new Set(m.graphics.map((g) => `${g.tier}/${g.name}`)), tiers: m.tiers };
  return graphicsCache;
}
export function graphicSvg(ref, from) {
  const g = graphicsSet(from); if (!g || !g.names.has(ref)) return null;
  return readFileSync(join(g.dir, "dist/svg", `${ref}.svg`), "utf8").trim();
}

/** The Jupiter logo, light and dark, as { viewBox, inner } (from @belikh/jupiter-github, which embeds the owner's outlines). */
export async function logos(from) {
  const dir = pkgDir("@belikh/jupiter-github", from); if (!dir) return null;
  return (await import(join(dir, "src/logo.mjs"))).LOGO;
}

/** Absolute path of a package export such as @belikh/jupiter-tokens/tokens.css. */
export function resolveFile(spec, from) {
  for (const base of bases(from)) {
    try { return createRequire(base).resolve(spec); } catch { /* try next */ }
  }
  throw new Error(`cannot resolve ${spec}; run: npm run update:design (it downloads the latest design system release into vendor/design)`);
}
export const readCss = (spec, from) => readFileSync(resolveFile(spec, from), "utf8");
