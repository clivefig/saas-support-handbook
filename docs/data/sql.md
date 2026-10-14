# SQL for support

SQL is how you confirm **what is stored**. It is not how you "fix" a tenant. If you cannot do the job with `SELECT` (or a documented admin tool), escalate.

Defaults: **PostgreSQL-first**. Differences for MySQL and SQL Server are called out. Decision: `decisions/0003-postgresql-first.md`.

## Hard rules

1. Read-only credentials. If you have write access, still type only `SELECT`.
2. Always `LIMIT` (Postgres/MySQL) or `TOP` / `FETCH FIRST` (SQL Server).
3. Filter by tenant/org id **first**. Never `SELECT * FROM users`.
4. Set a timeout: `SET statement_timeout = '5s';` (Postgres).
5. If you must test a write in a scratch session: `BEGIN;` … inspect … `ROLLBACK;`. If you cannot wrap it, do not run it.
6. Paste counts and keys into tickets, not PII grids. See [privacy](/tools/privacy) and [database clients](/tools/database-clients).

## Anatomy of a support query

```sql
SELECT id, email, role, created_at, deleted_at
FROM users
WHERE tenant_id = 'tnt_acme'
  AND email ILIKE 'jane.doe@%'
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20;
```

| Clause | Why support uses it |
| --- | --- |
| `SELECT` explicit columns | Avoids dumping tokens / blobs |
| `WHERE tenant_id = …` | Multi-tenant safety |
| `ILIKE` | Case-insensitive match (Postgres) |
| `deleted_at IS NULL` | Soft-delete is the usual "user vanished" ticket |
| `LIMIT` | Protects production |

## Comparison and filters

```sql
-- equality, lists, ranges, nulls
WHERE status = 'disputed'
  AND id IN ('inv_9', 'inv_10')
  AND created_at >= TIMESTAMPTZ '2026-09-17 00:00:00+00'
  AND created_at <  TIMESTAMPTZ '2026-09-18 00:00:00+00'
  AND closed_at IS NULL;
```

**MySQL:** `LIKE` is case-insensitive for typical collations; `ILIKE` does not exist. Use `LIKE` or `LOWER(email) = LOWER(?)`.

**SQL Server:** `LIKE` is collation-dependent. `SYSDATETIMEOFFSET()` for now. `TOP 20` instead of `LIMIT`.

## Joins (the "why can't they see the invoice" query)

```sql
SELECT u.id AS user_id, u.role,
       i.id AS invoice_id, i.status, i.amount_cents
FROM users u
JOIN invoices i ON i.tenant_id = u.tenant_id
               AND i.customer_user_id = u.id
WHERE u.tenant_id = 'tnt_acme'
  AND u.id = 'user_01H8'
  AND i.id = 'inv_9'
LIMIT 5;
```

`LEFT JOIN` when you need to prove the invoice row **is missing**. `JOIN` (inner) when you only care about matches.

## JSONB (Postgres)

SaaS apps store settings and event payloads as JSON. Operators:

```sql
SELECT id,
       data->>'plan'        AS plan,      -- text
       data->'features'     AS features   -- jsonb
FROM tenants
WHERE id = 'tnt_acme'
LIMIT 1;

-- contains
SELECT id
FROM events
WHERE tenant_id = 'tnt_acme'
  AND metadata @> '{"type":"invoice.paid"}'
LIMIT 20;
```

| Operator | Returns |
| --- | --- |
| `->` | jsonb |
| `->>` | text |
| `@>` | contains |
| `?` | key exists |

**MySQL:** `JSON_EXTRACT(data, '$.plan')` or `data->>'$.plan'`.

**SQL Server:** `JSON_VALUE(data, '$.plan')`.

Do not `SELECT` a 20 MB jsonb document into your GUI. Pull keys only.

## Dates and timezones

Store and filter in UTC. Customers say "this morning" in their timezone.

```sql
SELECT id, created_at AT TIME ZONE 'UTC' AS created_utc
FROM audit_log
WHERE tenant_id = 'tnt_acme'
  AND created_at >= NOW() - INTERVAL '2 hours'
LIMIT 50;
```

**MySQL:** `created_at >= UTC_TIMESTAMP() - INTERVAL 2 HOUR`.

**SQL Server:** `DATEADD(hour, -2, SYSUTCDATETIME())`.

## "Is this query going to wreck prod?" — `EXPLAIN` only

```sql
EXPLAIN (FORMAT TEXT)
SELECT *
FROM events
WHERE tenant_id = 'tnt_acme'
  AND created_at > NOW() - INTERVAL '90 days';
```

If you see a sequential scan on a huge table and you meant to filter by `id`, **do not run it**. Ask engineering. `EXPLAIN ANALYZE` actually runs the query — skip it on production as support unless you have DBA blessing.

## Soft deletes, duplicates, counts

```sql
SELECT COUNT(*) FROM users WHERE tenant_id = 'tnt_acme' AND deleted_at IS NULL;

SELECT email, COUNT(*)
FROM users
WHERE tenant_id = 'tnt_acme'
GROUP BY email
HAVING COUNT(*) > 1
LIMIT 20;
```

`COUNT(*)` on an unfiltered huge table is a load incident. Always tenant-scope.

## What to ask before you query

- Tenant id, user id, object id from the HAR — not "find Jane"
- Confirmation that admin tools cannot already show the field

## When to escalate (do not write SQL)

- Any `UPDATE`, `DELETE`, `INSERT`, `TRUNCATE`, `GRANT`
- Unlocking a row, reseeding a sequence, dropping an index
- "Just change their plan in the database"

Those are change-controlled runbooks, not support craft. Out of v1 for this public book.
