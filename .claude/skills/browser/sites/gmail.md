domains: mail.google.com

# Gmail

Learned on the system this kit was taken from. Re-test before relying on any of
it; Gmail changes.

## Downloading attachments

- **With the tab on screen:** the coordinate click from the skill. Chrome may
  ask to allow multiple downloads from `mail.google.com`; the principal grants
  that once.
- **When the tab can't be put on screen**, navigate the Gmail tab straight to
  the attachment URL with `disp=attd`:
  `/mail/u/0/?ui=2&ik=<GLOBALS[9]>&view=att&th=<thread id>&attid=0.<n>&disp=attd`.
  Find `attid` by fetching with `disp=safe` from the page and checking the type
  and first bytes. A JavaScript blob `a.click()` did not download.

## Attaching a local file

- **Compose with a file attached works from a background tab:** open
  `/mail/u/0/?view=cm&fs=1&to=<addr>&su=<subject>`, `find` the compose window's
  file input, and upload the file to it. The Gmail tool's own `send_message`
  wants the file base64 in the call, which is too big for most PDFs.
- **A docx that arrived by email goes to Drive from Gmail itself**, through the
  attachment's Add to Drive.

## Unsubscribing

- **Manage subscriptions, `/mail/u/0/#sub`,** lists senders with a one-click
  unsubscribe. Click the row's Unsubscribe, then the dialog's, **one step per
  tool call**: a script waiting on `setTimeout` stalls in a background tab.
  Stale dialogs stay in the DOM, so confirm the dialog names the sender.
- `find` can return the button of the row next to the one asked for: read the
  dialog's sender before confirming.
- A footer link or a `mailto:` unsubscribe sends the browser somewhere, or
  sends an email. Ask before doing either.

## Drafts

- **`update_draft` detaches a draft from its thread**, irreversibly. Delete and
  recreate with `replyToMessageId`.
- **Attach the source's own document, not a conversion.** The principal often
  can't open attachments on a draft, so they won't catch it before sending.
