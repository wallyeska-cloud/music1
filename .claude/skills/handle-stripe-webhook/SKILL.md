---
description: Build the signature-verified, idempotent Stripe webhook receiver that marks orders paid, grants entitlements, and (in pay-first mode) triggers generation. Use when wiring payment confirmation. Money-critical.
---

# handle-stripe-webhook

**Purpose:** Turn a confirmed payment into order state + entitlements, exactly once.

**Use when:** implementing the Stripe webhook endpoint.

## Inputs
- Stripe event; `STRIPE_WEBHOOK_SECRET`.

## Procedure
1. Verify the signature; reject unsigned/invalid.
2. Dedupe via `webhook_events` (see `webhook-idempotency-and-verification`) — replays have no double effect.
3. On `checkout.session.completed`: mark the `orders` row `paid`, grant the purchased `entitlements`.
4. In pay-first mode, trigger `async-job-orchestration` for the song.
5. Return `200` quickly; do heavy work async.

## Output
- Order → paid, entitlement granted, dedup guaranteed.

## Dependencies
- Library: `stripe`. Skills: `webhook-idempotency-and-verification`, `implement-entitlements-check`, `async-job-orchestration`.

## References
- [Stripe webhooks](https://docs.stripe.com/webhooks) · [Verify signatures](https://docs.stripe.com/webhooks/signature)

## Guardrails
- Never grant entitlements without a verified event. Idempotency is mandatory — no double grants/charges.
