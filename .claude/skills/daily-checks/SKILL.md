---
name: daily-checks
description: The daily checks. Use when the principal asks for the daily checks, morning checks, what's on today, where do we stand, or what they need to do.
---

# Daily checks

What the principal owes, what has arrived, and what is on.

1. **Woken rows**: `node system/scripts/obligations.mjs list`. Every row it
   prints, in full.
2. **Mail**: `/mail-sweep`, every mailbox in `config.json`, arrivals since its
   last run. One pass: no portals, no matter files, no chasing documents.
3. **Calendar**: the principal's calendar, today and tomorrow.
4. **Report** per `assistant/tone.md`:
   - Simple sentences, one per line, grouped under short headings by kind of
     action (today and tomorrow, calls, at home, the principal's decisions, not
     due yet, routines) and numbered straight through.
   - A row marked half-done or not closed off comes first.
   - **Every woken row gets its own line. All of them.** Brevity is cut from
     each line, never from the count. Overdue sits above not yet due; rank by
     what it costs to get wrong, not by subject. Routines are rows like any
     other, each saying what its run would do.
   - A row awaiting the principal's answer is put to them as the question.
     Waiting on someone else gets no line until the day it needs chasing;
     silence is news only when a reply was due.
   - Counts come from the table, never from memory. Housekeeping of the tools
     (tabs, tab groups) gets no line.
   - Mail that needs the principal, and events that change the day.
   - Most days find little. Don't manufacture a task.
5. **Update *Last run* below** with the date and time in the principal's time
   zone.

## Last run

Never.
