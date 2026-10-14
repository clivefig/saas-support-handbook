# Architecture (template)

Replace every `TODO` with this product. Keep it to one screen. Support needs a map, not a design doc.

## What customers think the product is

TODO: one paragraph.

## Moving parts

| Piece | Public hostname (if any) | Notes for support |
| --- | --- | --- |
| Web app | TODO | SPA / SSR / both |
| API | TODO | REST / GraphQL / both |
| Auth | TODO | Session cookie, JWT, SSO IdP |
| Workers / jobs | TODO | Exports, webhooks, billing |
| Data store | TODO | Postgres / Mongo / both; region |
| Files | TODO | S3-compatible? |
| CDN / WAF | TODO | Whose 403/502 page the customer sees |

## Tenancy

- Tenant key in the API: TODO (`org_id`, `tenantId`, subdomain, …)
- Tenant key in the database: TODO
- Regions / pods: TODO (how a customer knows which they are on)

## Environments

| Name | Used for | Support access |
| --- | --- | --- |
| Production | TODO | Read-only? Impersonation? |
| Staging | TODO | |
| EU / other | TODO | |

## Where this map is wrong on purpose

TODO: known simplifications so people do not over-trust it.

## Related craft

- [Evidence standard](/guide/evidence)
- [Observability](/tools/observability)
