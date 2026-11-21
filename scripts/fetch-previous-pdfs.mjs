#!/usr/bin/env node
// Keeps the last published PDF of every project whose PDF did not build in this run, so its site link still works.
// Run after build:pdf fails. Reads the project list written by the import and the hub's config; writes into dist/.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { documentErrors, pdfFile } from "../packages/docs/src/config.mjs";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(join(root, "docs.config.json"), "utf8"));
const projects = existsSync(join(root, "docs-src/_imported/projects.json")) ? JSON.parse(readFileSync(join(root, "docs-src/_imported/projects.json"), "utf8")) : [];
const site = config.siteUrl.replace(/\/$/, "");
// a project that lists documents has one PDF per document, named as source.mjs names them
const files = (id, documents, single) => (documents !== undefined && !documentErrors(documents, "").length ? documents.map((d) => pdfFile(id, d.id)) : [single]);
const wanted = [...files(config.id, config.documents, config.pdf ?? pdfFile(config.id)).map((file) => ({ dir: "", file })), ...projects.flatMap((p) => files(p.id, p.documents, pdfFile(p.id)).map((file) => ({ dir: `${p.id}/`, file })))];
for (const { dir, file } of wanted) {
  const local = join(root, "dist", file);
  if (existsSync(local)) continue;
  const r = await fetch(`${site}/${dir}${file}`).catch(() => null);
  if (!r || !r.ok) { console.log(`no published PDF for ${dir || "the hub"}${file}; its site page will not link to one`); continue; }
  mkdirSync(join(root, "dist"), { recursive: true }); writeFileSync(local, Buffer.from(await r.arrayBuffer()));
  console.log(`kept the published ${dir}${file}`);
}
