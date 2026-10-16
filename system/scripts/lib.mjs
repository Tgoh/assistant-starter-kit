// Shared pieces for the engine's scripts. Names nothing personal: the
// principal's time zone comes from config.json at the repository root.
import { readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const P = {
  config: resolve(ROOT, "config.json"),
  json: resolve(ROOT, "obligations.json"),
  log: resolve(ROOT, "obligations-log.jsonl"),
  links: resolve(ROOT, "links.json"),
};

export const config = existsSync(P.config)
  ? JSON.parse(readFileSync(P.config, "utf8"))
  : { timezone: "UTC" };

// ---- dates: YYYY-MM-DD strings, arithmetic in UTC so no DST surprises ----
export function today() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: config.timezone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const g = (t) => parts.find((p) => p.type === t).value;
  return `${g("year")}-${g("month")}-${g("day")}`;
}
export const toDate = (s) => new Date(`${s}T00:00:00Z`);
export const fromDate = (d) => d.toISOString().slice(0, 10);
export function addInterval(iso, interval, sign = 1) {
  if (!interval) return iso;
  const { n, unit } = parseInterval(interval);
  const d = toDate(iso);
  if (unit === "d") d.setUTCDate(d.getUTCDate() + sign * n);
  else if (unit === "wk") d.setUTCDate(d.getUTCDate() + sign * 7 * n);
  else if (unit === "mo") d.setUTCMonth(d.getUTCMonth() + sign * n);
  else if (unit === "yr") d.setUTCFullYear(d.getUTCFullYear() + sign * n);
  return fromDate(d);
}
export function parseInterval(s) {
  const m = /^(\d+)\s*(d|wk|mo|yr)$/.exec(String(s).trim());
  if (!m) throw new Error(`bad interval "${s}" (use e.g. 3 d, 2 wk, 6 mo, 1 yr)`);
  return { n: Number(m[1]), unit: m[2] };
}
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export function human(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${String(y).slice(2)}`;
}
export function parseHuman(s) {
  const m = /^(\d{1,2}) ([A-Za-z]{3}) (\d{2}|\d{4})$/.exec(s.trim());
  if (!m) return null;
  const y = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  const mo = MONTHS.findIndex((x) => x.toLowerCase() === m[2].toLowerCase()) + 1;
  if (!mo) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(m[1]).padStart(2, "0")}`;
}

// ---- the arithmetic: the one place a wake is ever computed ----
// calendar-anchored:  wake = due − lead
// last-done-anchored: wake = done + every − lead; blank done wakes now
export function wake(row) {
  const a = row.anchor;
  if (a.type === "due") return addInterval(a.date, row.lead, -1);
  if (!a.date) return null; // never tracked: sorts to the top
  if (!row.every) throw new Error(`${row.id}: a done-anchored row needs an interval`);
  return addInterval(addInterval(a.date, row.every, 1), row.lead, -1);
}
export const wakeSortKey = (row) => wake(row) ?? "0000-00-00";

// ---- io ----
export const readJSON = (p) => JSON.parse(readFileSync(p, "utf8"));
export function writeJSON(p, data) {
  writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
}
export function logEvent(op, id, before, after, note) {
  const line = { ts: new Date().toISOString(), op, id, before: before ?? null, after: after ?? null };
  if (note) line.note = note;
  appendFileSync(P.log, JSON.stringify(line) + "\n");
}
// ---- when a row has outgrown itself ----
// A step or awaiting row whose `what` has been rewritten twice or more has
// had more than one exchange: its history belongs in a matter. It counts as
// having one if it links or names a matter, or carries extra["no-matter"]
// (the principal's reason for keeping it a row). Counted by key, from the log.
export function whatEdits(key) {
  if (!key || !existsSync(P.log)) return 0;
  let n = 0;
  for (const line of readFileSync(P.log, "utf8").split("\n")) {
    if (!line.includes(key)) continue;
    let e; try { e = JSON.parse(line); } catch { continue; }
    if (e.after?.key === key && e.before && e.before.what !== e.after.what) n++;
  }
  return n;
}
export const hasMatter = (r) =>
  (r.links ?? []).some((l) => l.startsWith("matters/")) || /matters\/\d{8}-/.test(r.what ?? "") || !!r.extra?.["no-matter"];
export function outgrown(r) {
  if (!["step", "awaiting"].includes(r.kind) || hasMatter(r)) return 0;
  const n = whatEdits(r.key);
  return n >= 2 ? n : 0;
}

export const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
