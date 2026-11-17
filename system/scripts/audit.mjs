#!/usr/bin/env node
// The close's structural checks. Run by /close before the commit, not by the
// hook. Non-interactive; exit 1 with every finding listed, exit 0 clean.
//
//   node system/scripts/audit.mjs
//
// What it reports: an entity named anywhere in system/ (the names come from
// the subject folders, so this file names nobody); a file in a skill folder
// that its SKILL.md never mentions; an open matter with no rows pointing at it
// without a trigger line; a row rewritten twice or more that has no matter.
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { P, ROOT, readJSON, outgrown } from "./lib.mjs";

const findings = [];
const rel = (p) => relative(ROOT, p).replace(/\\/g, "/");
const walk = (d, out = []) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p, out); else out.push(p); } return out; };
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// 1. system/ names nothing personal: no entity slug appears in it
const slugs = [];
const subj = resolve(ROOT, "subjects");
for (const cat of readdirSync(subj)) {
  const d = join(subj, cat);
  if (!statSync(d).isDirectory()) continue;
  for (const s of readdirSync(d)) if (statSync(join(d, s)).isDirectory()) slugs.push(s);
}
const nameRe = new RegExp(`\\b(${slugs.map(esc).join("|")})\\b`, "i");
if (slugs.length) for (const f of walk(resolve(ROOT, "system"))) {
  readFileSync(f, "utf8").split(/\r?\n/).forEach((l, i) => {
    const m = nameRe.exec(l);
    if (m) findings.push(`${rel(f)}:${i + 1}: names "${m[1]}" — system/ names nothing personal; say "the principal" or use a placeholder`);
  });
}

// 2. every file in a skill folder is one its SKILL.md mentions
const skills = resolve(ROOT, ".claude/skills");
for (const s of readdirSync(skills)) {
  const d = join(skills, s);
  if (!statSync(d).isDirectory() || !existsSync(join(d, "SKILL.md"))) continue;
  const text = readFileSync(join(d, "SKILL.md"), "utf8");
  for (const top of readdirSync(d)) {
    if (top === "SKILL.md") continue;
    const named = statSync(join(d, top)).isDirectory() ? text.includes(`${top}/`) : text.includes(top);
    if (!named) findings.push(`.claude/skills/${s}/${top}: SKILL.md never mentions it — a file no run reads belongs with its entity, matter or table`);
  }
}

// 3. an open matter with no rows names its trigger
const rows = readJSON(P.json);
const pointedAt = JSON.stringify(rows);
const mdir = resolve(ROOT, "matters");
for (const slug of readdirSync(mdir)) {
  if (slug === "closed" || !existsSync(join(mdir, slug, "README.md"))) continue;
  if (pointedAt.includes(`matters/${slug}`)) continue;
  if (!/^\*\*Trigger:\*\*\s*\S/m.test(readFileSync(join(mdir, slug, "README.md"), "utf8"))) findings.push(`matters/${slug}: no rows and no "**Trigger:**" line — name the situation that brings it back, give it its next step, or ask the principal whether to close it out`);
}

// 4. a row rewritten twice or more without a matter has outgrown itself
for (const r of rows) {
  const n = outgrown(r);
  if (n) findings.push(`row "${r.id}": text rewritten ${n} times, no matter — open one and point the row at it, or put the principal's reason in extra["no-matter"]`);
}

if (findings.length) {
  console.error(`${findings.length} finding${findings.length === 1 ? "" : "s"}:`);
  for (const x of findings) console.error("  - " + x);
  process.exit(1);
}
console.log("clean");
