# Pipeline review report

A concise, decision-ready review. **Read-only.** The rules in [the read skill](../SKILL.md), [the data model](data-model.md), and [the COQL reference](coql.md) apply, in particular: stages from `forecast_type` (or user-confirmed), deals scoped by team pipeline, zero results is final, and one query per question.

## 1. Scope

- **Owner:** the current user (`Bigin_getNewUsers`, `type=CurrentUser`) unless they ask about the team.
- **Period:** the current calendar month, using absolute dates.
- **Team pipeline:**
  - If the user named one, resolve it.
  - Otherwise apply the pipeline-selection rule in the COQL reference: 1 relevant pipeline → use it; 2 → report both plus a combined total; 3 or more → ask once.
- **Currency:** from `Bigin_getOrganizationDetails`.

For each chosen pipeline, read its layout once. From it, take the Stage values grouped by `forecast_type` (`Open` / `Closed Won` / `Closed Lost`), in pipeline order. If there's no `forecast_type`, ask once which stages are won and lost.

## 2. Collect (prefer aggregates)

For each team pipeline, scoped with `Pipeline = '<team_pipeline_id>'` and owner and stage filters from the resolved values:

1. Open deals by stage: `SELECT Stage, COUNT(id), SUM(Amount) … GROUP BY Stage`.
2. Open deals closing this period, overdue (`Closing_Date` before today), and stale (`Modified_Time` older than 14 days, or the user's threshold). Select `Deal_Name, Stage, Amount, Closing_Date, Account_Name, Owner, Modified_Time`.
3. Won and lost deals in the period, for the win rate by count and by value.
4. Optional, if the user wants activity hygiene: open tasks past `Due_Date`.

If there are 500+ open deals in scope, rely on the aggregates above and fetch rows only for the overdue and stale lists (top 10 by `Amount`).

## 3. Report

```
Pipeline review — <owner>, <period> (<pipeline name(s)>)

Open: <n> deals, <total>  ·  Closing this period: <n>, <total>  ·  Win rate: <x>% (<won>/<won+lost>)

| Stage | Deals | Value |
...

Needs attention
- Overdue: <deal> (<company>), closing date <date>, <amount>
- Stale (no update in 14+ days): …

Next steps
1. <deal>: <specific action>
```

If a section has no data, say "none" in one line. Don't widen filters to fill it.

Offer to update closing dates or create follow-up tasks. Those go through the `bigin-write` skill with its YES gate.
