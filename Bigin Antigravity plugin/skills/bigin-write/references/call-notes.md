# Call or meeting notes → Bigin updates

A multi-action write: the field rules and the one YES gate in [the write skill](../SKILL.md) apply, plus [the activity field rules](activity-fields.md) (call and task fields, `Related_To` + `$related_module` pairing).

## 1. Identify the records (silently)

1. Extract from the notes: the person, the company, any deal mentioned, the date and time of the interaction, the commitments made, and any stage, amount, or date changes they imply.
2. Resolve them:
   - **Contact:** `Bigin_searchRecords` by `email` or `phone` first, then `word`. Reuse the active record if there is one.
   - **Open deals:** `Bigin_getRelatedListRecords` on the contact or company, with the deals related list.
   - **Several matches, or none:** ask which one. Don't create contacts or companies unless the user asks; if they do, the write skill's duplicate check applies.
3. If a deal will change, read its team pipeline layout for valid stages.

## 2. Draft one proposal

- **Note** on the deal, or on the contact if there's no deal:
  - Title: `<Call|Meeting> with <name> — <YYYY-MM-DD>`.
  - Content: summary, decisions, objections, and next steps as bullets.
  - Use the user's facts only.
- **Call record** (when it was a call):
  - `Subject`, `Call_Type` (`Outbound`/`Inbound`), and `Call_Start_Time` with offset.
  - `Call_Duration` in the format its metadata `data_type` requires (see the activity field rules).
  - Link it to the contact and to the deal (`Deals`) or company (`Accounts`), using the Calls link fields from metadata.
- **Deal update**, only if the notes clearly imply it:
  - `Stage` must be an `actual_value` from that pipeline, and `Closing_Date` / `Amount` are allowed.
  - Show `current → new`.
- **Follow-up tasks**, one per commitment:
  - `Subject` starts with a verb.
  - `Due_Date` is an absolute `YYYY-MM-DD` (turn "Friday" into a date from today's date).
  - `Priority` and `Status` come from metadata.
  - Link with `Related_To` = the deal and `$related_module: "Deals"`. With no deal, link to the contact (`$related_module: "Contacts"`).

Show everything as **one** confirmation summary, then ask **"Please confirm to proceed — YES or NO?"**

## 3. Write after YES

Write in this order:
1. Note: `Bigin_addNotesToSpecificRecord`.
2. Call: `Bigin_addRecords`, module `Calls`.
3. Deal: `Bigin_updateSpecificRecord`.
4. Tasks: `Bigin_addRecords`, module `Tasks`, all in one call.

Then report each record with its ID. If one write fails, report it plainly and continue with the independent items.
