---
name: bigin-write
description: Create, update, bulk-update, or upsert Bigin records (contacts, companies, deals in any team pipeline, products, tasks, events, calls), add or edit notes, create or apply tags, and turn call or meeting notes into a note, call record, deal update, and follow-up tasks — resolving metadata first and executing only after one explicit YES. Use whenever the user wants to change Bigin data or log an interaction, including "add John if he isn't there yet", "onboard Acme into the onboarding pipeline", or pasted call notes.
---

# Change Bigin data

You create and update Bigin data. You search and fetch only as internal steps; showing data to the user belongs to `bigin-read`. **Nothing is written without one explicit YES.**

Read [the Bigin data model](../bigin-read/references/data-model.md) before the first write in a conversation. Before any Task, Event, or Call, also read [references/activity-fields.md](references/activity-fields.md).

Never guess module names, field API names, record IDs, lookup IDs, layout IDs, stages, pipelines, or picklist values.

## Intent

| Intent | Tool |
|---|---|
| **CREATE** | `Bigin_addRecords` |
| **UPDATE** | `Bigin_updateSpecificRecord` for one record; `Bigin_updateRecords` for several, only after the user confirms the scope |
| **UPSERT** ("create if not exists, update if exists") | `Bigin_upsertRecords`, for Contacts, Accounts, and Products. `duplicate_check_fields` is **required**: Contacts→`Email`, Accounts→`Account_Name`, Products→`Product_Code` if set, else `Product_Name`, unless the user names another unique field. Don't upsert Tasks, Events, or Calls (no natural unique key). For deals, don't upsert on `Deal_Name` (names like "Renewal" repeat across companies and pipelines): search within the team pipeline, then update by ID or create. |
| **NOTE** | Create: `Bigin_addNotesToSpecificRecord` (`Note_Content` required, `Note_Title` optional). Edit: `Bigin_updateNotes`, sending `{"id", ...changed fields}`. Get the note id from `Bigin_getNotesFromSpecificRecord` if it's unknown. |
| **TAG** | `Bigin_addTagsToSpecificRecord` / `Bigin_addTagsToMultipleRecords`. If the tag doesn't exist yet, create it first with `Bigin_addNewTags`. To remove a tag, use `Bigin_removeTagsFromSpecificRecord` / `Bigin_removeTagsFromMultipleRecords`. |
| **LINK** | `Bigin_updateRelatedListRecords` to relate existing records (e.g. a contact to a deal) |
| **DELETE** | Not part of normal workflows. See *High-impact tools* below. If the user didn't explicitly ask to delete, offer the nearest supported action, such as updating a status. |

### High-impact tools (explicit request only)

Use these only when the user asks for that exact action. Show the affected records in the confirmation summary as usual; Antigravity may also show its own confirmation prompt for them.
- **Delete:** `Bigin_deleteSpecificRecord`, `Bigin_deleteRecords`, `Bigin_deleteNotes`, `Bigin_deleteSpecificNote`, `Bigin_deleteSpecificAttachment`, `Bigin_deleteProfilePhoto`, `Bigin_deleteTag`.
- **Ownership and unlinking:** `Bigin_changeRecordOwner`, `Bigin_changeMultipleRecordOwners`, `Bigin_delinkSpecificRelatedListRecord`, `Bigin_delinkMultipleRelatedListRecords`.
- **Tag administration:** `Bigin_updateSpecificTag`, `Bigin_updateMultipleTags`.
- **Webhooks (admin):** `Bigin_enableNotifications`, `Bigin_updateNotificationDetails`, `Bigin_updateOrDisableANotifDetails`, `Bigin_disableNotifications`.
- **User administration** (`Bigin_addNewUser`, `Bigin_updateSpecificUser`, `Bigin_updateUsersData`, `Bigin_deleteUser`) is out of scope for CRM work. Point the user to Bigin's admin settings unless they explicitly ask for it.

## Create flow

1. **Resolve the module.** A non-standard label is a team pipeline inside the deals module. Resolve it silently; never ask "is that a deal?".
2. **Get metadata** for the target module (cached per module). For deals, use the team pipeline's layout.
3. **Apply the field rules** to every field from metadata:
   - Read-only fields (`api_create` and `api_update` both false, e.g. `Created_By`, `Modified_Time`, `Full_Name`, `Last_Activity_Time`) never go in a payload.
   - `api_create=false` → never in a create. `api_update=false` → never in an update.
   - `system_mandatory=true` → required. If the value can't be resolved, ask for that **one** field.
   - Never include a field that the metadata excludes, even if the user mentioned it.
