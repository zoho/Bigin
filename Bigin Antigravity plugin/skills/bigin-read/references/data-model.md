# Bigin data model (shared by all Bigin skills)

**Live metadata always beats this file.** Use it to know *what to resolve*, not as a source of values.

## 1. API conventions (Bigin v2)

The MCP server uses the **Bigin v2 API**. Zoho CRM conventions (`Deals` as a module, `Layout`, `Leads`) don't apply; Bigin has no Leads module.

| Concept | Bigin v2 (use this) |
|---|---|
| Deals module API name | `Pipelines` |
| Team pipeline on a deal | `Pipeline: {"name": "...", "id": "..."}` |
| Sub-pipeline on a deal | `Sub_Pipeline: "<name>"`, **required** |
| Stage | `Stage: "<value>"`, **required**, must belong to that sub-pipeline |
| Task / Event → record link | `Related_To: {"name": "...", "id": "..."}` **plus** `$related_module`: `Contacts`, `Deals`, or `Accounts` |
| Call → record link | Deal or company only, plus the contact in its own field. The field names differ by server version: read Calls field metadata once and use the pair it has (see [activity fields](../../bigin-write/references/activity-fields.md)). |
| `$related_module` / `$se_module` for a deal | **`Deals`**, even though the module is `Pipelines` |

If a write fails with an unknown-field error, check that module's field metadata once and adapt. Don't loop.

## 2. Modules

| User says | Module |
|---|---|
| contact, person | `Contacts` |
| company, organization, account | `Accounts` |
| deal, opportunity, pipeline record | `Pipelines` |
| product | `Products` |
| task, to-do | `Tasks` |
| meeting, event | `Events` |
| call | `Calls` |
| note | `Notes` |

**Any other business label** ("inquiries", "tickets", "applications", "interviews", "onboarding") **is a team pipeline inside `Pipelines`**, not a separate module and not out of scope. Resolve it as described in section 3, and never ask the user whether it "maps to deals".

Record IDs are 19-digit numeric strings. They're always valid, so never reject, shorten, or reformat them.

## 3. Team pipelines, sub-pipelines, and stages

- **Team pipeline**: a top-level pipeline such as Sales, Real Estate, Support, or Onboarding, stored on each deal as the `Pipeline` lookup (`{name, id}`). A bare "pipeline" means the team pipeline.
- **Sub-pipeline**: a secondary pipeline inside a team pipeline, stored as the `Sub_Pipeline` string. Every deal has one.
- **Stage**: valid values depend on the sub-pipeline.

**Resolve a team pipeline:**
1. Call `Bigin_getLayoutsMetadata` with module `Pipelines`. Each team pipeline has its own layout. Take the team pipeline's `{name, id}` (the **team pipeline id** used in every filter and write) from the layout, or from the `Pipeline` value on one of its deals if the layout doesn't expose it.
2. Read each layout's `name`, the `Sub_Pipeline` picklist (sub-pipelines), and the `Stage` picklist. Stage values, and their mapping to sub-pipelines, are in `pick_list_values` / `maps`.
3. Match the user's label against the team pipeline name (case-insensitive).
   - One match → use it silently.
   - Several → ask, showing names only and never IDs.
4. Cache the id, sub-pipelines, and stages for the conversation.

To list one team pipeline's deals directly, use `Bigin_getRecordsFromSpecificTeamPipeline`.

**Open, won, or lost: never infer it from the stage name.**
- If the Stage `pick_list_values` carry `forecast_type` (`Open` / `Closed Won` / `Closed Lost`), use it. Several stages can share one type; for example, "Deferred" may be `Closed Lost`, so include them all.
- If the metadata has no `forecast_type`, show the stage list once and ask which stages count as won and lost, then cache the answer. Never write a stage name from memory.

**Scoping deals:**
- In COQL: filter by team pipeline `Pipeline = '<team_pipeline_id>'`, and by sub-pipeline `Sub_Pipeline = '<name>'` when one is given. Stage filters use only that pipeline's stage values.
- In writes: send `Pipeline: {"name", "id"}` (for a non-default team pipeline), `Sub_Pipeline`, and a `Stage` from that sub-pipeline.

## 4. Metadata first, cached per module

- Non-deals modules: get fields from `Bigin_getLayoutsMetadata` (or `Bigin_getFieldsMetadata`) for that module.
- Deals: get fields from the resolved team pipeline's layout, never an unscoped all-layouts read.
- Use exact `api_name`s (case-sensitive), `data_type`, `pick_list_values`, and required flags from metadata. Custom fields exist only in metadata.
- Cache per module. A Deals fetch does not cover Calls. Re-fetch only when the module or pipeline changes, or a call failed.

## 5. Value formats

| Type | Format |
|---|---|
| date (`Closing_Date`, `Due_Date`) | `YYYY-MM-DD`, with no time and no offset |
| datetime (`Created_Time`, `Modified_Time`, `Last_Activity_Time`, `Call_Start_Time`, `Start_DateTime`, `End_DateTime`) | ISO 8601 **with** offset, e.g. `2026-10-23T15:30:00+05:30` |
| lookup | `{"id": "<id>"}`; user and contact lookups may also carry `"name"` |
| picklist | the exact `actual_value` from metadata |
| multi-select picklist | JSON array of strings |
| boolean in COQL | `'true'` / `'false'` (quoted) |

**Timezone:** needed only to build a datetime value, never for date-only fields. Get it from `Bigin_getNewUsers` with `type=CurrentUser` (`time_zone`), falling back to `Bigin_getOrganizationDetails`. Convert the region to an offset and cache it. Never hardcode an offset.

Turn relative dates ("this month", "next Friday", "last quarter") into absolute dates before using them, and show the absolute dates to the user.

**Date field by intent:** revenue or closing → `Closing_Date`; creation → `Created_Time`; recency or activity → `Last_Activity_Time`. If it's ambiguous, use `Closing_Date` and state that assumption.

## 6. Search criteria (`Bigin_searchRecords`)

Send exactly one of `word` (name or keyword), `email`, `phone`, or `criteria`.

- **Criteria:** `(Field:operator:value)`, grouped in pairs: `((A)and(B))`, `(((A)and(B))and(C))`. At most 10 conditions.
- **Operators:** `equals`, `not_equal`, `starts_with`, `in`, `greater_than`, `greater_equal`, `less_than`, `less_equal`, `between`. **Never** `contains`, `ends_with`, `is_empty`.

| Field type | Operators |
|---|---|
| text, email, phone, website | `equals`, `not_equal`, `starts_with`, `in` |
| picklist, user lookup | `equals`, `not_equal`, `in` |
| number, currency, date, datetime | all comparison operators, plus `between` and `in` |
| boolean | `equals`, `not_equal` |

Notes:
- `equals` on free text behaves like "contains".
- Datetimes need an offset.
- Escape `(`, `)`, `,`, and `\` inside values.
- For deals, include the team pipeline (`Pipeline`) and, if relevant, `Sub_Pipeline` in the criteria.

Search is limited to 200 per page and 2,000 in total. Its index updates with a delay, so right after a write, use COQL instead.

## 7. Limits

| Operation | Limit |
|---|---|
| Create, update, upsert, delete | 100 records per call |
| `Bigin_getRecords` | 200 per page; `page` up to 10, then `page_token`. `fields` is required. `sort_by`: `id`, `Created_Time`, or `Modified_Time` only. |
| Notes | 200 per read, oldest first |
| Email recipients | 50 each in `to`, `cc`, and `bcc` |
