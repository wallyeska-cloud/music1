---
description: Verify Stripe/ElevenLabs webhook handlers are signature-verified and idempotent — replayed events cause no double-charge, double-grant, or duplicate song. Use whenever webhook handling changes.
---

# test-webhook-idempotency

**Purpose:** Prove webhook replays and bad signatures are handled safely.

**Use when:** webhook receivers change.

## Inputs
- Sample + replayed events; webhook secrets.

## Procedure
1. Send a valid event; assert exactly one effect (order paid / entitlement granted / song created).
2. Replay the same event id; assert NO additional effect (dedup via `webhook_events`).
3. Send a bad signature; assert rejection.

## Output
- Tests asserting single-effect processing + signature rejection.

## Dependencies
- Skills: `handle-stripe-webhook`, `handle-elevenlabs-webhook`, `webhook-idempotency-and-verification`.

## References
- [Stripe test webhooks](https://docs.stripe.com/webhooks/test)

## Guardrails
- Idempotency and signature verification are mandatory; these tests must stay green.
