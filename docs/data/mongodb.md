# MongoDB for support

Same job as SQL: **read** what is stored. Same ethics: tenant filter, limit, no writes.

Shell: `mongosh`. Driver methods below are the ones you will actually type. Official reference: [`db.collection.find()`](https://www.mongodb.com/docs/manual/reference/method/db.collection.find/).

## Hard rules

1. `find` / `aggregate` only. No `updateOne`, `deleteMany`, `drop`.
2. Always `.limit(n)` or `$limit`.
3. Always filter `tenantId` (or whatever this product uses — record it in the private runbook).
4. Project away secrets (`token: 0`, `passwordHash: 0`).
5. `ObjectId` is not a string. Dates are not strings.

## `find`, projection, sort, limit

```javascript
db.users.find(
  { tenantId: "tnt_acme", email: /jane.doe@/i, deletedAt: null },
  { email: 1, role: 1, createdAt: 1, deletedAt: 1 } // _id still included unless _id: 0
).sort({ createdAt: -1 }).limit(20)
```

`findOne({ _id: ObjectId("66f1a2b3c4d5e6f7a8b9c0d1") })` when you already have the id from the API.

## Operators you will use

| Operator | Example | Meaning |
| --- | --- | --- |
| `$eq` | `{ status: { $eq: "disputed" } }` | Same as `{ status: "disputed" }` |
| `$ne` | `{ deletedAt: { $ne: null } }` | Soft-deleted |
| `$in` | `{ _id: { $in: [id1, id2] } }` | List |
| `$gte` / `$lte` | `{ createdAt: { $gte: ISODate("2026-09-17T00:00:00Z") } }` | Range |
| `$regex` | `{ email: { $regex: "^jane", $options: "i" } }` | Last resort; can be slow |
| `$exists` | `{ ssoEnforced: { $exists: true } }` | Field present |
| `$or` / `$and` | `{ $or: [ { role: "admin" }, { role: "owner" } ] }` | |

Unindexed `$regex` on a large collection is how support takes prod down. Prefer exact ids from the HAR.

## ObjectId and dates

```javascript
ObjectId("66f1a2b3c4d5e6f7a8b9c0d1")
ISODate("2026-09-17T11:04:22Z")
```

If `userId` is stored as a string, `ObjectId(userId)` will not match. If `_id` is ObjectId, passing the hex string without `ObjectId(...)` will not match. This is a whole class of "the user doesn't exist" false negatives.

## Aggregation: `$match` → `$lookup` → `$group`

Keep pipelines short. `$match` first.

```javascript
db.invoices.aggregate([
  { $match: { tenantId: "tnt_acme", _id: "inv_9" } },
  {
    $lookup: {
      from: "users",
      localField: "customerUserId",
      foreignField: "_id",
      as: "customer"
    }
  },
  { $limit: 5 }
])
```

```javascript
db.events.aggregate([
  {
    $match: {
      tenantId: "tnt_acme",
      createdAt: { $gte: ISODate("2026-09-17T00:00:00Z") }
    }
  },
  { $group: { _id: "$type", n: { $sum: 1 } } },
  { $sort: { n: -1 } },
  { $limit: 20 }
])
```

`$lookup` is Mongo's join. It can be expensive. Filter both sides as tightly as you can.

## Counts

```javascript
db.users.countDocuments({ tenantId: "tnt_acme", deletedAt: null })
```

Avoid `count()` on huge unfiltered collections.

## `explain` as a gate

```javascript
db.events.find({ tenantId: "tnt_acme" }).limit(1).explain("queryPlanner")
```

If the planner says `COLLSCAN` on a hot collection and your filter is vague, stop. Same idea as SQL `EXPLAIN`.

## What to paste in the ticket

```text
db.users.find({ tenantId: "tnt_acme", _id: ObjectId("…") }, { role: 1, deletedAt: 1 })
→ 1 doc, role billing_admin, deletedAt null

db.invoices.find({ tenantId: "tnt_acme", _id: "inv_9" }, { status: 1 })
→ status: "disputed"
```

No password hashes, no API keys, no full nested tokens.

## When to escalate

Any write. Compact. Reindex. Change stream tricks. "Unset this flag in prod for the customer." That is a change-controlled runbook, not a support query.
