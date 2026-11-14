#!/usr/bin/env node
// Keeps the last published PDF of every project whose PDF did not build in this run, so its site link still works.
// Run after build:pdf fails. Reads the project list written by the import and the hub's config; writes into dist/.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(join(root, "docs.config.json"), "utf8"));
const projects = existsSync(join(root, "docs-src/_imported/projects.json")) ? JSON.parse(readFileSync(join(root, "docs-src/_imported/projects.json"), "utf8")) : [];
const site = config.siteUrl.replace(/\/$/, "");
const wanted = [{ dir: "", file: config.pdf ?? `${config.id}.pdf` }, ...projects.map((p) => ({ dir: `${p.id}/`, file: `${p.id}.pdf` }))];
for (const { dir, file } of wanted) {
  const local = join(root, "dist", file);
  if (existsSync(local)) continue;
  const r = await fetch(`${site}/${dir}${file}`).catch(() => null);
  if (!r || !r.ok) { console.log(`no published PDF for ${dir || "the hub"}${file}; its site page will not link to one`); continue; }
  mkdirSync(join(root, "dist"), { recursive: true }); writeFileSync(local, Buffer.from(await r.arrayBuffer()));
  console.log(`kept the published ${dir}${file}`);
}
