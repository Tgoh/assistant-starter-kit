#!/usr/bin/env node
// The obligations table: obligations.json is the source, and every change is
// appended to obligations-log.jsonl.
//
//   node system/scripts/obligations.mjs list [--all] [--brief]   (woken rows in full; --brief ids only)
//   node system/scripts/obligations.mjs add --id ID --kind step|routine|reminder|closing|awaiting
//        --due YYYY-MM-DD | --done YYYY-MM-DD | --never  [--chosen] [--every "2 wk"]
//        [--lead "1 wk"] --what "..." [--link subjects/x/y ...] [--pairs ID]
//   node system/scripts/obligations.mjs tick ID [--on YYYY-MM-DD]
//   node system/scripts/obligations.mjs defer ID YYYY-MM-DD [--note "..."]
//   node system/scripts/obligations.mjs asked ID   (an awaiting row put to him, unanswered: ask again after `every`, or a week)
//   node system/scripts/obligations.mjs edit ID --what "..." | --lead "..." | --every "..." | --link matters/X (replaces the links; repeat for several) | --calendar EVENT_ID | --uncalendar EVENT_ID | --no-matter "why it stays a row"
//   (an edit that leaves a step's text rewritten twice or more with no matter prints a note; /close's audit lists such rows)
//   Any --FIELD can be given as --FIELD-file PATH (e.g. --what-file), read from a file written with the Write tool.
//   node system/scripts/obligations.mjs calendar  (every row with a calendar event: id, key, event ids)
//   node system/scripts/obligations.mjs calendar --gone  (events whose row ended or dropped them since the last commit: delete each)
//   node system/scripts/obligations.mjs keys       (gives a key to any row without one)
//
// Every row has a `key`, a UUID made at add and never reused; the row's id is a
// name and can come back. A calendar event carries "<calendar_tag>: <id> <key>" as the
// last line of its description, and the row carries the event's id in `calendar`.
//   node system/scripts/obligations.mjs remove ID [--note "..."]
//   (tick and remove say when the row was a matter's last, so the principal is asked whether to close it)
//   node system/scripts/obligations.mjs sort
//   node system/scripts/obligations.mjs check
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  P, ROOT, today, wake, wakeSortKey, human, parseHuman, parseInterval, addInterval,
  readJSON, writeJSON, logEvent, slugify, outgrown, config,
} from "./lib.mjs";

