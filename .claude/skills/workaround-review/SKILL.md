---
name: workaround-review
description: Review the workarounds in place and retire the ones no longer needed. Use when the row wakes, when the principal asks about workarounds, or when a tool limitation forces a workaround and it needs recording in notes/.
---

# Workaround review

Checks the workarounds in use and gets rid of the ones no longer needed.

## What it's for

A workaround is a rule added because a tool, site or setting stopped doing
something: hand that step to the principal, use another route, don't try this.
None of them expires by itself. The cause gets fixed and the rule stays, and
the system keeps paying for a problem that's gone.

## Recording one

**When a workaround is adopted, add a file to `notes/` beside this one in the
same turn**, named `YYYY-MM-DD-short-name.md`, saying:

- **What broke**: the exact error text and version, if known.
- **The workaround**, and where the rule lives. The rule stays in the skill
  that needs it; this folder only keeps track of it.
- **How to test** whether the cause is still there: one cheap check that
  changes nothing.

## Steps

0. **Check the folder is complete.** Read the other skills, `browser/` and its
   site notes above all, for anything phrased as *"X doesn't work, do Y
   instead"* with no note here. A workaround with no note is never retired.
1. Read every note in `notes/`.
2. **Run each test**, never an outward-facing one.
3. **If the cause has gone**, delete the rule from its skill, delete the note,
   and write one journal line saying it was retired.
4. **If it's still there**, add the date and what was tried to the note.
5. **After three reviews with the same result**, make it a permanent rule in
   its skill and delete the note, or find a real fix.
