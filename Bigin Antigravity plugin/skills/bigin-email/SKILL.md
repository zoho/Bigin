---
name: bigin-email
description: Send email from Bigin to a contact, company, or deal record — composed for the user, optionally scheduled — using a configured Bigin from-address so it is logged on the record. Use when the user asks to email, follow up with, or send a recap or quote to someone in Bigin, or says "send it" after an email has been drafted.
---

# Email from Bigin

You send emails to Bigin records. You can't read email history; if the user asks for past emails, say so.

## 1. Target record

- You need the target **record ID** and module: `Contacts`, `Accounts`, or `Pipelines` (deals).
- Reuse the active record from this conversation. Otherwise resolve it through `bigin-read` (search). With several matches, ask which one; never pick automatically.
- Read the recipient's email and full name from the record. If there's no email, or `Email_Opt_Out` is true, stop and tell the user.

## 2. Sender

Call `Bigin_getConfiguredFromAddresses` once per conversation and cache the result. Use the entry with `default = true` unless the user names another verified sender. Never guess a from-address; Bigin rejects unlisted ones.

## 3. Content

- Every email needs **both** a subject and content.
- If the user drafted it earlier in the conversation, reuse it word for word. Never ask them to repeat it.
- Otherwise draft it from the user's request and the record context (deal name, stage, latest note if relevant), in the user's voice. Leave out internal notes and figures the user didn't mention.
- **Saved Bigin email templates can't be sent through this connection.** If the user asks for one, say so and offer to draft the email here instead (they can paste the template text).

## 4. Payload

| Field | Value |
|---|---|
| `from` | `{email, user_name}` from step 2 |
| `to` | Array (max 50) of `{email, user_name}`. `cc` and `bcc` (max 50 each) only if the user asks. |
| `subject`, `content` | Both required |
| `mail_format` | `html` by default; `text` if the user wants plain text |
| `reply_to` | Only if the user asks for a different reply-to address |
| `schedule_time` | ISO 8601 with offset, only when the user explicitly asks to schedule |

`data` holds **exactly one** email per call, sent from the record in the path (`module_api_name` + `id`). Emailing several records means one call per record.

## 5. Send: one gate

- **Not yet approved:** show **From / To / Subject / Body**, any schedule time, and the record it will be logged on, then ask **"Send it — YES or NO?"**
- **Already approved:** if the user already approved this exact draft, or says "send it" / "go ahead" with the recipient and content ready, call `Bigin_sendEmails` without asking again.
- **Bulk:** for more than 5 recipient records, list them all and restate the count before sending.

Afterwards, confirm plainly who it went to (and when, if scheduled). Offer a follow-up task through `bigin-write`.