const TAG = config.calendar_tag ?? "Register";
const KINDS = ["step", "routine", "reminder", "closing", "awaiting"];
const CORE = ["id", "key", "kind", "anchor", "every", "lead", "what", "links", "pairs", "calendar", "extra"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const EXTRA_MAX = 600; // characters of JSON; anything bigger is a matter's material

// ---------- args ----------
const [, , cmd, ...rest] = process.argv;
const args = { _: [] };
for (let i = 0; i < rest.length; i++) {
  const a = rest[i];
  if (a.startsWith("--")) {
    const k = a.slice(2);
    const v = rest[i + 1] !== undefined && !rest[i + 1].startsWith("--") ? rest[++i] : true;
    if (k === "link") (args.link ??= []).push(v);
    else if (k.endsWith("-file")) args[k.slice(0, -5)] = readFileSync(v, "utf8").replace(/\r\n/g, "\n").trim(); // --what-file PATH: text that never passes through shell quoting
    else args[k] = v;
  } else args._.push(a);
}

const load = () => (existsSync(P.json) ? readJSON(P.json) : []);
const save = (rows) => { rows.sort(byWake); writeJSON(P.json, rows); };
const byWake = (a, b) => wakeSortKey(a).localeCompare(wakeSortKey(b)) || a.id.localeCompare(b.id);
const find = (rows, id) => {
  const r = rows.find((x) => x.id === id);
  if (!r) throw new Error(`no row with id "${id}"`);
  return r;
};

// ---------- validation ----------
export function validate(rows) {
  const errs = [];
  const ids = new Set(); const keys = new Set();
  for (const r of rows) {
    const at = `row "${r.id ?? "?"}"`;
    if (!r.id || r.id !== slugify(r.id)) errs.push(`${at}: id must be a slug`);
    if (ids.has(r.id)) errs.push(`${at}: duplicate id`);
    ids.add(r.id);
    if (!UUID.test(r.key ?? "")) errs.push(`${at}: key must be a UUID (run keys)`);
    else if (keys.has(r.key)) errs.push(`${at}: duplicate key`);
    keys.add(r.key);
    if (r.calendar !== undefined && !(Array.isArray(r.calendar) && r.calendar.every((e) => typeof e === "string" && e))) errs.push(`${at}: calendar must be a list of event ids`);
    if (!KINDS.includes(r.kind)) errs.push(`${at}: kind must be one of ${KINDS.join(", ")}`);
    for (const k of Object.keys(r)) if (!CORE.includes(k)) errs.push(`${at}: unknown field "${k}" (put it in extra)`);
    if (!r.anchor || !["due", "done"].includes(r.anchor.type)) errs.push(`${at}: anchor.type must be due or done`);
    else if (r.anchor.type === "due" && !/^\d{4}-\d{2}-\d{2}$/.test(r.anchor.date ?? "")) errs.push(`${at}: a due anchor needs a date`);
    else if (r.anchor.type === "done" && r.anchor.date && !/^\d{4}-\d{2}-\d{2}$/.test(r.anchor.date)) errs.push(`${at}: bad done date`);
    if (r.anchor?.type === "done" && !r.every) errs.push(`${at}: a done anchor needs an interval`);
    for (const f of ["every", "lead"]) if (r[f]) { try { parseInterval(r[f]); } catch (e) { errs.push(`${at}: ${e.message}`); } }
    if (!r.what || typeof r.what !== "string") errs.push(`${at}: what is required`);
    if (r.what && r.what.length > 700) errs.push(`${at}: what is ${r.what.length} chars — a row says what and when; the file it points at says why`);
    if (!Array.isArray(r.links)) errs.push(`${at}: links must be an array`);
    if (r.kind === "closing") {
      const partner = rows.find((x) => x.id === r.pairs);
      if (!partner) errs.push(`${at}: a closing row must pair with an existing reminder`);
      else if (partner.kind !== "reminder") errs.push(`${at}: pairs must name a reminder row`);
    }
    if (r.extra && JSON.stringify(r.extra).length > EXTRA_MAX) errs.push(`${at}: extra is over ${EXTRA_MAX} chars — that is working material, and it belongs in a matter`);
    try { wake(r); } catch (e) { errs.push(`${at}: ${e.message}`); }
  }
  // duplicates: same wake, same first link, and the opening words mostly shared
  const words = (s) => new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3).slice(0, 12));
  for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) {
    const a = rows[i], b = rows[j];
    if (a.kind === "closing" || b.kind === "closing") continue;
    if (wakeSortKey(a) !== wakeSortKey(b) || (a.links[0] ?? "") !== (b.links[0] ?? "")) continue;
    const wa = words(a.what), wb = words(b.what);
    const shared = [...wa].filter((w) => wb.has(w)).length;
    if (shared >= Math.min(wa.size, wb.size) * 0.5 && shared >= 3) errs.push(`"${a.id}" and "${b.id}" look like the same step: same wake, same link, ${shared} opening words shared`);
  }
  // pointers
  for (const r of rows) for (const l of r.links) {
    const target = l.startsWith("/") ? `.claude/skills/${l.slice(1)}/SKILL.md` : l;
    const abs = resolve(ROOT, target);
    if (!(existsSync(abs) || existsSync(abs + ".md"))) errs.push(`row "${r.id}": link "${l}" points at nothing`);
  }
  return errs;
}

