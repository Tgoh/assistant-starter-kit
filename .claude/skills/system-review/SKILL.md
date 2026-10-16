---
name: system-review
description: A sitting with the principal to look at the system as a whole and decide what to improve. Use when the row wakes, or the principal asks to review the system or look at how something in it works.
---

# System review

A conversation with the principal about the system as a whole: what it is for,
where it rubs, and what would make it better. The upkeep is done elsewhere: the
close runs `system/scripts/audit.mjs`, and `/obligations-sweep` judges the
routines. This is the part that needs both of you.

## Before the sitting

1. Read every note in `notes/` beside this file. They are the agenda.
2. Read what has happened since the last review: `git log` since its date, the
   journal, and `assistant/self/history.md`. Look for where the system rubbed:
   something done by hand that a script should do, a rule that was followed and
   still gave the wrong result, a file nobody opened.
3. Write a short brief at the top of a dated note in `notes/`: one line per
   item, each with what I think and why. An item carried through three reviews
   is put as keep or drop.

## The sitting

- The principal's items first. One at a time: what it is, what I'd do, what
  it would cost.
- **Nothing changes without their word.** Otherwise it becomes a row.
- Agreed changes go in `system/decisions.md` with the reasoning that made them
  right at the time, and into the engine, skill or script they change.
- An item settled is deleted from `notes/`. An item deferred stays, dated.

## Between sittings

Anything about the structure goes in `notes/` as it comes up: a dated file,
what happened, the principal's words where they gave them. A note is an
observation, not a decision.
