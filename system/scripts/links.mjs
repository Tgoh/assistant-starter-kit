#!/usr/bin/env node
// Relationships between entities: links.json is the source, and each entity
// README carries one generated line.
//
//   node system/scripts/links.mjs add FROM RELATION TO [--since ...] [--source ...] [--note ...]
//   node system/scripts/links.mjs remove FROM RELATION TO
//   node system/scripts/links.mjs list [ENTITY]
//   node system/scripts/links.mjs render   (sorts the table and rewrites the generated line in every README)
//   node system/scripts/links.mjs check
//
// FROM and TO are entity paths under subjects/, e.g. people/<slug>. A row reads
// "FROM RELATION TO": people/<a> "friend of" people/<b>; providers/<insurer>
// "insures" properties/<home>. ROOT_ENTITY (config.json "root", e.g. household,
// business, team) is the whole thing the assistant looks after.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, join, relative, dirname } from "node:path";
import { P, ROOT, readJSON, writeJSON, config } from "./lib.mjs";

const ROOT_ENTITY = config.root || "household";

const MARK = "**Links (generated):**";
const [, , cmd, ...rest] = process.argv;
const args = { _: [] };
for (let i = 0; i < rest.length; i++) {
  const a = rest[i];
  if (a.startsWith("--")) args[a.slice(2)] = rest[i + 1] !== undefined && !rest[i + 1].startsWith("--") ? rest[++i] : true;
  else args._.push(a);
}
const load = () => (existsSync(P.links) ? readJSON(P.links) : []);
const key = (l) => `${l.from}|${l.relation}|${l.to}`;
const sortRows = (rows) => rows.sort((a, b) => key(a).localeCompare(key(b)));

// every entity folder: subjects/<category>/<slug>/README.md, plus subjects/<root>
export function entities() {
  const out = [];
  const subj = resolve(ROOT, "subjects");
  if (existsSync(resolve(subj, ROOT_ENTITY, "README.md"))) out.push(ROOT_ENTITY);
  for (const cat of readdirSync(subj)) {
    const d = join(subj, cat);
    if (!statSync(d).isDirectory() || cat === ROOT_ENTITY) continue;
    for (const slug of readdirSync(d)) if (existsSync(join(d, slug, "README.md"))) out.push(`${cat}/${slug}`);
  }
  return out;
}
// matters are endpoints too: "matters/<name>" (open) — a matter is with and about entities.
// Each is a folder, matters/<name>/README.md, like an entity; closed/ is not one.
export function matters() {
  const d = resolve(ROOT, "matters"); if (!existsSync(d)) return [];
  return readdirSync(d).filter((f) => f !== "closed" && existsSync(join(d, f, "README.md"))).map((f) => `matters/${f}`);
}
const pathFor = (e) => e.startsWith("matters/") ? resolve(ROOT, e, "README.md") : resolve(ROOT, "subjects", e, "README.md");

export function validate(rows) {
  const errs = []; const seen = new Set(); const ents = new Set([...entities(), ...matters()]);
  for (const l of rows) {
    for (const f of ["from", "relation", "to"]) if (!l[f] || typeof l[f] !== "string") errs.push(`link ${JSON.stringify(l)}: ${f} is required`);
    if (l.from && !ents.has(l.from)) errs.push(`link "${key(l)}": no entity "${l.from}"`);
    if (l.to && !ents.has(l.to)) errs.push(`link "${key(l)}": no entity "${l.to}"`);
    if (seen.has(key(l))) errs.push(`link "${key(l)}": duplicate`);
    seen.add(key(l));
    for (const k of Object.keys(l)) if (!["from", "relation", "to", "since", "source", "note"].includes(k)) errs.push(`link "${key(l)}": unknown field "${k}"`);
  }
  return errs;
}

const short = (e) => e.split("/").pop();
function lineFor(entity, rows) {
  const out = rows.filter((l) => l.from === entity).map((l) => `${l.relation} \`${short(l.to)}\``);
  const inc = rows.filter((l) => l.to === entity).map((l) => `\`${short(l.from)}\` ${l.relation}`);
  const parts = [...out, ...inc.map((s) => `← ${s}`)];
  return parts.length ? `${MARK} ${parts.join(" · ")}` : `${MARK} none yet`;
}

function injectReadmes(rows) {
  let n = 0;
  for (const e of [...entities(), ...matters()]) {
    const p = pathFor(e);
    const lines = readFileSync(p, "utf8").split(/\r?\n/);
    const want = lineFor(e, rows);
    const i = lines.findIndex((l) => l.startsWith(MARK));
    if (i >= 0) { if (lines[i] === want) continue; lines[i] = want; }
    else {
      const h = lines.findIndex((l) => l.startsWith("# "));
      lines.splice(h + 1, 0, "", want);
    }
    writeFileSync(p, lines.join("\n")); n++;
  }
  return n;
}

try {
  const rows = load();
  if (cmd === "add") {
    const [from, relation, to] = args._;
    const l = { from, relation, to, ...(args.since ? { since: args.since } : {}), ...(args.source ? { source: args.source } : {}), ...(args.note ? { note: args.note } : {}) };
    const errs = validate([...rows, l]); if (errs.length) throw new Error("refused:\n  " + errs.join("\n  "));
    rows.push(l); writeJSON(P.links, sortRows(rows)); injectReadmes(rows);
    console.log(`linked ${key(l)}`);
  } else if (cmd === "remove") {
    const [from, relation, to] = args._; const i = rows.findIndex((l) => l.from === from && l.relation === relation && l.to === to);
    if (i < 0) throw new Error("no such link"); rows.splice(i, 1);
    writeJSON(P.links, rows); injectReadmes(rows); console.log("removed");
  } else if (cmd === "list") {
    const e = args._[0];
    for (const l of sortRows([...rows])) if (!e || l.from === e || l.to === e) console.log(`${l.from}  ${l.relation}  ${l.to}`);
  } else if (cmd === "render") {
    writeJSON(P.links, sortRows(rows));
    const n = injectReadmes(rows);
    console.log(`rendered ${rows.length} links, ${n} READMEs updated`);
  } else if (cmd === "check") {
    const errs = validate(rows);
    for (const e of [...entities(), ...matters()]) {
      const text = readFileSync(pathFor(e), "utf8");
      const cur = text.split(/\r?\n/).find((l) => l.startsWith(MARK));
      if (cur !== undefined && cur !== lineFor(e, rows)) errs.push(`${e}: generated links line is stale — run render`);
    }
    const linked = new Set(rows.flatMap((l) => [l.from, l.to]));
    for (const e of entities()) if (!linked.has(e) && e !== ROOT_ENTITY) errs.push(`subjects/${e}: an entity nothing links to — connect it or ask why it exists`);
    if (errs.length) { console.error(errs.map((e) => "  - " + e).join("\n")); process.exit(1); }
    console.log(`links: ${rows.length} rows, clean`);
  } else console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1, 12).join("\n"));
} catch (e) { console.error(e.message); process.exit(1); }
