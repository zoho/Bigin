# Activity field rules: Calls, Tasks, Events (Bigin v2)

Bigin v2 conventions apply (section 1 of [the data model](../../bigin-read/references/data-model.md)). **Live field metadata wins.** Read it for the module before every activity write (cached per module), and check the data type of any field below before sending it.

## Linking an activity to a record

`Related_To` and `$related_module` are **always a pair**. Sending one without the other fails, usually with `MANDATORY_NOT_FOUND`.

| Module | `Related_To` | `$related_module` |
|---|---|---|
| Tasks | `{"name": "...", "id": "..."}` | `Contacts`, `Deals`, or `Accounts` |
| Events | `{"name": "...", "id": "..."}` | `Contacts`, `Deals`, or `Accounts` |
| Calls | See *Calls* below: the field names come from Calls metadata | `Deals` or `Accounts` only; the contact goes in its own field |

- A deal is **`Deals`** in `$related_module`, even though its module API name is `Pipelines`.
- Link to the most specific record the user means. A follow-up on a deal links to the deal; a general to-do for a person links to the contact.

## Calls

Read Calls field metadata (`Bigin_getFieldsMetadata`, module `Calls`) before the first call write, and use the link fields it actually has:

| Link | Newer field set | Older field set (in the server's tool schema) |
|---|---|---|
| Deal or company | `Related_To: {"id"}` + `$related_module` | `What_Id: {"id"}` + `$se_module` |
| Contact on the call | `Contact_Name: {"id"}` | `Who_Id: {"id"}` |

Never mix the two sets in one payload.

| Field | Rule |
|---|---|
| `Call_Type`, `Call_Start_Time`, `Call_Duration` | Mandatory. Add `Subject` as well. |
| `Call_Type` | A picklist value from metadata: `Outbound`, `Inbound`, or `Missed` |
| `Call_Start_Time` | ISO 8601 with offset |
| `Call_Duration` | Follow its `data_type`: text → `"HH:mm"` (e.g. `"00:30"`); number → minutes (e.g. `30`). Never zero for a completed call. |
| Call status / outcome | Only if the field exists in metadata. Use its exact picklist values. |

## Tasks

| Field | Rule |
|---|---|
| `Subject` | Mandatory |
| `Due_Date` | `YYYY-MM-DD` |
| `Status`, `Priority` | Exact picklist values from metadata |
| `Related_To` + `$related_module` | Optional, always as a pair |
| Reminders / recurrence (`Remind_At`, `Recurring_Activity`) | Only if the user asks. Use the format the metadata gives. Zoho's usual shapes (`{"ALARM": "ACTION=EMAIL;TRIGGER=-P1D;TRIGGER_TIME=09:00"}`, `{"RRULE": "FREQ=WEEKLY;INTERVAL=1;..."}`) are a hint, not a guarantee. |

## Events

| Field | Rule |
|---|---|
| `Event_Title`, `Start_DateTime`, `End_DateTime` | Mandatory; datetimes with offset |
| `All_day` | Boolean, if the field exists |
| `Participants` | Only if the user names attendees. Use the structure from metadata; it's capped at 50. |
| `Related_To` + `$related_module` | Optional, always as a pair |
| Reminders / recurrence | As for Tasks: only when asked, in the metadata's format |

## Not supported

Upsert doesn't work for Tasks, Events, or Calls. Create them with `Bigin_addRecords`, or update them with `Bigin_updateSpecificRecord` / `Bigin_updateRecords`.
