---
description: Build the signature-verified, idempotent ElevenLabs generation-complete webhook that stores audio in Storage and flips songs.status to ready (or failed → retry/refund). Use when wiring generation completion.
---

# handle-elevenlabs-webhook

**Purpose:** Finish an async generation job when the engine calls back.

**Use when:** implementing the ElevenLabs completion webhook.

## Inputs
- Provider event; `ELEVENLABS_WEBHOOK_SECRET`; `engine_job_id`.

## Procedure
1. Verify signature; dedupe via `webhook_events`.
2. On success: download/store audio + cover in private Storage (`setup-storage-signed-urls`); set `songs.status='ready'`, `ready_at`, `duration_s`.
3. On failure: increment `retry_count`; retry (≤2) via `async-job-orchestration`; if exhausted, set `failed` and auto-refund/credit-back.
4. Notify the UI (Supabase Realtime). Return `200`.

## Output
- Stored audio, updated song row, realtime update; dedup guaranteed.

## Dependencies
- API: ElevenLabs. Skills: `setup-storage-signed-urls`, `webhook-idempotency-and-verification`, `async-job-orchestration`.

## References
- [ElevenLabs API ref](https://elevenlabs.io/docs/api-reference/introduction) · [Netlify Functions](https://docs.netlify.com/build/functions/overview/)

## Guardrails
- Idempotent: a replay must not create a duplicate song. Respect the strict status machine.
