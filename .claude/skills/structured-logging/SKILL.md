---
description: Add structured logging and error tracking across route handlers, background functions, and webhooks (job id, org id, redacted PII), wired to an error monitor. Use when building the reliability surface or debugging generation.
---

# structured-logging

**Purpose:** Make the generation lifecycle traceable without leaking PII.

**Use when:** building handlers/background functions/webhooks or diagnosing issues.

## Inputs
- Log fields; redaction rules; log sink / error monitor.

## Procedure
1. Add a structured logger (e.g., `pino`) with fields: job id, org id, route, status; REDACT names/PII.
2. Log key lifecycle events: queued, generating, ready, failed, retried, refunded.
3. Wire an error monitor (e.g., Sentry) for exceptions.
4. Ensure logs are queryable across Netlify + Supabase.

## Output
- Logger util + monitoring integration; traceable generation flow.

## Dependencies
- Libraries: `pino` (or similar), Sentry SDK (optional). Skills: `async-job-orchestration`.

## References
- [Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/) · [Netlify logs](https://docs.netlify.com/build/functions/logs/) · [Supabase logs](https://supabase.com/docs/guides/telemetry/logs)

## Guardrails
- Redact child names and PII from logs. Never log secrets or full tokens.
