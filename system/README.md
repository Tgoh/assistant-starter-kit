# The engine

The working files of **a personal assistant to one person**: remember what they
have said, notice what is coming before it arrives, do the paperwork, brief
them. The person is *the principal*. **Nothing in this folder names them or
anything in their life.** What is true of them is the data layer; how the
assistant behaves is `../assistant/`. How the design got this way, and why, is
`decisions.md` beside this file.

---

## The four layers

| Layer | Lives in | Holds |
|---|---|---|
| **Code** | `system/` | Entities, arithmetic, lifecycle, routing, the scripts |
| **Customisation** | `.claude/skills/` | How things are done for this principal, one skill per procedure. Unscheduled |
| **Data** | Everything else | What is true of this principal's life |
| **Personality** | `assistant/` | The persona, which the assistant writes, and the principal's rules about it |

**Rules and data never share a file.** A data file's header says what the file
*is*, never how to behave.

**Every sentence in a rule file says what something is or what to do.** Not
what the file is like, and not a guard against a past mistake; that history
goes in `decisions.md`.

**Store each thing once, where it is owned.** Where it must also be seen
elsewhere, the copy is *generated* by a script, never kept by hand. Copying is
safe only into places that never change: append-only history, and generated
copies.

**Prose for meaning, data for mechanism.** Facts, matters and the journal are
prose. The tables (obligations and links) are JSON, written through their scripts.

---

## The entities

### Entity

Something facts are *about* that we expect to keep dealing with: a person, an
animal, a property, a vehicle, a provider, an account, a household. **One
folder each: `subjects/<category>/<slug>/`.** The category is the kind of
thing, never the relationship to the principal. One level of category only.

**Born the moment it is named**, if we expect to hear of it again, however
little is known. A one-off supplier is a name inside a matter. **The slug is
short, stable, and never carries a fact that can change.** Pointers are written
from the repository root (`subjects/people/<slug>`).

A folder holds:

- **`README.md`**: current truth only, in prose, undated. Its first line says
  what the entity is.
- **Facet files**: research, and history that is consulted while acting, such
  as observed dates that compute a window. One kind of material per file.
- **`history.md`**: created the first time something changes. Dated blocks,
  newest first, append-only:

      ## D Mon YY — label

      Was: the README text that was removed, verbatim.

      Changed: why, and on whose word.

  Consecutive blocks with the same label give the fact's window. A wrong fact
  is marked *found wrong*. The date is when we learned.

When the definition and the folders disagree, the folders win and the
definition is amended in the same commit.

### Fact

A standing truth about an entity, with its source, in the entity's README. An
unknown is `?` in place. **Replace the `?`, never append beside it.**

- **What another party said or did is quoted, not summarised**, here and in a
  row's `what`: a short verbatim line, who, and when. A summary hides the
  reading; a quote leaves it visible. A line with no quote behind it says it
  is ours: decided, inferred or assumed.
- **Before acting on a line that drives a call, a payment or a message, reopen
  its source.** The file holds what was read; only the source holds what was
  said.
- **Don't store what can be computed**: an age, a wake date.
- **A negative carries its search or is not stated**: "None found in X,
  searched D Mon YY", never a bare "none".
- **A rule about the world lives where it acts, with its source in the line**:
  on the row it drives and the entity it constrains. `/register-audit` flags any
  rule without a source.

### Link

A relationship between two entities. **One row in `links.json`**: from,
relation, to, since, source. Each README carries a **generated** links line,
never edited by hand. What involves two entities goes in the table.

### Matter

**Work put into interactions with entities**: a claim, a dispute, a booking, a
favour that took an evening. **Opened the moment work produces material that
is neither a fact nor a journal line**: options compared, drafts, documents
gathered, a reply awaited. A question and its answer is a journal line and a
fact. Something with no end is an entity. **When it is arguable, open it.**
A row whose text has been rewritten twice has had more than one exchange:
`obligations.mjs edit` says so, and the close's audit lists it.

**A matter is also an open concern with no date**: something the principal is
actively keeping in mind, where no date can be honestly set (the wardrobe, until
they next go shopping). A row can't hold it, because a row needs a wake date.

**One file each: `matters/YYYYMMDD-slug.md`**, dated when it opened. What it is
with and about are links. In order:

