---
name: journal-mining
description: Read the journal since the last run, and the facet files that changed, for patterns no single day could show, and lift them onto their entities. Use when the row wakes.
---

# Journal mining

Reading `journal/` for patterns no single day could show.

## What it's for

Facts that are obvious in the moment get routed when they're heard. This is
for the other kind: the thing that only becomes a fact after weeks of entries,
like self-set dates slipping while external deadlines are met the same day.

## Steps

1. Read every entry since the last run (the row's anchor date), properly. Then
   read what changed in the entities over the same window:
   `git log -p --since=<anchor date> -- subjects/`.
2. **Name the patterns.** What recurs? People mentioned more than once, things
   said and not done, things that go wrong the same way twice, names that keep
   appearing without a slug. The value is in the fourth and fifth.
3. **Decide whether each has earned a home.** A person mentioned three times is
   an entity: make the folder. A recurring complaint is an obligation nobody
   wrote down. A pattern in how sessions go wrong belongs in `assistant/`.
4. **Lift it, don't move it.** The journal stays append-only; the pattern is
   written where it belongs, with the date range it was drawn from.
5. Say what was lifted and what was noticed but not yet worth a file. Tick the
   row.
