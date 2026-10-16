#!/usr/bin/env node
// The close's gate. Non-interactive; exit 1 with every finding listed, exit 0
// clean. Written to be run by a hook as well as by hand.
//
//   node system/scripts/check.mjs
//
// What it refuses: anything the obligations check refuses (schema, arithmetic,
// duplicates, broken pointers, unpaired closings, oversized extra,
// bad order); anything the site-notes check refuses; a journal entry that looks like
// working material; a sweep timestamp whose epoch disagrees with its label;
// a pointer anywhere in the data layer at a target that does not exist; a
// file left in the download staging folder; a text file with a BOM, CR line
// endings, a replacement character or mojibake.
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { P, ROOT, config } from "./lib.mjs";

const findings = [];
const rel = (p) => relative(ROOT, p).replace(/\\/g, "/");

// 1. the table
try {
  execFileSync(process.execPath, [resolve(ROOT, "system/scripts/obligations.mjs"), "check"], { stdio: ["ignore", "ignore", "pipe"] });
} catch (e) {
  for (const line of String(e.stderr ?? "").split(/\r?\n/)) if (line.trim()) findings.push(`obligations: ${line.trim().replace(/^- /, "")}`);
}

// 1b. the links table and the generated lines
try {
  execFileSync(process.execPath, [resolve(ROOT, "system/scripts/links.mjs"), "check"], { stdio: ["ignore", "ignore", "pipe"] });
} catch (e) {
  for (const line of String(e.stderr ?? "").split(/\r?\n/)) if (line.trim()) findings.push(`links: ${line.trim().replace(/^- /, "")}`);
}

// 1e. browser site notes: each names its domains, and no domain is claimed twice
try {
  execFileSync(process.execPath, [resolve(ROOT, "system/scripts/sitenotes.mjs"), "check"], { stdio: ["ignore", "ignore", "pipe"] });
} catch (e) {
  for (const line of String(e.stderr ?? "").split(/\r?\n/)) if (line.trim()) findings.push(`site notes: ${line.trim().replace(/^- /, "")}`);
}

// 1c. entity READMEs stay current truth — a README that grows is one being appended to
const README_MAX = config.readme_max_lines ?? 60;
const subj = resolve(ROOT, "subjects");
if (existsSync(subj)) {
  const walkReadmes = (d, out = []) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walkReadmes(p, out); else if (f === "README.md") out.push(p); } return out; };
  for (const p of walkReadmes(subj)) {
    const n = readFileSync(p, "utf8").split(/\r?\n/).filter((l) => l.trim()).length;
    if (n > README_MAX) findings.push(`${rel(p)}: ${n} non-blank lines, over ${README_MAX} — current truth only; move what has changed to history.md and what is research to a facet file`);
  }
}

// 3. journal entries that look like working material
const journalFiles = [];
if (existsSync(resolve(ROOT, "journal"))) for (const f of readdirSync(resolve(ROOT, "journal"))) if (f.endsWith(".md")) journalFiles.push(resolve(ROOT, "journal", f));
if (existsSync(resolve(ROOT, "journal.md"))) journalFiles.push(resolve(ROOT, "journal.md"));
const since = config.journal_checked_from ?? "0000-00-00"; // entries before this are grandfathered
for (const f of journalFiles) {
  const lines = readFileSync(f, "utf8").split(/\r?\n/);
  let day = "0000-00-00"; let bullet = null; let sub = 0; let dollars = 0;
  const flush = () => {
    if (bullet !== null && day >= since && (sub >= 3 || dollars >= 3)) findings.push(`${rel(f)}:${bullet}: looks like working material (${sub} sub-bullets, ${dollars} amounts) — a matter or a facet file, not the diary`);
    bullet = null; sub = 0; dollars = 0;
  };
  lines.forEach((l, i) => {
    const h = /^## (\d{4}-\d{2}-\d{2})/.exec(l); if (h) { flush(); day = h[1]; return; }
    if (/^- /.test(l)) { flush(); bullet = i + 1; dollars = (l.match(/\$\d/g) ?? []).length; return; }
    if (/^\s{2,}- /.test(l)) sub++;
    if (bullet !== null) dollars += (l.match(/\$\d/g) ?? []).length;
    if (l.trim() === "") flush();
  });
  flush();
}

