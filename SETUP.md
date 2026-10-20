# Setup

**For the person:** open this folder in Claude Code and say *"set me up"*.
Claude interviews you for about twenty minutes and fills in the rest. You need
Node.js 18 or later and git. A Gmail connector and the Claude in Chrome
extension are optional; without them the mail sweep is skipped.

**For Claude:** follow the steps below in order, one question at a time.
Everything after the interview is written through the Write and Edit tools and
the scripts, never by hand-editing JSON. Show the principal what you are about
to write before writing anything that is theirs.

**First, before anything else:** if this folder was cloned from GitHub, it is
still connected to the kit's repository, and pushing from it would upload the
principal's notes there. Disconnect it:

```
git remote remove origin
```

Then check with `git remote -v`, which should print nothing. If they want a
backup of their own later, they create their own private repository and add
it as a new remote.

---

## 1. The person

Ask, and wait for each answer:

1. Their name as they use it, and their city.
2. Their time zone (an IANA name, such as `Australia/Brisbane`).
3. **What this is for.** A household, work notes, or both. This decides the
   brainstorm rotation and which categories to start in `subjects/`.
4. Who else is in the picture: a partner, family, colleagues. Each becomes an
   entity. Ask whether anything here is ever shared with them; the default is
   no.
5. Anything they never want recorded, raised or searched for. Each goes in
   `assistant/out-of-scope.md` by name only.

## 2. The files

1. `config.json`: `timezone`, and the `mailboxes` list (owner, address, and how
   each is reached: the Gmail connector, or a browser profile). If they keep a
   staging folder for downloads, add `staging_dir`; the checker then refuses a
   commit while it holds files.
2. `CLAUDE.md`: replace `{{PRINCIPAL_NAME}}`, `{{CITY}}`, `{{DOCUMENTS_DIR}}`
   and `{{DOWNLOADS_DIR}}`, then delete the "Not set up yet?" note.
3. The principal's entity: `subjects/people/<slug>/README.md`, first line
   saying who they are, then what they told you, with `?` for what's unknown.
   The slug is short and never carries a fact that can change.
4. One entity per other person named in step 1.4.
5. `subjects/household/README.md`, first line saying whose household it is.
   Then link every entity, through the script, never by hand:
   `node system/scripts/links.mjs add people/<slug> "member of" household`,
   and the same for each person, with the relation that fits ("partner of",
   "colleague of"). The checker refuses an entity nothing links to; it is the
   guard against names written down and never connected.
6. If they use the browser extension: `subjects/people/<slug>/browsers.md`
   with a table of profile name, device ID and who it is signed in as, and
   where each profile downloads to. Get device IDs from
   `list_connected_browsers`; a name typed at connection is visible only in
   that moment, so confirm each one with the principal.
7. In `.claude/skills/brainstorm/SKILL.md`, keep the rotation that fits step
   1.3 and delete the other.
8. Delete `.gitkeep` from any folder that now has a file in it.

## 3. The routines

Add one row per routine. In Git Bash, prefix each with `MSYS_NO_PATHCONV=1` so
the leading `/` survives. Leave out any the principal doesn't want.

```
node system/scripts/obligations.mjs add --id obligations-sweep --kind routine --done <today> --every "1 wk" --what "First run." --link /obligations-sweep
node system/scripts/obligations.mjs add --id information-gathering --kind routine --due <today> --chosen --every "3 d" --what "First run." --link /information-gathering
node system/scripts/obligations.mjs add --id brainstorm --kind routine --due <in a week> --chosen --every "2 wk" --what "First run; start at the top of the rotation." --link /brainstorm
node system/scripts/obligations.mjs add --id journal-mining --kind routine --due <in a month> --chosen --every "1 mo" --what "First run." --link /journal-mining
node system/scripts/obligations.mjs add --id register-audit --kind routine --due <in three months> --chosen --every "3 mo" --what "First run." --link /register-audit
node system/scripts/obligations.mjs add --id system-review --kind routine --due <in two weeks> --chosen --every "2 wk" --what "First sitting." --link /system-review
node system/scripts/obligations.mjs add --id workaround-review --kind routine --due <in a month> --chosen --every "4 wk" --what "First run." --link /workaround-review
```

Then ask: **what's coming up that you'd hate to forget?** Renewals, bills,
deadlines, things promised. Each becomes a `step` row with a due date and a
lead time, linked to its entity. Anything time-sensitive also gets a calendar
event; the row stores its id with `edit ID --calendar EVENT_ID`, and the
event's description ends with `Register: <id> <key>`.

## 4. The repository

```
git init
git config core.hooksPath system/hooks
node system/scripts/check.mjs
node system/scripts/audit.mjs
git add -A
git commit -m "Set up"
```

Both scripts must print `clean`. On macOS or Linux, also run
`chmod +x system/hooks/pre-commit`.

## 5. The first run

Run `/daily-checks`. The first mail sweep has no last run: ask how far back to
look (a week is usual), and write the real timestamp into its *Last run* when
it finishes. Then `/close`.

Tell the principal the three phrases that matter: **"daily checks"**, **"note
this"**, and **"close"**. Everything else is asked for in plain words.

---

## What a matter looks like

A matter is opened the moment work produces material that is neither a fact
nor a diary line: options compared, a draft, a reply awaited.
`matters/YYYYMMDD-slug.md`:

```
# Short title

**Documents:** <folder>
**Where it stands, D Mon YY:** one line.

---

## Decisions

## References

## History (newest first)

- D Mon YY — what happened, with the other side's words quoted where they
  decide who acts next.
```

Its next steps are rows that link to it. A matter with no rows carries a
`**Trigger:**` line instead: the situation that brings it back.
