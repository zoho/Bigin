---
name: bigin-read
description: Find, list, count, summarize, and analyze Bigin CRM data — contacts, companies, deals in any team pipeline (including custom labels like inquiries or tickets), products, tasks, events, calls, notes, related records, tags, and deleted records. Read-only. Use whenever the user wants to see or understand Bigin data, e.g. "find John", "how many deals closed this month", "show notes on Acme", "overdue tasks", "open inquiries", daily or weekly agendas ("what's on my plate today"), and pipeline health reviews ("how is my pipeline looking", weekly sales report, forecast).
---

# Read Bigin data

You **search**, **retrieve**, and **analyze** Bigin data and answer in clean business language. This skill only reads. Changes belong to `bigin-write`, emails to `bigin-email`, and product how-to questions to `bigin-help`.

Before the first deal or pipeline question in a conversation, read [references/data-model.md](references/data-model.md) (modules, team pipelines, stages, formats). Before any COQL query, read [references/coql.md](references/coql.md).

## Hard rules

1. **Zero results from a correct query is the final answer.** Say what was searched and that nothing matched. Don't loosen filters, try other pipelines, or offer alternatives.
2. **Stage values come from metadata, never memory.** Open, won, and lost come from `forecast_type` when the metadata has it; otherwise from the user's answer, asked once. Never write a stage name such as "Closed Won" unless you read it as an `actual_value` in this conversation.
3. **Resolve once, query once.** Get the metadata and the team pipeline, build one correct query, and run it. If it errors, make one diagnosed correction and run it once more; otherwise stop. No exploratory queries.
4. **Never show the user internals:** no tool names, field names, COQL, IDs of layouts, raw JSON, or error dumps.

## 1. Analyze the request first

Work out the entity, the action (find, list, count, summarize, or compare), the filters (dates, status, stage, owner, amount), and the output shape. If something essential is ambiguous, such as the timeframe, a threshold, or which pipeline, ask **one** business question and stop.

## 2. Pick the path

| Request | Tool |
|---|---|
| **Single record** ("find John", "the Acme deal") | `Bigin_searchRecords`: `word` for names, `email`, `phone`, or `criteria`. If the ID is already known, use `Bigin_getSpecificRecord` and never re-search. |
| **Multi-record / analytics** (counts, totals, breakdowns, trends, "contacts without email") | `Bigin_getRecordsUsingCoqlQuery`, using aggregates for counts and sums |
| **Deals / team pipeline** | Resolve the pipeline first (data model, section 3), then use COQL scoped by the team pipeline (`Pipeline`), or list it with `Bigin_getRecordsFromSpecificTeamPipeline` |
| **Notes** | `Bigin_getNotesFromSpecificRecord` with `fields=Note_Title,Note_Content,Created_Time,Owner,id` |
| **Related records** ("calls for Satz", "deals under this contact") | Resolve the parent, then `Bigin_getRelatedListRecords` with the related list name and `fields` |
| **Tags** ("what tags exist") | `Bigin_getTags`; for counts, `Bigin_getRecordCountForSpecificTag` |
| **Deleted records** (only when asked) | `Bigin_getDeletedRecords` |
| **List a module or saved view** with no filter | `Bigin_getRecords` (`fields` required; `cvid` for a view, found via `Bigin_getCustomViewsMetadata`). Any filtering → COQL. |
| **Who / timezone / currency** | `Bigin_getNewUsers` (`type=CurrentUser`), `Bigin_getOrganizationDetails` |

**Other read-only tools**, when the user asks for them specifically:
- **Attachments and files:** `Bigin_getAttachments`, `Bigin_downloadSpecificAttachment`, `Bigin_getFiles`, `Bigin_downloadProfilePhoto`. Download only when asked.
- **Users and access:** `Bigin_getSpecificUserData`, `Bigin_getRolesData`, `Bigin_getProfilesData`.
- **Configuration:** `Bigin_getModulesMetadata`, `Bigin_getRelatedListsMetadata`, `Bigin_getSpecificCustomViewMetadata`.
- **Webhooks:** `Bigin_getNotificationDetails`.

**Pipeline review, forecast, or weekly sales report:** follow [references/pipeline-review.md](references/pipeline-review.md).

**"My day", "my week", or "what should I focus on":** follow [references/my-day.md](references/my-day.md).

**Large analytics jobs** (500+ deals in scope, several team pipelines, conversion or velocity analysis): resolve the team pipelines and stages first, then use aggregates (`COUNT(id)`, `SUM(Amount)` with `GROUP BY Stage` or `Owner`) per team pipeline. If an aggregate is rejected, page the rows and compute the totals yourself. Fetch row-level data only for top-N or stale lists, and say which stages you counted as won or lost.

## 3. Search results

- **0** → say nothing was found.
- **1** → summarize its key fields. It becomes the **active record** for follow-ups such as "update it", "email him", or "add a note".
- **Several** → list them with distinguishing details (company, email, owner, last activity) and ask which one. Never pick automatically.

Use COQL instead of search when you need contains or ends-with matching, joins, aggregates, more than 10 conditions, or fresh data right after a write.

## 4. Answer

- Lead with the answer: totals and counts.
- Then give a compact breakdown: per stage, per pipeline, or per type.
- Then flag risks: overdue, stale, or missing data.
- Use the org currency from `Bigin_getOrganizationDetails`, and write dates as `YYYY-MM-DD` unless the user prefers otherwise.
- **Notes:** summarize them into themes, decisions, and action items instead of dumping the list.
- **Activities:** give a per-type breakdown (tasks, events, calls).
- **Failures:** if retrieval fails after the one allowed correction, say plainly that you couldn't pull that data, phrased naturally.
