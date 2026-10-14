---
layout: home
hero:
  name: The SaaS Support Handbook
  text: Train, then look it up.
  tagline: The definitive craft book for SaaS support teams — HTTP and API errors, HAR files, SQL, MongoDB, and the evidence standard that turns a ticket into a diagnosis.
  actions:
    - theme: brand
      text: Start training
      link: /training/
    - theme: alt
      text: Look up HTTP errors
      link: /errors/http
    - theme: alt
      text: Capture a HAR
      link: /browser/har
features:
  - title: Evidence before opinion
    details: Timestamp, tenant, user, request ID, HAR, console, expected vs actual. If you cannot attach those, you do not yet have a bug report.
  - title: Status codes that lie
    details: 401 is not 403. 502 is not 504. GraphQL can return HTTP 200 with errors. This book teaches the difference that changes the next step.
  - title: Queries that do not wreck prod
    details: Read-only SQL and MongoDB patterns support actually uses — filters, joins, JSON, ObjectId — with hard stops before UPDATE.
  - title: Public craft, private product
    details: The published site is product-agnostic. Product runbooks stay in a private build so secrets never ship with the handbook.
---
