# Assistant starter kit

An assistant that keeps its memory in a git repository of plain files, run by
Claude Code. Use it for personal life, a small business, a team, a research
project, or anything else with people, deadlines and paperwork to keep track of. There is no database and no server. Each session starts
with no memory, reads the files, does the work, and commits. The repository is
the only state.

To start: open this folder in Claude Code and say *"set me up"*. `SETUP.md` is
what Claude follows.

## How it's built

**Four layers, kept apart:**

| Layer | Lives in | Holds |
|---|---|---|
| Code | `system/` | The design (`README.md`), its reasons (`decisions.md`), Node scripts, the pre-commit hook. Names nobody, so it can be handed on |
| Procedures | `.claude/skills/` | One folder per procedure: daily checks, mail sweep, close, journal, the review routines |
| Data | everything else | What's true of the world it looks after: `subjects/` (one folder per person, organisation, client, property…), `matters/` (pieces of work), `journal/`, and the tables |
| Personality | `assistant/` | Your rules for how it talks and writes, and a persona it keeps for itself |

**The obligations table is the core.** Every next step is one row in
`obligations.json`, written only through `system/scripts/obligations.mjs`. A
row has a due or last-done anchor, a lead time and an optional interval; the
script computes the wake date (`due − lead`, or `done + every − lead`) and no
one ever types one. Every change is appended to `obligations-log.jsonl`.
Anything time-sensitive also gets a calendar event, because nothing runs
between sessions: the calendar is the only alarm.

**Facts have a history.** An entity's `README.md` is current truth only; what
it replaced goes to `history.md` with why. "None" has to say what was searched.
Another party's words are quoted, not summarised.

**Guards:**
- `check.mjs` (the pre-commit hook) refuses a malformed table, a broken
  pointer, a stale sweep window, and any file with a BOM, CRLF or mojibake.
- `audit.mjs` (run at close) reports a name in `system/`, a skill file nothing
  reads, a matter with no next step and no trigger, and a row that has
  outgrown itself.
- Hooks in `.claude/settings.json` block browser control until the browser
  skill is loaded, and email drafting until the correspondence rules are read.

## A session

Read the clock, load the design and the persona, list what has woken, sweep
the mailboxes, report. Write things down in the turn they're heard. At the
close: fill the journal's gaps, run the audit and the checker, commit.

## Requirements

Claude Code, Node.js 18+, git. Optional: a Gmail connector, a calendar
connector, and the Claude in Chrome extension for portals and second
mailboxes.

## Where it came from

This kit was taken from a working system that has run daily since September
2026. The rules in `assistant/` and the lessons in `system/decisions.md` were
earned there; expect yours to diverge, and write down why when they do.
