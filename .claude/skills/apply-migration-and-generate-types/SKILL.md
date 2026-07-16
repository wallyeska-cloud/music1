---
description: Apply pending Supabase migrations to a target environment and regenerate TypeScript types so DB schema and code stay in sync. Use right after writing a migration.
---

# apply-migration-and-generate-types

**Purpose:** Apply migrations and regenerate typed bindings so code can't drift from the schema.

**Use when:** a migration has been written and needs applying (local/staging).

## Inputs
- Pending migration files; target environment.

## Procedure
1. Apply: `supabase db push` (or Supabase MCP `apply_migration`).
2. Regenerate types: `supabase gen types typescript` → `lib/database.types.ts`.
3. Verify the app typechecks against the new types.
4. Run advisors (Supabase MCP `get_advisors`) to catch security/perf issues.

## Output
- Applied schema + regenerated `lib/database.types.ts`.

## Dependencies
- CLI: `supabase`. Supabase MCP (`apply_migration`, `generate_typescript_types`).
- Skills: `create-supabase-migration`.

## References
- [Generating types](https://supabase.com/docs/guides/api/rest/generating-types) · [Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp)

## Guardrails
- Never apply directly to production without approval (that's devops-agent + human sign-off).
