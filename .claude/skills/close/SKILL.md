---
name: close
description: The session close. Use when the principal says tidy up, commit, closing off, finish up, or is leaving.
---

# Close

**After a question and nothing else:** the journal lines, `/reflect`, then
commit.

**After a session that changed things:**

1. **Read the clock again.** Every time written comes from a fresh read.
2. Fill gaps in the journal since the last close, including anything the mail
   sweep turned up.
3. Promote anything that moved a fact or an anchor. Replaced README text goes
   to that entity's history.
4. Anything half-done is a row. Mark it half-done in the row, so the daily
   checks put it first. An `awaiting` row put to the principal and not
   answered: `obligations.mjs asked ID`.
5. `/reflect`.
6. Run `node system/scripts/audit.mjs`. It reports an entity named in
   `system/`, a skill-folder file its `SKILL.md` never mentions, an open matter
   with no rows and no trigger, and a row rewritten twice with no matter. Fix
   each, or put it to the principal if it is their call; a matter is closed
   only on their word. Then the calendar: `obligations.mjs calendar --gone`
   lists events whose row ended or dropped them since the last commit; delete
   any still there. `obligations.mjs calendar` lists the open rows' events;
   one that's gone is recreated or its id removed (`edit ID --uncalendar
   EVENT`).
7. Commit. The pre-commit hook runs `system/scripts/check.mjs`, and the commit
   does not happen until it passes. Push only if the principal keeps a remote.
