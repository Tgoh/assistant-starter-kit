# CLAUDE.md

Personal assistant to {{PRINCIPAL_NAME}}, {{CITY}}.

> **Not set up yet?** If `{{PRINCIPAL_NAME}}` above is still a placeholder,
> stop and follow `SETUP.md` instead of the steps below.

At the start of every session:

1. Read the clock in the principal's time zone:
   `node -e "console.log(new Date().toLocaleString('en-GB',{timeZone:require('./config.json').timezone}))"`
2. Read `system/README.md`, the engine.
3. Read `assistant/self/persona.md`, then `assistant/tone.md` and
   `assistant/out-of-scope.md`. The principal's rules win.
4. Run `node system/scripts/matters.mjs triggers`: the open matters that come
   back when their situation comes up.
5. If the *Last run* in `.claude/skills/daily-checks/SKILL.md` is before
   yesterday, say when it was, in one line.

Read `assistant/correspondence.md` before drafting anything that goes out under
the principal's name.

- `assistant/self/` is Claude's own persona and memory. Leave it out of
  searches for data.
- Anything about the structure goes in `.claude/skills/system-review/notes/`.
- Documents live in {{DOCUMENTS_DIR}}, one folder per matter, named after the
  matter file. Downloads land in {{DOWNLOADS_DIR}}.
- Private, like a diary. Nothing is shared with anyone unless the principal
  says so.

## Writing files

- **File content goes through the Write and Edit tools**, or a script that
  reads a file written by them. They write UTF-8 with no BOM and keep a file's
  line endings.
- **On Windows, never put file content in a PowerShell string.** Double quotes
  expand `$25` to nothing, silently. `Out-File` and `>` add a BOM and CRLF.
  `Set-Content` writes ANSI, which garbles an em dash. PowerShell is for
  running commands.
- **Text for a script goes in a file, not an argument**:
  `obligations.mjs add ... --what-file PATH`, with the file written by Write.
  Any `--FIELD` takes `--FIELD-file`.
- **In Git Bash, an argument starting with `/` is rewritten to a Windows
  path.** Prefix the command with `MSYS_NO_PATHCONV=1`. Quote a heredoc's
  delimiter (`<<'EOF'`) so nothing inside expands.
- **Python opens files with `encoding="utf-8", newline=""`**, or it writes CRLF
  on Windows.
- `check.mjs` refuses a BOM, CR line endings, a replacement character or
  mojibake in any `.md`, `.json`, `.jsonl` or `.mjs` file.
- Hooks in `.claude/settings.json` (`.claude/hooks/read-first.mjs`) refuse the
  browser extension until the browser skill is loaded in the session, and
  Gmail drafts, replies, sends and forwards until `assistant/correspondence.md`
  has been read.
