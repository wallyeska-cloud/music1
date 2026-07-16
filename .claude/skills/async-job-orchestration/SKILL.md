---
description: Implement the fire-and-forget song-generation lifecycle — sync handler creates a queued song and returns 202, a background/edge function runs generation, the webhook flips to ready, with retries then auto-refund on failure. Use for the generation pipeline. The core reliability surface.
---

# async-job-orchestration

**Purpose:** Run generation without ever blocking a sync request, with a strict, recoverable lifecycle.

**Use when:** building or changing the generation pipeline.

## Inputs
- Brief id; entitlement; the status machine `queued→generating→ready|failed`.

## Procedure
1. Sync handler: verify entitlement, create a `songs` row (`queued`), return `202` immediately.
2. Kick off work in a Netlify Background Function / Supabase Edge Function (never await the full song on the request thread).
3. Call `generateSong()`; set `generating`.
4. On webhook completion: `ready`. On failure: `retry_count++`, retry ≤2, then `failed` + auto-refund.
5. Enforce legal status transitions only.

## Output
- An orchestrated, retry-safe pipeline honoring the status machine.

## Dependencies
- Skills: `integrate-elevenlabs-music`, `handle-elevenlabs-webhook`, `implement-entitlements-check`. Infra: Netlify Background / Supabase Edge Functions.

## References
- [Netlify Background Functions](https://docs.netlify.com/build/functions/background-functions/) · [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

## Guardrails
- NEVER await a full generation on a sync request. Sync cap is 10s (free)/26s (Pro). Escalate any deviation from the async pattern.
