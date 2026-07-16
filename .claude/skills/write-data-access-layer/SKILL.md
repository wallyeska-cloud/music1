---
description: Create typed CRUD query/mutation helpers for an entity, wrapping the Supabase client with generated types and consistent error handling. Use when a feature needs to read/write a table from app code.
---

# write-data-access-layer

**Purpose:** Provide a clean, typed data layer so route handlers and components never touch raw Supabase queries ad hoc.

**Use when:** an entity needs reusable read/write helpers.

## Inputs
- Entity name; required queries (from API spec §5); pagination needs.

## Procedure
1. Create `lib/data/<entity>.ts`.
2. Write typed functions (list/get/create/update) using `lib/database.types.ts`.
3. Return the consistent `{ error: { code, message } }` shape on failure (see `error-handling-standard`).
4. Keep RLS in force (use the user-scoped client, not the service role, for user requests).
5. Add unit tests.

## Output
- `lib/data/<entity>.ts` + unit tests.

## Dependencies
- Libraries: `@supabase/supabase-js`, `zod`.
- Skills: `apply-migration-and-generate-types`, `error-handling-standard`.

## References
- [Supabase JS client](https://supabase.com/docs/reference/javascript)

## Guardrails
- Never use the service-role client to satisfy a normal user request (it bypasses RLS).