1. **Header**: the generated links line, the documents folder, one line on
   where things stand *now*, and, while it has no rows, its trigger. When that line changes, the old one goes into the
   history as a dated *Was*.
2. **Decisions** taken inside it.
3. **References** that belong only to the matter: claim, file and job numbers.
   A person's phone number belongs to that person.
4. **History**, dated, newest first, with quotes where the wording decides who
   acts next. This is the matter's data, read every time it is worked.

Only the where-it-stands line is under the Was rule; the rest changes freely.
**A matter holds no next steps**; those are rows. **A matter with no rows has a
trigger**: a `**Trigger:**` line in its header naming the situation that brings
it back. `scripts/matters.mjs triggers` prints them at the start of a session;
when the situation comes up, raise the matter. **A matter closes only on
the principal's word**: at a logical stopping point (its last row done, an
answer that settles it), ask whether to close it out. **Closing one promotes
what it taught**: facts to its entities,
preferences to their research files. Then the file moves to `matters/closed/`
and is kept.

### Research

Material that accumulates with no start and no end: recipes, verdicts on
places, gift ideas that landed. **A facet file on the entity it is about.** A
place becomes an entity only when it passes the entity test.

### Obligation

**One next step, one wake date, optionally an interval.** Every next step is a
row in `obligations.json`. Rows are written through
`scripts/obligations.mjs` (`add`, `tick`, `defer`), which does the arithmetic,
keeps the sort, refuses duplicates, and appends every change to
`obligations-log.jsonl`.

| Field | Holds |
|---|---|
| **kind** | `step`, `routine` (points at a skill), `reminder` (a live state kept visible for its duration), `closing` (ends a reminder and removes both), `awaiting` (a question put to the principal) |
| **wake** | *Calculated by the script, never typed* |
| **anchor** | `due` (calendar-anchored) or `done` (last-done-anchored). `chosen: true` when the date was ours |
| **every** | Blank for a one-off, else an interval |
| **lead** | How long the task takes to do properly. Not a buffer |
| **what** | The next step, concretely enough to act on, with the number, address or reference |
| **links** | The entity or matter it belongs to, and the skill it runs with |
| **pairs** | For a `closing` row, its `reminder` |
| **key** | A UUID made by the script at `add`, never reused. The row's id is a name and can come back; the key is what anything outside refers to |
| **calendar** | The ids of calendar events that are this row's alarms |
| **extra** | Anything else, size-checked at close |

    calendar-anchored:   wake = due − lead
    last-done-anchored:  wake = done + every − lead

A blank last-done anchor means the thing has never been tracked, so it wakes now.

**Ticking:**

- One-off: delete the row. The matter's history records how it ended, or, if it
  belonged to no matter, a journal line does.
- Recurring, calendar-anchored: advance `due` by `every`.
- Recurring, last-done-anchored: set `done` to the day it was done.

**Asking:** an `awaiting` row put to the principal and not answered is marked
`asked`, which sets it to ask again after `every`, or a week.

**Deferring:** set `due` to the chosen date. `/obligations-sweep` names any row
deferred three times.

**A bounded event gets two rows.** A `reminder` wakes at the start and is raised
as *on now* for the duration. A `closing` wakes at the end. When ticked, it
removes the reminder, moves the fact to the entity's history, and removes itself.

**Every row has a wake date.** If nothing external sets one, choose one and mark
it chosen.

**A relative date heard after midnight and before sleep is counted from the day
the principal wakes into**: "tomorrow" said at 2am is that same date. When it is
unclear, take the earlier date.

**Anything time-sensitive gets a calendar event**, because a row surfaces only
when a session reads the table and the calendar is what actually alerts the
principal. The row stays the record and the event is its alarm. The event's
title is plain; the last line of its description is `Register: <id> <key>` (the tag is `calendar_tag` in `config.json`). The
row holds the event's id in `calendar`. When a row with events is ticked,
deferred or removed, the script names the events to move or delete, and they
are changed in the same turn.

**A woken row carries what is needed to act on it.** The pointer is followed
only when doing the thing.

### Procedure — a skill

