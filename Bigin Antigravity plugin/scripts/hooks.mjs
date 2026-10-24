#!/usr/bin/env node
// PreToolUse hook for the Bigin plugin: always ask before a high-impact Bigin tool runs,
// even if the agent's permission mode or an "Always allow" grant would auto-approve it.
// hooks.json selects the tools. Antigravity sends {"toolCall": {"name", "args"}, ...} on stdin;
// an MCP call may arrive under a prefixed name (e.g. "mcp_zoho-bigin-api_Bigin_deleteRecords")
// or through a dispatcher whose args carry the MCP tool name.

const IMPACT = [
  [/^Bigin_delete(User)$/, "removes a Bigin user"],
  [/^Bigin_delete/, "deletes data"],
  [/^Bigin_change\w*Owner/, "reassigns record ownership"],
  [/^Bigin_delink/, "unlinks related records"],
  [/User/, "changes Bigin user administration"],
  [/Tag/, "renames or changes tags across all records"],
  [/Notif/, "changes webhook notifications"],
];

function asObject(value) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  return value && typeof value === "object" ? value : {};
}

function toolName(raw) {
  const call = asObject(asObject(raw).toolCall);
  const args = asObject(call.args);
  return [call.name, args.mcpToolName, args.toolName, args.tool_name, args.name]
    .map((n) => /Bigin_\w+/.exec(String(n ?? ""))?.[0])
    .find(Boolean);
}

function confirm(tool) {
  const effect = IMPACT.find(([re]) => re.test(tool ?? ""))?.[1] ?? "is a high-impact change";
  // Fail closed: an unparsable event still gets a confirmation prompt.
  return {
    decision: "force_ask",
    reason: `${tool || "This Bigin action"} ${effect} in Bigin. Confirm before it runs.`,
  };
}

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => process.stdout.write(JSON.stringify(confirm(toolName(input)))));
