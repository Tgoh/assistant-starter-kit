#!/usr/bin/env node
// The open matters.
//
//   node system/scripts/matters.mjs triggers   (each open matter with no rows, and the situation that brings it back)
//   node system/scripts/matters.mjs close SLUG (only on the principal's word: moves it to matters/closed/)
//
// A matter with no rows stays open until the principal closes it, and its
// header carries a "**Trigger:**" line naming the situation that brings it
// back. This prints them at the start of a session, so the situation is
// recognised when it comes up.
//
// A matter is a folder, matters/<slug>/, holding README.md (the matter) and
// any supporting notes; its binary documents live outside the repo.
//
// close refuses while any row points at the matter. It moves the folder with
// git mv, removes the matter's links from links.json and re-renders the other
// READMEs; the closed file keeps its links line as it stood. It then lists the
// open files that still point at the matter, to be updated by hand.
import { readFileSync, readdirSync, existsSync, renameSync } from "node:fs";
import { resolve, join } from "node:path";
import { execFileSync } from "node:child_process";
import { P, ROOT, readJSON, writeJSON } from "./lib.mjs";

const [, , cmd, arg] = process.argv;
const mdir = resolve(ROOT, "matters");
const pointedAt = JSON.stringify(readJSON(P.json));

export function rowless() {
  const out = [];
  for (const slug of readdirSync(mdir)) {
    if (slug === "closed" || !existsSync(join(mdir, slug, "README.md"))) continue;
    if (pointedAt.includes(`matters/${slug}`)) continue;
    const text = readFileSync(join(mdir, slug, "README.md"), "utf8");
    out.push({ slug, title: /^# (.*)/m.exec(text)?.[1] ?? slug, trigger: /^\*\*Trigger:\*\*\s*(.*)$/m.exec(text)?.[1] ?? null });
  }
  return out;
}

if (cmd === "triggers") {
  const ms = rowless();
  if (!ms.length) console.log("no open matters without rows");
  for (const m of ms) console.log(`${m.slug} — ${m.title}\n  Trigger: ${m.trigger ?? "none written"}`);
} else if (cmd === "close") {
  try { close(arg?.replace(/^matters\//, "").replace(/(\/README)?\.md$/, "").replace(/\/$/, "")); }
  catch (e) { console.error(e.message); process.exit(1); }
} else if (cmd) {
  console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1, 15).join("\n"));
}

function close(slug) {
  if (!slug) throw new Error("close SLUG");
  const ptr = `matters/${slug}`;
  if (!existsSync(join(mdir, slug, "README.md"))) throw new Error(`no open matter ${ptr}`);
  const rows = readJSON(P.json).filter((r) => JSON.stringify(r).includes(ptr));
  if (rows.length) throw new Error(`refused: rows still point at ${ptr}: ${rows.map((r) => r.id).join(", ")}`);
  // move first, so the re-render no longer sees it and its links line stays as it stood
  try { execFileSync("git", ["mv", `matters/${slug}`, `matters/closed/${slug}`], { cwd: ROOT, stdio: "pipe" }); }
  catch { renameSync(join(mdir, slug), join(mdir, "closed", slug)); } // not yet committed
  const links = readJSON(P.links);
  const kept = links.filter((l) => l.from !== ptr && l.to !== ptr);
  writeJSON(P.links, kept);
  execFileSync(process.execPath, [resolve(ROOT, "system/scripts/links.mjs"), "render"], { cwd: ROOT });
  console.log(`closed ${ptr}: moved to matters/closed/, ${links.length - kept.length} link${links.length - kept.length === 1 ? "" : "s"} removed`);
  let out = "";
  try { out = execFileSync("git", ["grep", "-l", "-E", "--untracked", `${ptr}([^a-z0-9-]|$)`], { cwd: ROOT, encoding: "utf8" }); } catch { /* none */ }
  const open = out.split("\n").filter((f) => f && !f.startsWith("journal/") && !f.startsWith("matters/closed/") && !f.endsWith("history.md") && !f.endsWith(".jsonl"));
  if (open.length) console.log(`still pointing at ${ptr} (change to matters/closed/${slug}):\n  ${open.join("\n  ")}`);
  console.log("Now promote what it taught: facts to its entities, preferences to their research files.");
}
