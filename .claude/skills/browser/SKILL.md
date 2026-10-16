---
name: browser
description: Use whenever the principal asks for browser control, names a browser profile, asks to log into a portal, or a task needs a mailbox reached only through a browser. Loads which browser is which and the quirks that have bitten.
---

# Browser control

Which browser is which, and the rules that have each cost an evening.

## First

**Read `subjects/people/<principal>/browsers.md`**: the mapping from each
profile's name to its device ID lives there as data, and it is the only copy.
The names cannot be read back reliably from the tools. Setup writes it.

## Site notes

**Before the first action on any site, run**
`node system/scripts/sitenotes.mjs <url>` **and read what it prints.** Once per
site per session. It matches the address against the notes in `sites/` beside
this file. Most of what's recorded there fails silently (a block page that
reads as no results, a download button that does nothing), so waiting to hit a
quirk is too late.

Anything learned about one site goes in its note. When there is none, the
script says what to create: `sites/<site>.md`, with `domains: host` as the
first line. `check.mjs` refuses a note without a domains line, or a domain
claimed twice. A technique that works across sites goes in the rules below.

## Rules

- **Select a browser by its device ID**, from the mapping. Use the default
  profile unless the task belongs to someone else's.
- **Find before you create.** Start every browser task by asking for the
  current tab group *without* creating one, and work in the group it returns.
  Create one only when there is none, and say so.
- **Never close the last tab of a group**, and never close tabs in parallel:
  the group can be destroyed. Before closing the second-last tab, navigate the
  one that stays to the mailbox first.
- **Rest state: one tab per group, parked on the mailbox**, never on a bank or
  other logged-in page. **Not while a page is still being worked on**: ask
  first.
- **Downloads land in the folder named in `browsers.md`.** If a file isn't
  there, look in the operating system's default before concluding it failed,
  then correct the table.
- **Logins and one-time codes are the principal's.** Bring the page up, say
  what's needed, wait.
- **Read only in someone else's account** unless asked otherwise, and leave
  their tabs as found.
- **After typing, check the field actually holds the text.** Send and Submit
  happen only on the principal's word.
- **Download with a coordinate click mapped from a fresh screenshot.** A
  download often won't start from an element-targeted click in a tab that
  isn't on screen. Take the coordinate frame from the screenshot result itself,
  and never reuse a mapping from an earlier call. Then check the file landed.
- **A background tab can open things it won't fill.** Some content loads only
  in an active tab. Look for the request the page already made
  (`performance.getEntriesByType('resource')`) and repeat it from inside the
  page with `credentials: 'include'`.
- **A block or a bot check can look like an empty page to a script.** Take a
  screenshot before concluding anything, and never try to get past a bot
  check.
- **Don't identify browsers by reading their tabs.** If a device ID stops
  resolving, rebuild the mapping the way `browsers.md` describes.
