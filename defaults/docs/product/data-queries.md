# Data queries (template)

**Read-only.** Paste *this product's* names. Do not paste connection strings. Credentials live in the secret manager, not here.

Engine: TODO (Postgres / MySQL / SQL Server / MongoDB)

## How to connect

TODO: bastion / SSO / read replica hostname **role name only**.

Timeout: TODO (`SET statement_timeout = '5s';` or Mongo equivalent).

## Users and tenants

```sql
-- TODO: replace table and column names
SELECT id, email, role, deleted_at
FROM TODO_users
WHERE TODO_tenant_id = 'TENANT'
LIMIT 20;
```

```javascript
// TODO Mongo equivalent
db.TODO_users.find({ tenantId: "TENANT" }, { email: 1, role: 1 }).limit(20)
```

## Top ticket objects

| Ticket type | Collection / table | Lookup key from the API |
| --- | --- | --- |
| TODO billing | TODO | TODO `inv_` |
| TODO auth | TODO | TODO |
| TODO export | TODO | TODO |

## Forbidden

- Production writes
- `SELECT *` from users
- Queries without a tenant filter

## Related craft

- [SQL for support](/data/sql)
- [MongoDB for support](/data/mongodb)
