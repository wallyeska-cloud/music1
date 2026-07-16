---
description: Write and verify Row-Level Security policies so rows are only visible/editable to members of the owning org. Use for every user-facing table, and whenever access rules change. Security-critical.
---

# add-rls-policies

**Purpose:** Enforce org-scoped isolation at the database so a user can only touch their org's rows.

**Use when:** any user-facing table is created or its access rules change.

## Inputs
- Table name; access rules (owner/admin/member); public-read exceptions (e.g., gift links via slug).

## Procedure
1. `ALTER TABLE <t> ENABLE ROW LEVEL SECURITY;`
2. Write `CREATE POLICY` for select/insert/update/delete using `is_org_member(org_id)` / `has_org_role(org_id, role)`.
3. For public reveal pages, scope a narrow read policy by unguessable slug only — never expose owner PII.
4. Never trust a client-supplied `org_id`; derive from membership.
5. Request a cross-org isolation test from `test-rls-policies`.

## Output
- RLS enable + policies in a migration; an isolation test proving org A cannot read/write org B.

## Dependencies
- Skills: `enforce-org-multitenancy` (defines helpers), `test-rls-policies`.

## References
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)

## Guardrails
- No user-facing table ships without RLS. Never weaken a policy for convenience — escalate access-model changes to the human.