// 4. the sweep's timestamp agrees with its epoch
if (config.sweep_skill && existsSync(resolve(ROOT, config.sweep_skill))) {
  const text = readFileSync(resolve(ROOT, config.sweep_skill), "utf8");
  const m = /\*\*(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})Z — epoch (\d{9,10})\*\*/.exec(text);
  if (!m) findings.push(`${config.sweep_skill}: no "**<UTC time>Z — epoch <n>**" last-run line found`);
  else {
    const fromEpoch = new Date(Number(m[2]) * 1000).toISOString().slice(0, 19);
    if (fromEpoch !== m[1]) findings.push(`${config.sweep_skill}: last-run label ${m[1]}Z but epoch ${m[2]} is ${fromEpoch}Z — the window is wrong by ${Math.round((Date.parse(m[1] + "Z") - Number(m[2]) * 1000) / 36e5)}h`);
    const next = /after:(\d{9,10})/.exec(text.slice(m.index));
    if (next && Number(m[2]) - Number(next[1]) !== 3600) findings.push(`${config.sweep_skill}: next-run epoch ${next[1]} is not one hour before ${m[2]}`);
  }
}

// 4b. the download staging folder is empty — every download filed or recycled
if (config.staging_dir && existsSync(config.staging_dir)) {
  const left = readdirSync(config.staging_dir).filter((f) => f.toLowerCase() !== "desktop.ini");
  if (left.length) findings.push(`${config.staging_dir}: ${left.length} file${left.length === 1 ? "" : "s"} still staged — file under its matter folder or recycle: ${left.slice(0, 5).join(", ")}`);
}

// 5. pointers in the data layer resolve
const walk = (d, out = []) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) { if (!/^(\.git|node_modules|\.claude)$/.test(f)) walk(p, out); } else if (f.endsWith(".md")) out.push(p); } return out; };
for (const f of walk(ROOT)) {
  if (/^(system|assistant)[\\/]/.test(relative(ROOT, f))) continue;
  const text = readFileSync(f, "utf8");
  for (const m of text.matchAll(/→ `((?:subjects|matters)\/[^`]+)`/g)) {
    const t = resolve(ROOT, m[1]);
    if (!(existsSync(t) || existsSync(t + ".md"))) findings.push(`${rel(f)}: pointer "${m[1]}" resolves to nothing`);
  }
}

// 6. text files are clean UTF-8 with LF endings: a BOM, a CR, a replacement
// character or mojibake is a sign the file went through a shell's encoding
const MOJIBAKE = new RegExp([[0xe2, 0x20ac], [0xc3, 0xa9], [0xc2, 0x20]].map((cs) => String.fromCharCode(...cs)).join("|")); // UTF-8 read as Windows-1252: an em dash, an e-acute, a non-breaking space
const textFiles = (d, out = []) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) { if (!/^(\.git|node_modules)$/.test(f)) textFiles(p, out); } else if (/\.(md|json|jsonl|mjs)$/.test(f)) out.push(p); } return out; };
for (const f of textFiles(ROOT)) {
  const b = readFileSync(f); const s = b.toString("utf8"); const bad = [];
  if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) bad.push("a BOM");
  if (s.includes("\r")) bad.push("CR line endings");
  if (s.includes(String.fromCharCode(0xfffd))) bad.push("a replacement character (text written in the wrong encoding)");
  if (MOJIBAKE.test(s)) bad.push("mojibake");
  if (bad.length) findings.push(`${rel(f)}: ${bad.join(", ")} — write files with the Write or Edit tools, never through PowerShell (CLAUDE.md)`);
}

if (findings.length) {
  console.error(`${findings.length} finding${findings.length === 1 ? "" : "s"}:`);
  for (const x of findings) console.error("  - " + x);
  process.exit(1);
}
console.log("clean");