// ---------- how a row prints ----------
const anchorText = (r) => {
  const a = r.anchor;
  if (a.type === "done" && !a.date) return "done *never*";
  let s = `${a.type} ${human(a.date)}`;
  if (a.chosen) s += " *chosen*";
  if (a.note) s += ` *${a.note}*`;
  return s;
};
const whatText = (r) => {
  let s = r.what;
  if (r.kind === "reminder") s = `*On now* — ${s}`;
  if (r.kind === "closing") s = `*Closes ${r.pairs}* — ${s}`;
  if (r.kind === "awaiting") s = `*Awaiting his answer* — ${s}`;
  const ptrs = r.links.map((l) => (l.startsWith("/") ? `→ \`${l}\`` : `→ \`${l}\``)).join(" ");
  return ptrs ? `${s} ${ptrs}` : s;
};
// a row with calendar events: say what the change means for them
const calendarNote = (r, what) => { if (r.calendar?.length) console.log(`calendar: ${what} event${r.calendar.length > 1 ? "s" : ""} ${r.calendar.join(", ")} ("${TAG}: ${r.id} ${r.key}")`); };
const lastRowNote = (r, rows) => {
  const ms = new Set((JSON.stringify(r).match(/matters\/\d{8}-[a-z0-9-]+/g) ?? []).filter((m) => !m.startsWith("matters/closed")));
  for (const m of ms) if (!rows.some((x) => JSON.stringify(x).includes(m)) && existsSync(resolve(ROOT, m, "README.md")))
    console.log(`${m} has no rows left. Ask whether to close it (matters.mjs close ${m.slice(8)}), or add its next step, or give it a **Trigger:** line.`);
};
// ---------- commands ----------
try {
  if (cmd === "list") {
    const rows = load().sort(byWake); const t = today();
    for (const r of rows) {
      const w = wake(r);
      if (!args.all && (w ?? "0") > t) break;
      console.log(`${w ? human(w).padEnd(10) : "never".padEnd(10)} ${r.kind.padEnd(8)} ${r.id}`);
      if (!args.brief) console.log(`  ${anchorText(r)} · every ${r.every ?? "—"} · lead ${r.lead ?? "—"}
  ${whatText(r)}
`);
    }
  } else if (cmd === "add") {
    const rows = load();
    if (!args.id) throw new Error("--id is required");
    if (rows.some((r) => r.id === args.id)) throw new Error(`id "${args.id}" already exists`);
    const anchor = args.never ? { type: "done", date: null }
      : args.due ? { type: "due", date: args.due } : args.done ? { type: "done", date: args.done } : null;
    if (!anchor) throw new Error("one of --due, --done, --never is required");
    if (args.chosen) anchor.chosen = true;
    const row = { id: args.id, key: randomUUID(), kind: args.kind ?? "step", anchor, every: args.every ?? null, lead: args.lead ?? null,
      what: args.what, links: args.link ?? [], ...(args.pairs ? { pairs: args.pairs } : {}) };
    const errs = validate([...rows, row]);
    if (errs.length) throw new Error("refused:\n  " + errs.join("\n  "));
    rows.push(row); save(rows); logEvent("add", row.id, null, row);
    console.log(`added ${row.id}, wakes ${human(wake(row)) || "never"}`);
  } else if (cmd === "tick") {
    const rows = load(); const r = find(rows, args._[0]); const before = structuredClone(r);
    const on = args.on ?? today();
    if (r.kind === "closing") {
      const rem = rows.find((x) => x.id === r.pairs);
      if (rem) { rows.splice(rows.indexOf(rem), 1); logEvent("remove", rem.id, rem, null, `closed by ${r.id}`); }
      rows.splice(rows.indexOf(r), 1); logEvent("tick", r.id, before, null, `closing row; reminder ${r.pairs} removed`);
      console.log(`closed ${r.id} and its reminder ${r.pairs}. Now move the fact from the entity's README into its history.`);
      calendarNote(r, "delete"); if (rem) calendarNote(rem, "delete"); lastRowNote(r, rows); if (rem) lastRowNote(rem, rows);
    } else if (!r.every) {
      rows.splice(rows.indexOf(r), 1); logEvent("tick", r.id, before, null);
      console.log(`done: ${r.id} removed. Record how it ended in its matter or the journal.`); calendarNote(r, "delete"); lastRowNote(r, rows);
    } else if (r.anchor.type === "due") {
      r.anchor.date = addInterval(r.anchor.date, r.every, 1);
      logEvent("tick", r.id, before, r); console.log(`advanced ${r.id}: due ${human(r.anchor.date)}, wakes ${human(wake(r))}`); calendarNote(r, "check the next occurrence of");
    } else {
      r.anchor.date = on; logEvent("tick", r.id, before, r);
      console.log(`done ${human(on)}: ${r.id} wakes ${human(wake(r))}`); calendarNote(r, "move");
    }
    save(rows);
  } else if (cmd === "defer") {
    const rows = load(); const r = find(rows, args._[0]); const before = structuredClone(r);
    const to = args._[1]; if (!/^\d{4}-\d{2}-\d{2}$/.test(to ?? "")) throw new Error("defer ID YYYY-MM-DD");
    r.anchor = { type: "due", date: to, chosen: true, ...(args.note ? { note: args.note } : {}) };
    if (r.every && before.anchor.type === "done") console.log("note: a done-anchored recurring row deferred becomes due-anchored; tick it to return");
    save(rows); logEvent("defer", r.id, before, r, args.note);
    const n = existsSync(P.log) ? readFileSync(P.log, "utf8").split("\n").filter((l) => l.includes(`"op":"defer"`) && l.includes(`"id":"${r.id}"`)).length : 1;
    console.log(`deferred ${r.id} to ${human(to)}, wakes ${human(wake(r))}${n >= 3 ? ` — deferred ${n} times now; is this a decision being avoided?` : ""}`); calendarNote(r, "move");
  } else if (cmd === "asked") {
    const rows = load(); const r = find(rows, args._[0]); const before = structuredClone(r);
    if (r.kind !== "awaiting") throw new Error(`${r.id} is a ${r.kind} row; asked is for awaiting rows`);
    const again = addInterval(today(), r.every ?? "1 wk", 1);
    r.anchor = { type: "due", date: again, chosen: true };
    save(rows); logEvent("asked", r.id, before, r);
    const n = existsSync(P.log) ? readFileSync(P.log, "utf8").split("\n").filter((l) => l.includes(`"op":"asked"`) && l.includes(`"id":"${r.id}"`)).length : 1;
    console.log(`asked ${r.id}; asks again ${human(again)}${n >= 3 ? ` — asked ${n} times now; does he want to answer it, or should it go?` : ""}`);
  } else if (cmd === "edit") {
    const rows = load(); const r = find(rows, args._[0]); const before = structuredClone(r);
    for (const k of ["what", "lead", "every", "kind", "pairs"]) if (args[k] !== undefined) r[k] = args[k] === "none" ? null : args[k];
    if (args.link) r.links = args.link;
    if (typeof args["no-matter"] === "string") r.extra = { ...(r.extra ?? {}), "no-matter": args["no-matter"] };
    if (typeof args.calendar === "string") r.calendar = [...new Set([...(r.calendar ?? []), args.calendar])];
    if (typeof args.uncalendar === "string") { r.calendar = (r.calendar ?? []).filter((e) => e !== args.uncalendar); if (!r.calendar.length) delete r.calendar; console.log(`calendar: delete event ${args.uncalendar} ("${TAG}: ${r.id} ${r.key}")`); }
    const errs = validate(rows); if (errs.length) throw new Error("refused:\n  " + errs.join("\n  "));
    save(rows); logEvent("edit", r.id, before, r); console.log(`edited ${r.id}`);
    const n = outgrown(r);
    if (n) console.log(`note: ${r.id}'s text has been rewritten ${n} times and it has no matter. If it has history, options or a reply awaited, open one and point the row at it; if not, say why in extra["no-matter"].`);
  } else if (cmd === "remove") {
    const rows = load(); const r = find(rows, args._[0]);
    rows.splice(rows.indexOf(r), 1); save(rows); logEvent("remove", r.id, r, null, args.note); console.log(`removed ${r.id}`); calendarNote(r, "delete"); lastRowNote(r, rows);
  } else if (cmd === "calendar" && args.gone) {
    // events whose row ended, or which a row dropped, since the last commit: each should be deleted
    const since = execFileSync("git", ["log", "-1", "--format=%cI"], { cwd: ROOT, encoding: "utf8" }).trim();
    const sinceMs = since ? Date.parse(since) : 0; let n = 0;
    for (const line of (existsSync(P.log) ? readFileSync(P.log, "utf8") : "").split("\n")) {
      if (!line.trim()) continue; let e; try { e = JSON.parse(line); } catch { continue; }
      if (Date.parse(e.ts) <= sinceMs) continue;
      const kept = new Set(e.after?.calendar ?? []);
      for (const ev of e.before?.calendar ?? []) if (!kept.has(ev)) { console.log(`${ev} ${e.id} ${e.before.key ?? ""} (${e.op})`); n++; }
    }
    if (!n) console.log(`no events left behind since the last commit (${since || "none"})`);
  } else if (cmd === "calendar") {
    for (const r of load().sort(byWake)) if (r.calendar?.length) console.log(`${r.id} ${r.key} ${r.calendar.join(" ")}`);
  } else if (cmd === "keys") {
    const rows = load(); let n = 0;
    for (const r of rows) if (!r.key) { const before = structuredClone(r); r.key = randomUUID(); logEvent("edit", r.id, before, r, "key added"); n++; }
    save(rows); console.log(`gave ${n} row${n === 1 ? "" : "s"} a key`);
  } else if (cmd === "sort") {
    const rows = load(); rows.sort(byWake); writeJSON(P.json, rows); console.log(`sorted ${rows.length} rows`);
  } else if (cmd === "check") {
    const rows = load(); const errs = validate(rows);
    if (JSON.stringify([...rows].sort(byWake)) !== JSON.stringify(rows)) errs.push("obligations.json is out of wake order — run sort");
    if (errs.length) { console.error(errs.map((e) => "  - " + e).join("\n")); process.exit(1); }
    console.log(`obligations: ${rows.length} rows, clean`);
  } else {
    console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1, 24).join("\n"));
  }
} catch (e) { console.error(e.message); process.exit(1); }
