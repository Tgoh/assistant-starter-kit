---
name: journal
description: Write the diary — what happened and what was said — as it is heard, and fill the gaps at close. Called by /close; also whenever the principal says note this or journal this.
---

# Journal

Writing the diary: `journal/YYYY-MM.md`, oldest first, append-only. The shape
and the rule are in `system/README.md` under *Journal entry*; this is how the
writing actually goes.

## What it's for

The timeline of what happened and what was said, across everything: the one
place the strands cross, and the only place personal material lives. It is
mined for patterns (`/journal-mining`) and searched for history, and both only
work if what is in it is signal.

The test for what goes in is **not** "what did the assistant do"; that's the
commit message. It is:

> **What happened, or was said, that the principal would want found later?**

Work is mentioned, not recorded: *sent the signed form back* is a line; the
research behind it belongs in the matter.

## Steps

1. **Write it when it is said.** A thing mentioned mid-task gets its line in
   that turn, appended to the current month's file under today's heading
   (`## YYYY-MM-DD`; create it if the day has none). Writing at close from
   memory loses days.
2. **At close, bring evidence to the gaps**: what the sweep found, what the
   session turned up, the calendar. Then ask for what the evidence missed:
   conversations, phone calls, something someone said they'd do.
3. **The shape.** Plain past tense with no subject (*rang the bank about the
   statement*), neither "I" nor the principal's name. Their words in quotes,
   none of the assistant's, no conclusions. No bold. One event per bullet, the
   time where known, a pointer to where any detail lives. Entities by slug in
   backticks, so a search for one token finds everything.
4. **Route in the same turn.** A fact goes to its entity; a next step becomes a
   row through `system/scripts/obligations.mjs add`; something inside a matter
   goes to that matter's history; research to its facet file. The journal line
   stays as well: it is the record that it was said.
5. **Check the clock before dating anything.** Sessions run past midnight, and
   "today" then means the day that just ended. After midnight, say which date
   you're filing under and let the principal correct it.

## What good looks like

A handful of lines on a busy day, one or none on a quiet one, most of them
written before the close. A bullet with three sub-bullets of prices is working
material that belongs in a matter, and the checker flags that shape.

## What this is not

Not `/information-gathering`, which fills gaps in the standing facts. This
records events; that records state. And not a work log: the commit message is
the work log.
