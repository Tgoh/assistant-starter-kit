#!/usr/bin/env node
// The open matters.
//
//   node system/scripts/matters.mjs triggers   (each open matter with no rows, and the situation that brings it back)
//
// A matter with no rows stays open until the principal closes it, and its
// header carries a "**Trigger:**" line naming the situation that brings it
// back. This prints them at the start of a session, so the situation is
// recognised when it comes up.
import { readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { P, ROOT, readJSON } from "./lib.mjs";

const [, , cmd] = process.argv;
const mdir = resolve(ROOT, "matters");
const pointedAt = JSON.stringify(readJSON(P.json));

export function rowless() {
  const out = [];
  for (const f of readdirSync(mdir)) {
    if (!f.endsWith(".md")) continue;
    const slug = f.replace(/\.md$/, "");
    if (pointedAt.includes(`matters/${slug}`)) continue;
    const text = readFileSync(join(mdir, f), "utf8");
    out.push({ slug, title: /^# (.*)/m.exec(text)?.[1] ?? slug, trigger: /^\*\*Trigger:\*\*\s*(.*)$/m.exec(text)?.[1] ?? null });
  }
  return out;
}

if (cmd === "triggers") {
  const ms = rowless();
  if (!ms.length) console.log("no open matters without rows");
  for (const m of ms) console.log(`${m.slug} — ${m.title}\n  Trigger: ${m.trigger ?? "none written"}`);
} else if (cmd) {
  console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1, 9).join("\n"));
}
