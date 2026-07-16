---
description: Write Playwright end-to-end tests for the critical create → pay → reveal → share flow, using Stripe test mode and mocked/stubbed generation. Use before merges/deploys and when the money path changes.
---

# write-e2e-tests

**Purpose:** Prove the revenue and reveal path works end to end.

**Use when:** the create/pay/reveal/share flow changes, or before a release.

## Inputs
- Flow steps; seed fixtures.

## Procedure
1. Seed deterministic data (`seed-test-data`).
2. Drive: wizard → checkout (Stripe test mode) → generation (mocked/stubbed webhook) → reveal → create + open a share link.
3. Assert the money path and the reveal render.
4. Keep it deterministic — no live external calls.

## Output
- `e2e/*.spec.ts` covering the critical path.

## Dependencies
- Library: `@playwright/test`. API: Stripe test mode. Skills: `seed-test-data`, `build-checkout-ui`, `build-reveal-player`.

## References
- [Playwright](https://playwright.dev/docs/intro) · [Stripe testing](https://docs.stripe.com/testing)

## Guardrails
- Never run E2E against production or live billing. Mock generation; use Stripe test keys.
