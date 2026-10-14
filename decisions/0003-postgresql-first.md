# ADR 0003: PostgreSQL-first SQL

## Status

Accepted

## Context

SaaS support queries are mostly tenant-scoped `SELECT`s, JSON blobs, and timestamptz ranges. PostgreSQL is the most common OLTP for new SaaS. MySQL and SQL Server remain common enough that ignoring them would strand readers.

## Decision

The SQL chapter is **PostgreSQL-first**: `ILIKE`, `LIMIT`, `JSONB` operators, `SET statement_timeout`. MySQL and SQL Server differences are footnotes on the same patterns, not separate books.

MongoDB is a sibling chapter, not a footnote. Support engineers hit both.

## Consequences

- Examples use Postgres unless labeled otherwise.
- We do not teach `UPDATE`/`DELETE` in v1.
- Product runbooks can override dialect ("we are MySQL 8") without forking the craft chapter.
