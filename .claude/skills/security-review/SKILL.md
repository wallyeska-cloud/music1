---
description: Pre-launch security checklist pass — RLS coverage, no client-exposed secrets, signed-URL enforcement, webhook verification, rate/spend caps, moderation coverage, and adult-only/COPPA-awareness terms. Use before any launch/production milestone. Read-only audit.
---

# security-review

**Purpose:** Gate launch on a concrete security checklist.

**Use when:** approaching a launch/production milestone or after security-relevant changes.

## Inputs
- Codebase + PRD §6.2.

## Procedure
Audit and report pass/fail with evidence for each:
1. RLS on every tenant table; no cross-org leakage; no trusted client `org_id`.
2. No secrets client-side (only `NEXT_PUBLIC_*`); service-role/vendor keys server-only.
3. Private media + signed URLs; entitlement-gated downloads.
4. Every webhook signature-verified + idempotent.
5. Rate limits on preview/generation; hard spend cap; no paid generation before payment.
6. Moderation on user text AND generated lyrics, with logging.
7. Terms: accounts adults 18+; COPPA-awareness respected.
8. Run Supabase advisors (read-only) if available.

## Output
- Prioritized findings (severity, file:line, fix) routed to owners; a launch GO / NO-GO.

## Dependencies
- Skills: `add-rls-policies`, `manage-env-secrets`, `implement-cost-controls`, `integrate-content-moderation`. Bundled `/security-review`.

## References
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) · [Supabase security](https://supabase.com/docs/guides/database/secure-data)

## Guardrails
- Read-only: report, don't fix. Unresolved critical/high findings block launch. Legal/COPPA questions escalate to the human.
