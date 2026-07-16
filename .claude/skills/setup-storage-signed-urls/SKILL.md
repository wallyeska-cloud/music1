---
description: Configure private Supabase Storage buckets for audio/cover art and produce short-lived signed URLs for playback/download. Use for any media storage or delivery. Never expose raw storage paths.
---

# setup-storage-signed-urls

**Purpose:** Store generated media privately and serve it via expiring signed URLs.

**Use when:** storing or delivering audio/cover art.

## Inputs
- Bucket names; object path; expiry.

## Procedure
1. Create PRIVATE Storage buckets (not public) for audio and covers.
2. Write an upload helper (server-side) used by the ElevenLabs webhook.
3. Write `getSignedUrl(path, expiry)` for playback/download.
4. Gate downloads behind `implement-entitlements-check`.

## Output
- Upload helper + signed-URL helper; entitlement-gated download.

## Dependencies
- Library: `@supabase/supabase-js`. Skills: `implement-entitlements-check`.

## References
- [Supabase Storage](https://supabase.com/docs/guides/storage) · [Signed URLs](https://supabase.com/docs/guides/storage/serving/downloads#signed-urls)

## Guardrails
- Buckets stay private; only short-lived signed URLs are exposed. Never leak a raw storage path or owner PII.
