---
description: Author a forward-only Supabase SQL migration for a schema change (table, column, enum, constraint, index) matching PRD §4. Use whenever persistence needs to change. Pairs with add-rls-policies and apply-migration-and-generate-types.
---

# create-supabase-migration

**Purpose:** Write a versioned, reviewable SQL migration implementing the PRD §4 schema with proper constraints and indexes.

**Use when:** adding/altering tables, columns, enums, constraints, or indexes.

## Inputs
- Table/field spec (PRD §4.2); relationships; validation rules (§4.5); index needs (§4.4).

## Procedure
1. `supabase migration new <name>`.
2. Write DDL: `NOT NULL`/FKs; enums or CHECK constraints for status/type/role/kind fields; the status machine for `songs`.
3. Add validation CHECKs (age 0–18, length caps, `amount_cents > 0`).
4. Add indexes from PRD §4.4.
5. Ensure every tenant table has `org_id NOT NULL` (RLS added via `add-rls-policies`).
6. Keep it forward-only; never edit an already-applied migration.

## Output
- A timestamped `.sql` file in `supabase/migrations/`.

## Dependencies
- CLI: `supabase` + local Docker Postgres. Supabase MCP (`apply_migration`) optional.
- Skills: `add-rls-policies` (paired), `apply-migration-and-generate-types` (follow-up).

## References
- [Supabase local dev/migrations](https://supabase.com/docs/guides/local-development) · [PostgreSQL DDL](https://www.postgresql.org/docs/current/ddl.html)

## Guardrails
- Additive by default. DESTRUCTIVE changes (drop/rename/type change/backfill) require human approval and an expand/contract plan.
