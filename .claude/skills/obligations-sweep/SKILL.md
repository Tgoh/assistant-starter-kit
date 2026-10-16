---
name: obligations-sweep
description: Re-read every row of the obligations table, not just the woken ones, and confirm each next step is still the next step and still points at the right kind of thing. Use when the row wakes.
---

# Obligations sweep

Checking that every row is still true. This is the one with teeth.

## What it's for

The daily checks read rows whose wake has arrived. They never read the rest.
So a row can sit with a wake three weeks out while the world underneath it has
moved: the other side went quiet, the matter changed shape, the next step
stopped being the next step. Quiet reads like progress.

**The mechanical half is the script's.** Sort order, duplicates, broken
pointers, arithmetic and unpaired closings are refused at write time and at
close by `system/scripts/obligations.mjs check`. What is left is judgement.

## Steps

1. `node system/scripts/obligations.mjs list --all`, then read **every** row.
2. For each: **is the next step still the next step?** Read the matter or
   entity it points at, not just the row: the file is the deeper record and
   wins.
3. **Is the thing it points at still the right kind of thing?** A row that has
   grown a paragraph is a matter that hasn't been opened. A name that keeps
   appearing in rows is an entity that hasn't been born. Open the file, then
   shorten the row.
4. For each waiting on someone else: **how long since anything actually
   happened**, against that party's normal response time? If it's past, the
   row gets a chase step and a wake of now.
5. **Rows marked chosen**: the date was ours. Is it still the right date? Is
   the thing still wanted? **A row deferred three times is a decision being
   avoided, not a task**: say so rather than re-dating it a fourth time.
   `grep '"op":"defer"' obligations-log.jsonl` counts them.
6. **The routines.** For each `routine` row, read the log for when it last ran
   and what it produced. One that produced nothing two runs in a row has the
   wrong interval or shouldn't exist. Recommend, and change the row only on the
   principal's word. A skill no row points at that hasn't fired since the last
   sweep has the wrong trigger or is dead.
7. **The open matters without rows.** `node system/scripts/matters.mjs
   triggers`. One line each: still live, or close it out? A matter closes only
   on the principal's word.
8. **The calendar, in full.** List events containing the calendar tag from
   `config.json` from today to two years out, and compare with
   `obligations.mjs calendar`. An event with no row is deleted.
9. Tick finished rows (`tick`), which moves the anchor or removes the row and
   logs it. **How it ended goes in the matter's history, or one journal line if
   it was standalone.**
10. Run `node system/scripts/check.mjs` and leave it clean.

## What this is not

Not the daily checks, which only read what has woken. Not the register audit,
which checks *facts*; this checks *next steps*.
