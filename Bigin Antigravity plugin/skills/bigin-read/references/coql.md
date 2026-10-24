# COQL for Bigin (`Bigin_getRecordsUsingCoqlQuery`)

COQL is **not** SQL. Build the query once from resolved metadata, run it once, and stop.

## Sequence (no skipping)

1. **Metadata:** confirm the exact `api_name` and `data_type` of every field used in SELECT, WHERE, GROUP BY, and ORDER BY (see section 4 of [the data model](data-model.md)).
   - For lookup fields used with dot notation, resolve the related module's field names from its metadata as well.
   - Never guess paths like `Contact_Name.Full_Name`.
2. **Deals only:** resolve the team pipeline id and its Stage `actual_value`s with their `forecast_type` (data model, section 3). Without the team pipeline id, don't write the query.
3. **Timezone:** only when a datetime value goes into WHERE.
4. **Write the query.**

## Syntax

- `SELECT`, `FROM`, `WHERE`, and `LIMIT` are **all mandatory**.
  - With no business filter, use `WHERE id is not null`, never `1=1`.
  - That placeholder is never a way to sample or explore data.
- **LIMIT:** use `LIMIT 200 OFFSET 0` (the Bigin v2 form; 200 rows maximum). Advance OFFSET by 200 while `info.more_records` is true. COQL returns at most 10,000 rows in total; beyond that, split the query by date range or owner.
- **Aggregates:** `COUNT(id)`, `SUM(f)`, `AVG(f)`, `MIN(f)`, `MAX(f)`.
  - `COUNT` takes **only** `id`.
  - For counts and totals, prefer aggregates over fetching rows and counting them.
  - If the server rejects an aggregate or `GROUP BY` (`INVALID_QUERY`), make that your one correction: fetch the needed rows with paging and compute the totals yourself. `Bigin_recordsCount` gives quick totals.
  - `GROUP BY` takes up to 4 fields; `ORDER BY` up to 10.
- **Operators** are lowercase: `=`, `!=`, `>`, `<`, `>=`, `<=`, `like`, `not like`, `in`, `not in`, `between`, `not between`, `is null`, `is not null`.
- **`like` patterns:**
  - `'%x%'` means contains, `'x%'` starts with, `'%x'` ends with.
  - `not like` works only with `%` at both ends.
- **`in`** takes up to 100 values, in parentheses. Prefer `in` over chained `or` on the same field.
- **Booleans:** `Email_Opt_Out = 'true'`.
- **Dates:**
  - Never use date functions (`YEAR()`, `MONTH()`, …). Use explicit `between 'a' and 'b'`.
  - A date field takes `'YYYY-MM-DD'`; a datetime field takes ISO 8601 with an offset.
- **Grouping:** WHERE must be grouped **in pairs, left to right**:
  ```
  2: (A and B)
  3: ((A and B) and C)
  4: (((A and B) and C) and D)
  mixed: ((A and B) or C)
  ```
  A flat chain like `(A and B and C)` is a syntax error.
- **Query limits:** at most 25 criteria, 2 joins (dot notation, no `JOIN … ON`), and 5 subqueries (WHERE only, one column each, ≤100 rows each).

## Not usable

Never use these fields in COQL:
- multi-line text such as `Description` (not in WHERE);
- the Events `Participants` field;
- file and image upload fields;
- multi-select lookups;
- territory fields (SELECT only).

If the user filters on one of these, explain the limit and offer an alternative.

## Deals rules

- Scope to the team pipeline: `Pipeline = '<team_pipeline_id>'`. This is a lookup, so compare it with the id.
- Stage filters use the resolved `actual_value`s for the intended `forecast_type`:
  - "open" = `Open`; "won" = `Closed Won`; "lost" = `Closed Lost`; "closed" = both won and lost.
  - Without `forecast_type`, use the won and lost stages the user confirmed.
- When a sub-pipeline is given, add `Sub_Pipeline = '<name>'` and use only that sub-pipeline's stages.
- If the server rejects the `Pipeline` filter, list the pipeline's deals with `Bigin_getRecordsFromSpecificTeamPipeline` instead.

### Pipeline selection when the user didn't name one

1. Read the team pipeline names.
2. Keep the ones relevant to the intent:
   - sales, revenue, win/loss → commercial pipelines;
   - tickets, SLA, CSAT → support pipelines;
   - go-live, kickoff → onboarding pipelines.
3. Then:
   - **1 relevant** → use it silently.
   - **2 relevant** → query both and report each plus a combined total.
   - **3 or more, or an org-wide request** → ask once, listing the names. Exception: if the user said "across all pipelines", query all of them and break down the results per pipeline.
4. **Never silently default to one pipeline.** That returns partial data that looks complete.

## Activities

"Activities" = Tasks + Events + Calls. Run one query per module, then combine them with a per-type breakdown.

## Results discipline

- **Zero rows from a correct query is the final answer.** Say what was searched and that nothing matched, in one sentence.
  - Don't loosen or drop filters, try other pipelines, or offer alternative queries.
- **Errors** (`INVALID_QUERY`, `SYNTAX_ERROR`, `INVALID_DATA`, field not found): diagnose once, apply one targeted fix, and re-run once.
  - Reuse cached metadata, and don't loop.
  - If it still fails, say plainly that the data couldn't be retrieved.
- Never run exploratory or probe queries.

## Examples (placeholders shown in angle brackets)

```sql
-- Open deal value by stage in one team pipeline
SELECT Stage, COUNT(id), SUM(Amount) FROM Pipelines
WHERE (Pipeline = '<team_pipeline_id>' and Stage in ('<open_1>', '<open_2>', '<open_3>'))
GROUP BY Stage LIMIT 200 OFFSET 0

-- Deals closing this month, open only, largest first
SELECT Deal_Name, Stage, Amount, Closing_Date, Owner FROM Pipelines
WHERE ((Pipeline = '<team_pipeline_id>' and Stage in ('<open_1>', '<open_2>')) and Closing_Date between '<month_start>' and '<month_end>')
ORDER BY Amount DESC LIMIT 200 OFFSET 0

-- Overdue open tasks
SELECT Subject, Due_Date, Status, Owner FROM Tasks
WHERE (Status not in ('<completed_value>') and Due_Date < '<today>')
LIMIT 200 OFFSET 0

-- Contacts without email
SELECT First_Name, Last_Name, Account_Name FROM Contacts WHERE (Email is null) LIMIT 200 OFFSET 0
```
