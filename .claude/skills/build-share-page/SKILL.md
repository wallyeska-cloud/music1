---
description: Build the public, no-auth reveal page for a gift-link slug with rich OpenGraph tags, a signed stream, no owner PII, and a "make one too" CTA. Use for the shareable gift experience. Growth-critical.
---

# build-share-page

**Purpose:** Let family hear the song instantly from a link, and fuel the word-of-mouth loop.

**Use when:** building the public share/reveal page.

## Inputs
- Public `gift_links` slug.

## Procedure
1. SSR public route resolving the slug (respect `revoked`).
2. Rich OpenGraph meta (title, cover) for link unfurling in texts/social.
3. Play via signed stream URL; expose NO owner PII and NO download rights.
4. Add a "make one too" CTA (viral loop). Increment `view_count`.
5. Support owner link revocation.

## Output
- Public reveal route + OG meta + viral CTA.

## Dependencies
- Skills: `setup-storage-signed-urls`, `create-api-route-handler`. Library: Next.js Metadata API.

## References
- [Next.js metadata / OG](https://nextjs.org/docs/app/building-your-application/optimizing/metadata) · [Open Graph](https://ogp.me/)

## Guardrails
- Public page must never leak owner PII, secrets, or download entitlement. Plays instantly, no account/install.
