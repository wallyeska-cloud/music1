---
description: Reusable pattern for verifying provider signatures and deduping events via the webhook_events table — shared by all webhook handlers. Use when building or hardening any webhook receiver. Correctness-critical.
---

# webhook-idempotency-and-verification

**Purpose:** Guarantee every webhook is authentic and processed exactly once.

**Use when:** building any webhook receiver (Stripe, ElevenLabs).

## Inputs
- Provider; webhook secret; the event-id path in the payload.

## Procedure
1. Verify the provider signature; reject unsigned/invalid immediately.
2. Insert `(provider, provider_event_id)` into `webhook_events` with a UNIQUE constraint; if it already exists, treat as a replay and no-op.
3. Only then run the handler's side effects.
4. Expose a shared `verifyAndDedupe()` helper used by all handlers.

## Output
- A shared verify+dedupe helper guaranteeing single-effect processing.

## Dependencies
- Skills: `handle-stripe-webhook`, `handle-elevenlabs-webhook`. Provider SDKs.

## References
- [Stripe signatures](https://docs.stripe.com/webhooks/signature)

## Guardrails
- No side effect before signature verification + dedup. This is mandatory for all webhooks.
