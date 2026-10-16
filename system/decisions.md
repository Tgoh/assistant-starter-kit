# Design notes

Why the engine is shaped the way it is. These are the lessons from the first
two months of the system this kit was taken from, without the incidents that
taught them. From here on, agreed changes go in below with the date and the
reasoning that made them right at the time (`/system-review`).

## The lessons it started with

- **The repository is notes only.** Documents live elsewhere and are pointed
  at. Git keeps every revision, so nothing needs an archive file.
- **One list of obligations.** A second to-do list was tried and things fell
  between them. Other tables are fine; next steps live in one.
- **Wake dates are calculated, never typed.** Hand-written wake dates drifted
  from their due dates within a week. The script is the only place the
  arithmetic happens.
- **Every row has a wake date.** A next step with no date never surfaced. If
  nothing external sets one, choose one and mark it chosen.
- **Every row change is logged**, append-only. The questions that mattered were
  always "when did this change and why", and only a log answers them.
- **Rules and data never share a file.** A rule written into a data file's
  header was obeyed in one session and missed in the next.
- **Current truth and history are separate.** A README holds only what is true
  now; what it replaced goes to `history.md`, verbatim, with why. A fact that
  was wrong is marked *found wrong*, never silently corrected.
- **Store each thing once.** Copying is safe only into places that never
  change: append-only history and generated views.
- **The unit is the session, not the night.** Nothing runs between sessions
  except the calendar, so anything time-sensitive gets a calendar event.
- **Procedures are skills**, one folder each, with the trigger in the
  description and a line saying what the skill is *not* for. A skill nothing
  invokes is dead.
- **The journal is a raw dataset**: append-only, written as it is heard, in
  neither first nor third person, the principal's words in quotes. Writing it
  at close from memory lost half the days.
- **What another party said is quoted, not summarised.** A summary hides the
  reading; a quote leaves it checkable. Before acting on a line that drives a
  call, a payment or a message, reopen its source.
- **An empty search is a fact about the search.** "None" with no search behind
  it was wrong most of the times it was relied on.
- **A matter is opened when it is arguable.** A wrongly opened matter costs one
  file; a missing one costs the history.
- **A row rewritten twice is a matter.** Its text was carrying a history the
  row has no room for. The script says so.
- **A matter closes only on the principal's word.**
- **A deferral three times over is a decision being avoided.**
- **`system/` names nobody**, so the engine can be handed on. The close's audit
  enforces it.
- **The persona belongs to the assistant.** Rules about how it works and talks
  are the principal's, in their own files; who it is, is its own, and it keeps
  it.
- **Files are written by tools that can't corrupt them.** Shell strings ate
  dollar signs and garbled punctuation more than once; the checker now refuses
  the symptoms.

## Changes since setup

(None yet.)
