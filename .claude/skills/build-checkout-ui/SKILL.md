---
description: Build the purchase UI (single song + credit pack) that calls the checkout endpoint and redirects to Stripe Checkout, with success/cancel handling. Use for the buy flow.
---

# build-checkout-ui

**Purpose:** Give a simple, trustworthy path to pay.

**Use when:** building the purchase/checkout UI.

## Inputs
- SKU/pricing; brief context.

## Procedure
1. Present SKUs (single song, credit pack).
2. On buy, call `POST /api/checkout`; redirect to the returned Stripe Checkout URL.
3. Handle return URLs (success/cancel); reflect entitlement state after payment confirms.

## Output
- Checkout components + return handling.

## Dependencies
- Library: `@stripe/stripe-js`. Skills: `integrate-stripe-checkout`.

## References
- [Stripe.js](https://docs.stripe.com/js) · [Checkout redirect](https://docs.stripe.com/payments/checkout/how-checkout-works)

## Guardrails
- Never compute or trust prices client-side; the server + Stripe own pricing.
