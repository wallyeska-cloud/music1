---
description: Build the internal ops view — jobs by status, failure rate, per-day generation counts, ElevenLabs spend estimate, and manual refund/credit tools. Use for operational monitoring and support. Can start as SQL/MCP before a built UI.
---

# build-admin-ops-dashboard

**Purpose:** Give operators visibility into generation health and cost, plus refund tools.

**Use when:** setting up ops monitoring or support tooling.

## Inputs
- Ops queries; admin auth.

## Procedure
1. Queries: jobs by status, failure rate, per-day generation counts, estimated ElevenLabs spend.
2. Manual actions: refund/credit-back (Stripe refunds + entitlement adjust).
3. Gate behind admin auth (org role `admin`).
4. MVP: start as a Supabase-MCP-driven query pack; graduate to a built UI when needed.

## Output
- Admin dashboard (or query pack) + refund actions.

## Dependencies
- Skills: `write-data-access-layer`, `implement-cost-controls`, `structured-logging`. Supabase MCP when available.

## References
- [Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp) · [Stripe refunds](https://docs.stripe.com/refunds)

## Guardrails
- Admin-only access. Refunds/credits are sensitive — log every action.