4. **Resolve before asking, silently.** Don't announce lookups.
   - Duplicate or existence check: `Bigin_searchRecords`.
   - Stage: match the user's wording to the closest `actual_value` by meaning.
   - Owner: name → id via `Bigin_getNewUsers` (`AllUsers`/`ActiveUsers`, match `full_name`). If no owner is given, omit `Owner`; it defaults to the current user.
   - Company and contact lookups: `Bigin_searchRecords`.
   - Ask only for values that genuinely can't be resolved, one question at a time.
5. **Duplicate check (Contacts and Accounts only)**, when the payload has an email or phone. Search once. If a match exists, show it and ask whether to update it instead.
   - **Conditional creates** ("add X if not there") are this same flow: one search, then one confirmation.
   - Reuse an earlier search result from this conversation, and never ask a separate "shall I add it?".
6. **Deals (`Pipelines`):**
   - Set `Sub_Pipeline`; it is required. If none was given, use the team pipeline's default sub-pipeline, or ask if there isn't one.
   - Set a `Stage` that belongs to that sub-pipeline. If none was given, use its first stage.
   - Always set `Pipeline: {"name", "id"}` to the resolved team pipeline, so the deal never lands in the default pipeline by accident.
   - `Closing_Date` is `YYYY-MM-DD`; `Amount` is a number.
   - Link `Contact_Name` and `Account_Name` as `{"id"}`.
7. **Activities:** follow `references/activity-fields.md`, including the link-field pairing (calls link only to deals or companies; the contact goes in its own field).
8. **Validate** dates, datetimes (with offset), picklists, lookups, and numbers. Convert relative dates to absolute ones.
9. **Confirm**, using the format below. Only after **YES** call the tool, with the payload in array form.

## Update flow

1. Resolve the module and metadata.
2. Find the target with `Bigin_searchRecords`; its result carries the current values. If there's an active record from earlier in the conversation, reuse it instead. If several records match, ask which one.
3. Show `Field: current → new` for **only the changed fields**, plus the record ID.
4. Confirm, then write.

**Deals:**
- A new `Stage` must belong to the record's team pipeline.
- "Move to pipeline X" means a new `Pipeline` (team pipeline) **plus** a valid `Sub_Pipeline` and `Stage` for it. Moving within the same team pipeline only changes `Sub_Pipeline` and `Stage`.
- `$append_values` adds to a multi-select field instead of replacing it.

## Multi-action requests

**Call or meeting notes** (the user pastes notes, says they just met a customer, or asks to log an interaction): follow [references/call-notes.md](references/call-notes.md).

Decompose the whole request and confirm **all** actions in **one** summary. For example, "Onboard John Mathew from Acme into the onboarding pipeline and note he needs L1 support" becomes:
1. create the contact (after a duplicate check);
2. create the deal in that team pipeline, linked to the contact and company;
3. add the note.

Execute in dependency order after the single YES.

## Confirmation format (once per change set)

```
Action: Create deal (+ note)
Module / pipeline: Pipelines → Customer Onboarding › Standard (stage: Kickoff)
Records: Contact John Mathew (existing, 6685838000001234001)
Payload: Deal_Name "Acme – Onboarding", Closing_Date 2026-11-15, Amount 12,000 …
Checks: duplicate search done · stage from pipeline metadata · dates absolute
Please confirm to proceed — YES or NO?
```

- "Go ahead" or "do it" counts as YES **only after** the summary has been shown.
- If the user changes the payload materially, show it again.

## After writing

- Report each record created or changed, with its ID. It becomes the active record.
- **On error:** identify the failing field or value. If the fix is certain, correct it, re-confirming if the payload changed materially, and retry **once**. Otherwise explain plainly.
  - `INVALID_DATA` on a datetime usually means a missing offset.
  - `MANDATORY_NOT_FOUND` usually means a missing required field or an unpaired `Related_To` / `$related_module`.
- Never expose raw errors or payload internals unless the user asks.
