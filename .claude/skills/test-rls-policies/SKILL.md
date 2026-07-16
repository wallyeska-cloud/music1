---
description: Automated tests asserting cross-org isolation — a user in org A can never read/write org B's rows — by running queries as different roles/JWTs. Use whenever RLS or tenancy changes. Security regression guard.
---

# test-rls-policies

**Purpose:** Guarantee tenant isolation never regresses.

**Use when:** RLS policies or the tenancy model change.

## Inputs
- Tables + policies; two seeded test orgs.

## Procedure
1. Seed two orgs with distinct users/rows.
2. Authenticate as org A; attempt to read/write org B's rows — assert denial.
3. Assert org A can access its own rows.
4. Cover every tenant table; run as part of CI.

## Output
- Passing isolation tests + a regression guard.

## Dependencies
- Skills: `add-rls-policies`, `enforce-org-multitenancy`, `seed-test-data`. Supabase MCP (`execute_sql` as roles) when available.

## References
- [Testing RLS](https://supabase.com/docs/guides/database/postgres/row-level-security#testing-policies)

## Guardrails
- A failing isolation test blocks release. Never skip this suite.
