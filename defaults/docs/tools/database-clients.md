# Database clients

The database is a **read-only microscope**. It is not a fix tool.

If Network, logs, and the API already explain the ticket, do not open the database. Every extra query is PII exposure and load on production.

## Tools

| Tool | Fits |
| --- | --- |
| [DBeaver](https://dbeaver.io/) | Cross-engine GUI (Postgres, MySQL, SQL Server, and more) |
| [TablePlus](https://tableplus.com/) | Fast GUI for people who live in SQL |
| `psql` | PostgreSQL CLI; scriptable; honest |
| `mysql` / `sqlcmd` | MySQL and SQL Server CLIs |
| `mongosh` | MongoDB shell; required vocabulary is in [MongoDB for support](/data/mongodb) |
| Cloud consoles (RDS Query Editor, Atlas, Azure Data Studio) | Fine if access is audited and read-only |

Prefer accounts that **cannot write**. If your only credential can `UPDATE`, you do not have a support credential. You have a loaded gun.

## Session rules

1. Confirm you are on the intended environment (prod vs staging) before you type.
2. Set a statement timeout if the engine allows it (Postgres: `SET statement_timeout = '5s';`).
3. `SELECT` with `LIMIT` (or `find().limit()`).
4. Never run a query you cannot explain to the DBA in one sentence.
5. Log tenant id + ticket id in your internal note: who looked, why, when.

SQL patterns: [SQL for support](/data/sql). MongoDB patterns: [MongoDB for support](/data/mongodb).

## What you paste back into the ticket

Paste **counts and redacted rows**, not the result grid.

```text
Ticket 18422 / tenant acme-prod
users with email like the reported address: 1 row
role = billing_admin, deleted_at IS NULL
invoices.inv_9 status = disputed (matches API 403 body)
```

Strip emails if policy says so. Strip access tokens always.
