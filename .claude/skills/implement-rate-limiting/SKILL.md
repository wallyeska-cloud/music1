---
description: Add per-IP / per-user / global rate limits, especially on the free-preview and generation endpoints, with graceful degradation. Use to protect cost-sensitive endpoints from abuse.
---

# implement-rate-limiting

**Purpose:** Prevent abuse and runaway COGS on expensive endpoints.

**Use when:** exposing preview/generation or other abusable endpoints.

## Inputs
- Endpoint; limits (per hour/day); identity key (IP / user / anon id).

## Procedure
1. Add a limiter middleware keyed by IP + user/anon id.
2. Apply the strictest limits to `POST /api/previews` (top COGS-control lever) and generation endpoints.
3. Add a global daily preview budget with graceful degradation.
4. Return `429` with a retry hint.
5. Start simple (DB/in-memory counters); adopt Upstash Redis when traffic warrants.

## Output
- Reusable limiter + 429 responses.

## Dependencies
- Library: `@upstash/ratelimit` + Upstash Redis (when needed). Skills: `create-api-route-handler`.

## References
- [Upstash Ratelimit](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview) · [Netlify edge middleware](https://docs.netlify.com/build/edge-functions/overview/)

## Guardrails
- The free preview is the #1 abuse/cost surface — never ship it unlimited.
