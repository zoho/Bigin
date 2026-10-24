# Bigin for Antigravity

Work with your [Bigin](https://www.bigin.com) CRM without leaving Antigravity. Ask about your pipeline, find contacts and companies, log calls, create follow-up tasks, or email a customer in plain language. Nothing in Bigin changes until you've reviewed the exact change and replied **YES**.

## What you can do

- **Review your pipeline:** open deals by stage, deals closing this period, win rate, and deals that are overdue or stale.
- **Plan your day or week:** meetings, tasks due or overdue, and deals closing, in priority order.
- **Find and summarize records:** contacts, companies, deals, notes, tasks, and related records.
- **Answer questions about your data:** counts, totals, and breakdowns by stage, owner, or period. Won and lost deals are identified from your pipeline's stage settings, not guessed from stage names.
- **Log calls and meetings:** paste your notes to get one proposal with a note, a call record, any deal updates, and follow-up tasks with real due dates.
- **Email customers:** draft an email, send it from your verified Bigin address, and log it on the record.
- **Get product help:** answers from the official Bigin help center, with links.

## Safety

- **One confirmation per change.** Creates, updates, notes, tags, and emails are shown first (record names, `old → new` values, record counts, or the full email) and run only after you reply YES.
- **High-impact actions run only when you ask for them.** Deletes, owner changes, unlinking, and user, tag, or webhook administration never happen as a side effect, and Antigravity asks you again before they run.
- **Record content is treated as data.** Instructions found inside a note or email body are flagged to you, never followed.
- **No invented data.** Fields, stages, pipelines, and owners are always read from your Bigin account.

## Get started

1. Click **Add**.
2. Ask a question such as "Show my open deals in Bigin", or click a suggested prompt on this page.
3. Sign in with your Zoho account when prompted, and approve access.

No API keys are needed. You can revoke access anytime from **Connected Apps** in your Zoho account.

## Requirements

- A Bigin account on an edition that includes API access. See [Bigin pricing](https://www.bigin.com/pricing.html).
- Access in Bigin to the modules you want to use. The plugin sees exactly what you can see in Bigin, nothing more.
- Some features depend on your edition, such as multiple team pipelines and the number of from-addresses for email.

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Authentication required", or no sign-in window appears | Re-authenticate Bigin from the plugin's page, or disable and re-enable the plugin. |
| Permission or scope errors | Sign in again and approve all requested access. If the error persists, ask your Bigin admin for access to that module. |
| Records you expect are missing | Make sure you signed in to the right Zoho organization. Ask "Which Bigin org am I connected to?" |
| No Bigin tools are available | Run `agy plugin list` and `agy mcp list` (server `zoho-bigin-api`), then reinstall the plugin if needed. |

## What's inside

| Component | Purpose |
|---|---|
| MCP server `zoho-bigin-api` | Zoho-hosted Bigin MCP server (remote HTTPS, Zoho sign-in) |
| Skills `bigin-read`, `bigin-write`, `bigin-email`, `bigin-help` | Look up and analyze data; change records and log calls; send email; answer product questions |
| Rules `bigin-guardrails` (always on), `bigin-orchestration` | Confirmation and data-handling guardrails; routing between skills, context across turns, and error handling |
| Hook `bigin-confirm-high-impact` | An extra confirmation before high-impact actions |

## Privacy

Requests go directly from Antigravity to Zoho's MCP endpoint over HTTPS, authorized by your own Zoho sign-in. The plugin stores nothing on your machine.

## Support

- Email: support@bigin.com
- Bigin help center: https://www.bigin.com/help
- Bigin API documentation: https://www.bigin.com/developer/docs/apis/v2/
