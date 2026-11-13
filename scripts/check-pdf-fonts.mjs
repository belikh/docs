#!/usr/bin/env node
// Fail unless every font embedded in a PDF is SGI Text, SGI Alt or JetBrains Mono (checked with pdffonts).
import { spawnSync } from "node:child_process";
const files = process.argv.slice(2);
if (!files.length) { console.error("usage: check-pdf-fonts.mjs file.pdf ..."); process.exit(2); }
let bad = 0;
for (const f of files) {
  const r = spawnSync("pdffonts", [f], { encoding: "utf8" });
  if (r.status !== 0) { console.error(`pdffonts failed for ${f}: ${r.stderr || r.error}`); process.exit(2); }
  const fonts = r.stdout.split("\n").slice(2).filter(Boolean).map((l) => l.split(/\s+/)[0].replace(/^[A-Z]{6}\+/, ""));
  const wrong = fonts.filter((n) => !/^(SGIText|SGIAlt|JetBrainsMono)/.test(n));
  console.log(`${f}: ${[...new Set(fonts)].join(", ")}`);
  if (!fonts.some((n) => n.startsWith("SGIText"))) { console.error(`${f}: SGI Text is not embedded`); bad++; }
  if (wrong.length) { console.error(`${f}: fonts that are not SGI Text, SGI Alt or JetBrains Mono: ${wrong.join(", ")}`); bad++; }
}
process.exit(bad ? 1 : 0);
