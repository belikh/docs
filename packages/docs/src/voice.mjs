// The voice check: finds wording that reads as marketing, filler or machine-written text, and sentences that are hard to
// follow. The word tables are in spec.mjs (VOICE); skill/VOICE.md explains each rule.
import { readFileSync } from "node:fs";
import { VOICE } from "./spec.mjs";

const compile = (list) => list.map(([label, source, say]) => ({ label, say, re: new RegExp(`(?<![\\p{L}\\p{N}])(?:${source})(?![\\p{L}\\p{N}])`, "iu") }));
const RULES = { error: compile(VOICE.error), warning: compile(VOICE.warning) };
// what stands in for inline code: not a word, but a sentence can start with it
const CODE = " \u00a7 ";
const words = (s) => s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

/** Check one unit of prose (a paragraph, a heading, a list item or a table cell) with code already removed.
 *  Returns [{ level: "error" | "warning", message }]. */
export function checkVoice(text) {
  const out = []; const t = text.replace(/\s+/g, " ").trim(); if (!t) return out;
  for (const level of ["error", "warning"]) for (const r of RULES[level]) { const m = r.re.exec(t); if (m) out.push({ level, message: `"${m[0]}": ${r.say}` }); }
  if (t.includes("—")) out.push({ level: "error", message: "em dash: use a comma, a colon, a full stop or parentheses" });
  if (/\p{Extended_Pictographic}/u.test(t.replace(/[©®™]/g, ""))) out.push({ level: "error", message: "emoji: use a word, or a graphic from the graphics set" });
  if (/[\p{L}\p{N})]!(\s|$)/u.test(t)) out.push({ level: "warning", message: "exclamation mark: end the sentence with a full stop" });
  if (/(?:^|[.!?] )(?:\p{Lu}[\p{L}-]*[.!] ){2}\p{Lu}[\p{L}-]*[.!](?: |$)/u.test(t)) out.push({ level: "warning", message: "three one-word sentences in a row: write one sentence that states the fact" });
  for (const s of t.split(/(?<=[.!?])\s+(?=[\p{Lu}\p{N}"'(\[\u00a7])/u)) {
    const n = words(s); if (n > VOICE.maxSentenceWords) out.push({ level: "warning", message: `sentence of ${n} words (limit ${VOICE.maxSentenceWords}): split it, one idea per sentence: "${s.split(/\s+/).slice(0, 6).join(" ")} ..."` });
  }
  return out;
}

/** The prose of a parsed page as [{ line, text }]: paragraphs, headings and table cells, without inline code. Block quotes
 *  and code blocks are left out, so quoted text and examples stay as they are. */
export function proseOf(tree) {
  const units = [];
  const text = (nodes) => (nodes ?? []).map((n) => (n.type === "code" ? CODE : n.type === "text" ? n.value : n.type === "softbreak" || n.type === "hardbreak" ? " " : n.type === "image" ? "" : n.type === "term" ? n.text : n.type === "xref" ? n.text || (n.children ? text(n.children) : "") : text(n.children))).join("");
  const walk = (nodes) => {
    for (const n of nodes ?? []) {
      if (n.type === "quote" || n.type === "codeblock") continue;
      if (n.type === "paragraph" || n.type === "heading") units.push({ line: n.line, text: text(n.children) });
      else if (n.type === "table") for (const row of [n.head, ...n.rows]) for (const c of row) units.push({ line: n.line, text: text(c) });
      else if (n.type === "list") for (const it of n.items) walk(it);
      else { if (n.type === "callout" && n.title) units.push({ line: n.line, text: n.title }); walk(n.children); }
    }
  };
  walk(tree); return units;
}

/** The prose of a Markdown or reStructuredText file that is not a docs-src page (a README, a skill, release notes) as
 *  [{ line, text }]. Code blocks, inline code, quotes, raw HTML, directives, URLs and front matter are left out. */
export function proseOfFile(source, { rst = false } = {}) {
  const lines = source.replace(/\r\n/g, "\n").split("\n"); const keep = []; let fence = null; let front = lines[0] === "---"; let comment = false;
  lines.forEach((raw, i) => {
    let l = raw;
    if (front) { if (i > 0 && l === "---") front = false; keep.push(""); return; }
    const f = /^\s*(`{3,}|~{3,})/.exec(l);
    if (f) { if (!fence) fence = f[1][0]; else if (f[1][0] === fence) fence = null; keep.push(""); return; }
    if (fence) { keep.push(""); return; }
    if (comment || l.includes("<!--")) { comment = !l.includes("-->"); keep.push(""); return; }
    if (/^\s*>/.test(l) || (rst && (/^(\s{3,}|\t)\S/.test(l) || /^\.\. /.test(l))) || /^\s*([-=~^"'`#*+:|.]{3,}\s*)+$/.test(l)) { keep.push(""); return; }
    l = l.replace(/``[^`]*``|`[^`\n]*`/g, CODE).replace(/\]\([^)]*\)/g, "]").replace(/<https?:[^>]*>`?_*/g, " ").replace(/https?:\/\/\S+/g, " ").replace(/<\/?[a-zA-Z][^>]*>/g, " ").replace(/^\s*:[\w-]+:.*$/, "").replace(/[*_]{1,2}(?=\S)|(?<=\S)[*_]{1,2}/g, "");
    keep.push(l);
  });
  const units = []; let cur = null;
  const flush = () => { if (cur && cur.text.trim()) units.push(cur); cur = null; };
  keep.forEach((l, i) => {
    if (!l.trim()) { flush(); return; }
    if (/^\s*\|/.test(l) && l.trim() !== "|") { flush(); for (const c of l.split("|")) if (c.trim() && !/^[\s:-]+$/.test(c)) units.push({ line: i + 1, text: c }); return; }
    const item = /^\s*(?:[-*+]|\d+[.)]|#{1,6})\s+(.*)$/.exec(l);
    if (item) { flush(); cur = { line: i + 1, text: item[1] }; return; }
    if (cur) cur.text += ` ${l.trim()}`; else cur = { line: i + 1, text: l.trim() };
  });
  flush(); return units;
}

/** Check files that are not docs-src pages. Returns { errors, warnings } as "file:line: voice: message" strings. */
export function checkVoiceFiles(files) {
  const errors = []; const warnings = [];
  for (const file of files) {
    for (const u of proseOfFile(readFileSync(file, "utf8"), { rst: /\.(rst|txt)$/.test(file) })) for (const v of checkVoice(u.text)) (v.level === "error" ? errors : warnings).push(`${file}:${u.line}: voice: ${v.message}`);
  }
  return { errors, warnings };
}
