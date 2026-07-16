---
description: Generate deterministic seed data (orgs, profiles, subjects, songs in each status) for local dev and E2E tests. Use when setting up a testable local environment.
---

# seed-test-data

**Purpose:** Provide reproducible fixtures so dev and tests run against known data.

**Use when:** setting up local dev or E2E test prerequisites.

## Inputs
- Desired personas/fixtures; volume; the two test orgs needed for RLS isolation tests.

## Procedure
1. Create `supabase/seed.sql` (or a seed script).
2. Insert two orgs + members, a few subjects, and songs across statuses (`queued`, `generating`, `ready`, `failed`).
3. Keep IDs deterministic so tests can reference them.
4. Wire into `supabase db reset` / local startup.

## Output
- `supabase/seed.sql` or seed script.

## Dependencies
- CLI: `supabase db seed`. Skills: `create-supabase-migration`.

## References
- [Supabase seeding](https://supabase.com/docs/guides/local-development/seeding-your-database)

## Guardrails
- Seed data is for non-production only. Never seed real user PII.
