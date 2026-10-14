# Request IDs (template)

The join key from HAR → logs → traces. If this page is empty, every escalation takes an extra hour.

## Headers we emit

| Header | Set by | Appears on |
| --- | --- | --- |
| TODO e.g. `x-request-id` | TODO | API JSON / HTML |
| TODO e.g. `cf-ray` | CDN | All CDN responses |
| TODO e.g. `traceparent` | TODO | |

## How to copy one from the browser

1. Network → failing call → Headers.
2. Paste into the ticket **internal note**.
3. Search: TODO (Datadog query, CloudWatch Insights, Sentry tag).

Example search (sanitized):

```text
TODO: @request_id:req_xxx OR cf_ray:xxx
```

## When there is no request id

TODO: fallback (user id + exact UTC timestamp + route). That is slower; still better than nothing.

## Related craft

- [HAR files](/browser/har)
- [API error shapes](/errors/api)
