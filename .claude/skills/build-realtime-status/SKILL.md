---
description: Build the "creating your song…" anticipation state that auto-updates from queued/generating to ready via Supabase Realtime (polling fallback), with designed on-brand progress copy. Use for the post-submit waiting experience.
---

# build-realtime-status

**Purpose:** Make the generation wait feel exciting and never look broken.

**Use when:** building the post-submit / pre-ready UI.

## Inputs
- Song id; status stream.

## Procedure
1. Subscribe to the `songs` row via Supabase Realtime; fall back to TanStack Query polling.
2. Show a designed progress experience (playful copy, rough time expectation) — not a bare spinner.
3. Auto-transition to the reveal when `ready`; show a friendly failure + auto-refund note on `failed`.
4. No manual refresh required.

## Output
- A live-updating status component.

## Dependencies
- Libraries: `@supabase/supabase-js` (Realtime), TanStack Query. Skills: `async-job-orchestration`.

## References
- [Supabase Realtime](https://supabase.com/docs/guides/realtime) · [TanStack Query](https://tanstack.com/query/latest)

## Guardrails
- The wait is a designed feature. Never leave the user staring at a spinner with no feedback.
