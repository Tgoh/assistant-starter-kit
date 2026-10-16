---
name: mail-sweep
description: Search every mailbox the household uses. Use in the daily checks for what has arrived, whenever a document is believed to exist, and before asking the principal.
---

# Mail sweep

Searching the principal's mail, which means every mailbox listed under
`mailboxes` in `config.json`, or it isn't a search.

## What it's for

Most of what the register needs already exists as a document somewhere. This is
how it gets found before a question is put to the principal, and how the day's
arrivals get seen before they're asked what happened. **It is called from
`/daily-checks` (what has landed since its last run, every mailbox) and from
`/information-gathering` (all of it, for a named document).**

## The mailboxes

Each entry in `config.json` says how it is reached: through a mail connector
(the Gmail tool), or only through a browser profile (`/browser` says which).
**One mailbox coming back empty proves nothing.** Household mail lands with
whoever signed up for the thing, and reaches the others as a forward, if at all.

## Steps

1. **Check every mailbox is reachable.** A browser profile that isn't connected
   means the sweep is partial: say so, and ask for it. Reporting a half-sweep as
   a whole one is how a gap reopens.
2. Search each in turn. For a named document: sender, then subject, then a date
   window, three passes before a negative is reported. **For arrivals:
   everything since the *Last run* timestamp below, less an hour.** Gmail's
   `after:` takes epoch seconds, so use that rather than a date, which rounds
   to midnight. Per mailbox:
   - **`in:anywhere after:<epoch>` with no category filter.** Skim the
     marketing; don't filter it out, because real mail lands in Promotions.
   - **`in:sent after:<epoch>`**: what the household sent, which decides who
     moves next.
   - **Spam, in the browser.** The Gmail API does not see Spam; `in:spam`
     comes back empty while the folder is full.
   - Page through to the end; the API returns 50 at a time.
3. **Check `assistant/out-of-scope.md` before recording anything found.** A
   sweep rediscovers an excluded subject on every run unless it checks.
4. **"No reply yet" is checked with `get_thread`, never from the search
   listing**, which can drop a thread's newest messages.
5. **Read the thread, not the document, and open the pictures.** Facts sit in
   screenshots, embedded images and portal links that text search never sees.
   A document that looks unsigned or lapsed is checked against the replies
   around it before it is reported as either.
6. **Report a negative as a search, not a fact**: *"Searched both for X, Y and
   Z, nothing"*, never *"there is no such email."*
7. **Name new noise.** Check marketing senders against the kept and dropped
   lists in the principal's `mail-subscriptions.md`, if they keep one. A new one
   gets a line in the daily checks offering to unsubscribe. Never unsubscribe
   without a yes.
8. **Update *Last run* below when the sweep finishes**: the time the searches
   ran and which mailboxes it covered. A partial sweep says so, and the next run
   goes back to the last complete time. **Write the time in UTC, with the `Z`,
   beside its epoch**, and the next run's `after:` one hour before it.
   `check.mjs` refuses a label and an epoch that disagree.

**Take the epoch from the clock, never by hand.** In PowerShell,
`[DateTimeOffset]::UtcNow.ToUnixTimeSeconds()`; never `Get-Date -UFormat %s`,
which on Windows PowerShell 5.1 returns local time read as UTC. Before writing
it, convert it back and check it matches the UTC time beside it. A window that
opens ten hours late finds nothing and looks like a quiet day.

**A Gmail list that renders with no rows and no "No matches" is a page that
hasn't loaded, not a negative.** Wait for the empty-state words, or read the
page a second way, before believing a zero.

## What this is not

Not the journal and not information gathering: those decide what to do with
what's found. This only finds it.

## Last run

**2026-01-01T00:00:00Z — epoch 1767225600**. A placeholder: never run. The
first run picks its own window during setup.
Next run searches from `after:1767222000`.
