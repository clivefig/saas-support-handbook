# OAuth errors

OAuth 2.0 failures often **do not look like your API error JSON**. They show up as query parameters on a redirect, as form-encoded bodies, or as `WWW-Authenticate` on 401.

Primary spec: [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749). Token errors: [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750).

## What the customer sees

- SSO button spins and returns to login
- "Access denied" on the identity provider
- Connected-app integrations (Google, Slack, HubSpot, custom OIDC) show `invalid_grant`
- API calls 401 after a weekend (refresh token expired)

## Authorization-endpoint errors (browser redirect)

The IdP redirects back with:

```text
https://app.example.com/oauth/callback?error=access_denied&error_description=User%20denied
```

| `error` | Meaning | Support move |
| --- | --- | --- |
| `invalid_request` | Missing/duplicate param, bad redirect URI encoding | Compare redirect URI **character for character** with the app config |
| `unauthorized_client` | This client may not use this grant | Client id used in the wrong environment (prod id on staging) |
| `access_denied` | User or IdP policy refused | User clicked cancel, or admin did not grant the app |
| `unsupported_response_type` | Client asked for the wrong flow | Integration following the wrong OAuth tutorial |
| `invalid_scope` | Scope string unknown or not allowed | App requested `admin` and the customer tenant forbids it |
| `server_error` | IdP 500 equivalent (cannot use HTTP 500 on a redirect) | IdP incident |
| `temporarily_unavailable` | IdP overloaded (503 equivalent) | Retry; status page of the IdP |

`error_description` is optional prose. `error` is the code you search.

**2-minute check:** Capture HAR with Preserve log. Find the redirect chain. Copy `error` and the `redirect_uri` used. Confirm the callback URL in the IdP console matches including `http` vs `https` and trailing slash.

## Token-endpoint errors (`POST /oauth/token`)

Body is often `application/x-www-form-urlencoded` on the way in and JSON on the way out:

```json
{
  "error": "invalid_grant",
  "error_description": "Authorization code expired"
}
```

| `error` | Meaning | Support move |
| --- | --- | --- |
| `invalid_request` | Missing `grant_type`, bad encoding | Inspect the integration |
| `invalid_client` | Client id/secret wrong | Staging secret in prod; rotated secret |
| `invalid_grant` | Code used twice, expired, or redirect URI mismatch on exchange | Codes are **one-time**. Retrying the same code always fails |
| `unauthorized_client` | Grant type not allowed for this client | |
| `unsupported_grant_type` | e.g. asking for password grant when disabled | |
| `invalid_scope` | Same as above | |

**Classic ticket:** "SSO worked yesterday, today `invalid_grant`." The authorization code was consumed by the first callback and their app retried. Look for two `POST /token` in the HAR.

## Resource-server 401 (`invalid_token`)

[RFC 6750](https://www.rfc-editor.org/rfc/rfc6750#section-3.1):

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="api", error="invalid_token", error_description="The access token expired"
```

| `error` | Meaning |
| --- | --- |
| `invalid_request` | Malformed `Authorization` header |
| `invalid_token` | Expired, revoked, wrong audience/issuer, bad signature |
| `insufficient_scope` | Token valid but missing a required scope — closer to 403 |

**2-minute check:** Is there a Bearer token? Decode the JWT **locally** (expiry `exp`, audience `aud`, issuer `iss`). Do not paste production tokens into public decoder websites.

Clock skew of a few minutes can expire a token that "just issued."

## What to ask

- Which identity provider (Okta, Azure AD, Google, Auth0, in-house)
- Exact `error` and `error_description`
- Whether this is login SSO or a connected integration
- HAR of the login, Preserve log on

## When to escalate

- Redirect URI is correct and still `invalid_grant` for fresh codes
- Signing key / JWKS rotation coincided with a fleet of `invalid_token`
- IdP `server_error` that is actually our callback throwing

Customer-facing: "Your identity provider refused the login (`access_denied`)" is different from "our API rejected an expired access token." Do not merge those stories.
