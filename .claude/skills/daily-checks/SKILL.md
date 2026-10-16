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
   - A row marked half-done or not closed off comes first.
   - Every woken row gets its own line, ranked by consequence and clock.
   - Mail that needs the principal, and events that change the day.
   - Most days find little. Don't manufacture a task.
5. **Update *Last run* below** with the date and time in the principal's time
   zone.

## Last run

Never.
