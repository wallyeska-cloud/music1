---
description: Enforce per-user/day generation caps, a global daily preview budget, and a hard ElevenLabs spend cap with alerting that pauses generation if exceeded. Use to keep COGS bounded. Cost control is a feature.
---

# implement-cost-controls

**Purpose:** Make it impossible for a bug or abuser to run up the engine bill.

**Use when:** building the generation path or reviewing cost exposure.

## Inputs
- Cap thresholds (per-user/day, global preview budget, hard spend cap); alert channel.

## Procedure
1. Enforce a per-user/day generation cap in the generation path.
2. Enforce the global daily preview budget.
3. Track estimated ElevenLabs spend; enforce a hard spend cap that PAUSES generation and alerts ops when exceeded.
4. Wire alerting (log + notification) on cap breaches.

## Output
- Cap checks + spend tracking + alerting.

## Dependencies
- Skills: `async-job-orchestration`, `implement-rate-limiting`, `structured-logging`. API: ElevenLabs usage.

## References
- [Supabase cost control](https://supabase.com/docs/guides/platform/cost-control) · [ElevenLabs pricing](https://elevenlabs.io/pricing/api)

## Guardrails
- Escalate cap VALUE changes to the human (cost/UX impact). Never remove the hard spend cap.
