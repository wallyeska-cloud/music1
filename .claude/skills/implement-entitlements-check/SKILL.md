---
description: Server-side guard that verifies an org has the required entitlement (song credit / HD download / regeneration) before a paid action and decrements it atomically. Use before any generation, download, or regeneration. Money + concurrency critical.
---

# implement-entitlements-check

**Purpose:** Ensure paid actions require and consume a valid entitlement, race-safely.

**Use when:** gating generation, HD download, or regeneration.

## Inputs
- Org id; entitlement kind (`song_credit`|`hd_download`|`regeneration`); action.

## Procedure
1. Implement `assertEntitlement(orgId, kind)` that checks `entitlements.balance > 0`.
2. Decrement ATOMICALLY — use a Postgres function/RPC with row lock (`SELECT ... FOR UPDATE`) or a conditional `UPDATE ... WHERE balance > 0 RETURNING`.
3. Fail closed: if no entitlement, block the action and return a clear error.
4. Grant entitlements only from the confirmed Stripe webhook (see `handle-stripe-webhook`).
5. Unit-test the concurrent-decrement path (no double-spend).

## Output
- A reusable, race-safe entitlement guard.

## Dependencies
- Skills: `handle-stripe-webhook` (grants), `write-data-access-layer`. Postgres functions/RPC.

## References
- [Postgres functions/RPC](https://supabase.com/docs/guides/database/functions)

## Guardrails
- Never allow a paid action without a confirmed entitlement. Never grant entitlements from client input — only from verified payment events.
