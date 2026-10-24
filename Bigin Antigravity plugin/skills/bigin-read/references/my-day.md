# My day / week brief

A short, prioritized agenda for the current user. **Read-only.** The rules in [the read skill](../SKILL.md), [the data model](data-model.md), and [the COQL reference](coql.md) apply.

## 1. Scope

- **Owner:** the current user (`Bigin_getNewUsers`, `type=CurrentUser`), with their timezone for datetime filters.
- **Period:** today, or the next 7 days for "my week". Use absolute dates.
- **Team pipelines:** all pipelines the user owns deals in; break deal items down per pipeline. Open stages come from `forecast_type` (or the user's answer).

## 2. Collect (one query per item, owner-scoped)

1. **Events** with `Start_DateTime` in the period, earliest first.
2. **Open tasks** (`Status` not the completed value from metadata) due in the period, plus overdue ones (`Due_Date` before today), by `Priority`.
3. **Open deals** with `Closing_Date` in the period, and open deals already past `Closing_Date`.
4. **Stale open deals:** `Modified_Time` older than 14 days, top 10 by `Amount`.

## 3. Report

```
Your <day|week> — <date or range>

Meetings: <time> <title> (<related record>) …
Tasks: <n> due · <n> overdue — top: <subject> (<record>), due <date> …
Deals closing: <deal> (<company>), <stage>, <amount> …
Needs attention: <overdue deal or stale deal and why>
```

Skip an empty section with "none". Offer to reschedule tasks, update closing dates, or create follow-ups; those go through `bigin-write`.
