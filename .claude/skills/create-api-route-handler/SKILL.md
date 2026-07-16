---
description: Scaffold a typed REST Route Handler matching PRD §5 — Zod-validated request/response, auth-level enforcement, consistent error shape, correct status codes. Use for any app/api/* endpoint.
---

# create-api-route-handler

**Purpose:** Produce a consistent, validated, auth-guarded API endpoint.

**Use when:** adding or changing an `app/api/*` route.

## Inputs
- Endpoint spec (path, method, auth level, request/response schema) from PRD §5.

## Procedure
1. Create `app/api/.../route.ts`.
2. Parse + validate input with a shared Zod schema (`lib/schemas/`).
3. Enforce the auth level: Public / User / Owner (RLS) / Service (signature).
4. Call the relevant data-access or integration helper — don't inline vendor/DB logic.
5. Return typed output + correct status; errors use `{ error: { code, message } }`.
6. Add a test.

## Output
- A validated route handler + test.

## Dependencies
- Libraries: `zod`, `@supabase/ssr`. Skills: `write-zod-schemas`, `error-handling-standard`.

## References
- [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

## Guardrails
- Never skip validation or auth. Long-running work (generation) returns 202 and runs async — never block the request thread.
