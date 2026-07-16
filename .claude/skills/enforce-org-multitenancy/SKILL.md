---
description: Implement org-based multitenancy — auto-create a personal organization and owner membership on signup, plus the is_org_member/has_org_role SQL helpers used by all RLS. Foundational; do this before RLS on tenant tables.
---

# enforce-org-multitenancy

**Purpose:** Establish the tenancy primitives every tenant table and RLS policy depends on.

**Use when:** setting up the tenancy model, before adding RLS to tenant tables.

## Inputs
- PRD §4.1 tenancy rules.

## Procedure
1. Create a signup trigger/function that inserts a personal `organization` (`type='personal'`) and an `owner` `membership` for the new `auth.users` row.
2. Set `profiles.default_org_id` to that org.
3. Create SQL helpers `is_org_member(org_id)` and `has_org_role(org_id, role)` (SECURITY DEFINER, membership lookup).
4. Establish the invariant: every tenant table has `org_id NOT NULL`.

## Output
- Signup trigger, membership creation, and the RLS helper functions.

## Dependencies
- Skills: `create-supabase-migration`, `add-rls-policies`, `setup-supabase-auth`.

## References
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) · [Postgres triggers](https://www.postgresql.org/docs/current/plpgsql-trigger.html)

## Guardrails
- Consumer UI never mentions "organizations." Escalate any change to the access model to the human.
