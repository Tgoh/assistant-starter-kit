// A tool family is used only after its rules have been read in the session.
//   node read-first.mjs <gate>
// PostToolUse: a Skill call or a Read of the gate's file marks the session.
// PreToolUse: an unmarked session has the call denied once, with the reason.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const GATES = {
  browser: {
    marks: (i) => i.tool_name === "Skill" && i.tool_input?.skill === "browser",
    reason: "Load the browser skill first (Skill tool, skill \"browser\"), then retry this call. It holds which browser profile is which, the tab-group and download rules, and the site notes.",
  },
  correspondence: {
    marks: (i) => i.tool_name === "Read" && /assistant[\\/]correspondence\.md$/.test(i.tool_input?.file_path ?? ""),
    reason: "Read assistant/correspondence.md first, then retry. It holds how the principal's messages are written, and their past edits to drafts.",
  },
};

const gate = GATES[process.argv[2]];
if (!gate) process.exit(0);
const input = JSON.parse(readFileSync(0, "utf8") || "{}");
const marker = join(tmpdir(), `claude-read-first-${process.argv[2]}-${input.session_id ?? "unknown"}`);

if (input.hook_event_name === "PostToolUse") {
  if (gate.marks(input)) writeFileSync(marker, new Date().toISOString());
  process.exit(0);
}
if (existsSync(marker)) process.exit(0);
console.log(JSON.stringify({
  hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: gate.reason },
}));
