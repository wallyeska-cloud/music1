---
description: Create Stripe Checkout sessions for single-song and credit-pack SKUs, server-side, returning the hosted checkout URL. Use when building the purchase flow. Never trust client-sent amounts.
---

# integrate-stripe-checkout

**Purpose:** Start a secure hosted payment for a song or credit pack.

**Use when:** implementing purchase/checkout.

## Inputs
- SKU/price id; buyer + org; optional `brief_id`.

## Procedure
1. Look up the price/product server-side by SKU (never accept an amount from the client).
2. Create a Checkout Session; attach metadata (`org_id`, `brief_id`, `sku`).
3. Insert a `pending` `orders` row.
4. Return `checkout_url`; the outcome is confirmed later by `handle-stripe-webhook`.

## Output
- `checkout_url` + a pending order.

## Dependencies
- Library: `stripe`. API: Stripe (`STRIPE_SECRET_KEY`, publishable key).
- Skills: `handle-stripe-webhook`, `create-api-route-handler`.

## References
- [Stripe Checkout](https://docs.stripe.com/payments/checkout) · [Stripe Node SDK](https://docs.stripe.com/api?lang=node)

## Guardrails
- Prices come from Stripe, never the client. Escalate any pricing/SKU change to the human.
