#!/usr/bin/env node
// Site notes for browser work: one file per site in .claude/skills/browser/sites/,
// whose first line names the domains it covers ("domains: example.com, example.net").
//
//   node system/scripts/sitenotes.mjs URL     (prints the matching note in full, or says there is none)
//   node system/scripts/sitenotes.mjs list    (every note and its domains)
//   node system/scripts/sitenotes.mjs check   (every note has a domains line; no domain claimed twice)
//
// A host matches a domain when it is that domain or a subdomain of it, so
// app.example.com finds example.com. When several match, the longest wins, so a
// note for mail.google.com beats one for google.com.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, relative } from "node:path";
import { ROOT } from "./lib.mjs";

const DIR = resolve(ROOT, ".claude/skills/browser/sites");
const rel = (p) => relative(ROOT, p).replace(/\\/g, "/");

function notes() {
  if (!existsSync(DIR)) return [];
  return readdirSync(DIR).filter((f) => f.endsWith(".md")).sort().map((f) => {
    const path = resolve(DIR, f);
    const text = readFileSync(path, "utf8");
    const m = /^domains:\s*(.+)$/m.exec(text.split(/\r?\n/)[0] ?? "");
    const domains = m ? m[1].split(",").map((d) => d.trim().toLowerCase()).filter(Boolean) : null;
    return { file: f, path, text, domains };
  });
}

function hostOf(arg) {
  let s = String(arg).trim();
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = "https://" + s;
  try { const h = new URL(s).hostname.toLowerCase().replace(/^www\./, ""); return h.includes(".") ? h : null; } catch { return null; }
}

const [, , cmd] = process.argv;
if (!cmd) {
  console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").filter((l) => l.startsWith("//")).slice(0, 8).map((l) => l.slice(3)).join("\n"));
} else if (cmd === "list") {
  for (const n of notes()) console.log(`${n.file}  ${n.domains ? n.domains.join(", ") : "(no domains line)"}`);
} else if (cmd === "check") {
  const errs = [];
  const seen = new Map();
  for (const n of notes()) {
    if (!n.domains || !n.domains.length) { errs.push(`${rel(n.path)}: first line must be "domains: a.com, b.com"`); continue; }
    for (const d of n.domains) {
      if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d)) errs.push(`${rel(n.path)}: "${d}" is not a domain`);
      if (seen.has(d)) errs.push(`${rel(n.path)}: ${d} is also claimed by ${seen.get(d)}`);
      else seen.set(d, n.file);
    }
  }
  if (errs.length) { console.error(errs.map((e) => "  - " + e).join("\n")); process.exit(1); }
  console.log(`clean: ${notes().length} site notes`);
} else {
  const host = hostOf(cmd);
  if (!host) { console.error(`not a URL or host: ${cmd}`); process.exit(1); }
  let best = null;
  for (const n of notes()) for (const d of n.domains ?? []) {
    if ((host === d || host.endsWith("." + d)) && (!best || d.length > best.d.length)) best = { n, d };
  }
  if (!best) {
    console.log(`No site notes for ${host}. If something about this site is worth keeping, create .claude/skills/browser/sites/<site>.md with "domains: ${host}" as its first line (widen it to the parent domain only if the whole domain behaves the same).`);
  } else {
    console.log(`Site notes for ${host}: ${rel(best.n.path)} (matched ${best.d})\n`);
    console.log(best.n.text.trimEnd());
  }
}
