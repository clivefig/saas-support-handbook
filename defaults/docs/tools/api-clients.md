# API clients

Use an API client when the UI is in the way: you need headers, a raw body, a different environment, or a replay of one call from a HAR.

## Tools that earn a place

| Tool | Why support uses it | Watch-outs |
| --- | --- | --- |
| [Postman](https://www.postman.com/) | Collections, environments, auth helpers, easy sharing of *non-secret* examples | Cloud workspaces can sync real tokens if you are sloppy |
| [Bruno](https://www.usebruno.com/) | Git-friendly collections, local-first | Team must agree on the repo layout |
| [Insomnia](https://insomnia.rest/) | Fast REST/GraphQL client | Same secret-hygiene problem as any GUI |
| `curl` / `Invoke-RestMethod` | Lowest common denominator; pasteable into a ticket (redacted) | Easy to forget `-v` and miss headers |

You do not need all of them. You need **one GUI** and **one CLI**.

## How to replay a failing call

1. In the HAR or Network panel, identify method, URL, query, and body. See [Network](/browser/network).
2. Copy as `curl` from DevTools if you can, then **strip** `Cookie` and `Authorization`.
3. Put the token back from a **safe** source: your own test tenant, a support impersonation flow that is audited, or a short-lived debug token. Never from the customer's HAR into a cloud collection.
4. Send. Compare status, body, and latency to the HAR.

If the replay succeeds with your token and fails with theirs, you are in auth/permissions, not in "the endpoint is down."

## `curl` you can actually read

```bash
curl -sS -D - -o body.json \
  -X GET "https://api.example.com/v1/invoices/inv_9" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $SUPPORT_TEST_TOKEN"
```

`-D -` prints response headers to stdout. Status and `x-request-id` live there. Then open `body.json`.

PowerShell:

```powershell
$headers = @{ Authorization = "Bearer $env:SUPPORT_TEST_TOKEN"; Accept = "application/json" }
Invoke-RestMethod -Method GET -Uri "https://api.example.com/v1/invoices/inv_9" -Headers $headers
```

## Collections vs one-off

Keep a **test-tenant** collection (staging or a dedicated support org). Do not keep production customer tokens in the collection. Environment variables named `prod_customer_token` are an incident waiting to happen.

GraphQL: use the client's GraphQL mode or POST to `/graphql` with a JSON body. HTTP 200 is not success. See [GraphQL errors](/errors/graphql).
