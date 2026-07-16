---
description: Establish the consistent { error: { code, message } } response shape, typed error classes, and safe client messaging across all handlers. Use when setting up error handling or adding endpoints.
---

# error-handling-standard

**Purpose:** Make errors consistent, typed, and safe to show users.

**Use when:** setting the error pattern or building any handler.

## Inputs
- Error taxonomy; user-facing copy rules.

## Procedure
1. Define typed error classes + codes (validation, auth, entitlement, upstream, internal).
2. Add a handler wrapper that maps errors to `{ error: { code, message } }` + correct HTTP status.
3. Never leak internals/stack traces to the client; log details server-side.
4. Provide friendly, human messages for user-facing failures.

## Output
- Shared error utilities + handler wrapper.

## Dependencies
- Skills: `create-api-route-handler` (consumer).

## References
- [Next.js error handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)

## Guardrails
- Never expose secrets, stack traces, or internal detail in client responses.