**One folder each under `.claude/skills/`, with `SKILL.md` as the entry
point.** It says what to do, concretely enough to follow cold, and what it is
*not* for. **The frontmatter `description` is the trigger**: the principal's
words, and the situation that calls for the skill. **A skill carries no
schedule.** If it should recur, a row with an interval points at it. The folder
holds only what that skill reads. What a run produces leaves for its entity,
the table or the matter. A skill nothing points at and nothing invokes is dead;
`/obligations-sweep` checks which skills fired since its last run.

### Journal entry

**The diary: what happened and what was said, across everything.**
`journal/YYYY-MM.md`, oldest first. **Append-only, never trimmed.**

- **In:** anything the principal mentions, as told. Anything that happened to
  them or around them. Anything personal, which lives here only. **Work is
  mentioned, not recorded.**
- **Out:** what the assistant did, which goes in the commit. What the assistant
  concluded, which goes where the conclusion lives.
- **Written in the turn it is heard.** The close only fills gaps.
- **Shape:** plain past tense with no subject (*rang the bank about X*). The
  principal's words in quotes, none of the assistant's. No bold. One event per
  bullet, with the time where known and a pointer to any detail. Entities named
  by slug in backticks.
- **Check the clock before dating an entry.** After midnight, "today" means the
  day that just ended.

### Decision

**A shape, not a file.** It lives with what it is about: an entity or a matter.
Changes to the design itself are history, in `decisions.md`.

> **Decided 10 Sep 26:** what was decided. *Why, in a sentence.* **Reopens:**
> the condition: a date, an event, or *never*.

Not re-raised until its condition is met. A reversed decision goes to history.
**The exception:** "do not record, raise or ask about X" lives in
`../assistant/out-of-scope.md`, because a sweep must load it every session.

---

## The session lifecycle

The unit is the session. There is no scheduler.

- **Start:** read the clock in the principal's time zone, then the files
  `CLAUDE.md` lists.
- **During:** capture in the turn it is heard: journal line, entity fact,
  matter history, or row through the script. Half-done work is a row.
- **Close** (`/close`): `scripts/audit.mjs` reports what has drifted in the
  structure, and each finding is fixed or put to the principal. Nothing is
  committed until `scripts/check.mjs` passes.
  The pre-commit hook in `hooks/` runs it; enable it per clone with
  `git config core.hooksPath system/hooks`.

What a session does between those is a skill: `/daily-checks`, a routine, or
nothing but the question asked.

---

## Routing

| Heard | Goes to |
|---|---|
| Something happened or was said | The journal, as told |
| A standing truth about an entity | Its README, replacing any `?` |
| Something involving two entities | `links.json` |
| Anything with a next step | A row, through the script |
| Something true for a period | A `reminder` row and its `closing` row |
| Work starting with another party | A new matter, and rows for its steps |
| Something inside a matter | That matter's history |
| A recipe, a verdict, an idea that landed | The facet file on its entity |
| A name we'll hear again | A folder under `subjects/<category>/` |
| A rule about the world | The row it drives and the entity it constrains, with its source |
| Something decided | The decision shape, on what it is about |
| Something ruled out | `../assistant/out-of-scope.md` |
| How to do something | A skill |
| A correction to the assistant | `../assistant/` |

**Anything with a next step is an obligation, whatever it was asked for as.**
**Search before asking**: mail, folders, portals. **Search before creating**:
list the folder before making a new entity, and check the table before adding a
row.

---

## Invariants

1. **Wake dates are calculated, never typed.**
2. **Every obligation has a wake date.**
3. **One list of obligations.** Other tables are fine.
4. **Reasoning lives with the fact or the matter, not in the table.**
5. **Finished things are promoted or deleted, never archived**, except matters
   and history.
6. **No personal data in `system/`. No rules in a data file.**
7. **An empty search is a fact about the search, not about the world.**
8. **Notes only in the repository.** Documents are pointed at, never copied in.
9. **A live copy is generated or it does not exist.**
10. **Commit at close, and only past the checker.**

---

## What lives where

```
CLAUDE.md              pointer: layers, load order
obligations.json       the table
obligations-log.jsonl  append-only log of every row change
links.json             relationships
journal/               the diary, one file per month
system/                this folder, decisions.md, scripts/, hooks/
.claude/skills/        one folder per skill
assistant/             the persona and memory (self/), and the principal's rules
matters/               one file per matter, date-first; closed/ beneath
subjects/              one folder per entity, under its category
```
