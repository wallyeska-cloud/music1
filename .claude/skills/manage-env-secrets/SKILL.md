---
description: Standardize environment variables and secrets — maintain .env.example (names only), wire Netlify env + Supabase Vault, and assert no secret is client-exposed. Use when adding config/secrets. Security-sensitive.
---

# manage-env-secrets

**Purpose:** Keep secrets server-side and configuration consistent.

**Use when:** adding or auditing env vars/secrets.

## Inputs
- Required var names (CLAUDE.md §6).

## Procedure
1. Maintain `.env.example` with NAMES ONLY (no values).
2. Wire Netlify env vars + Supabase Vault for server secrets.
3. Assert only `NEXT_PUBLIC_*` is exposed to the browser; everything else server-only.
4. Add a check/lint that flags a secret referenced in client code.

## Output
- Documented env matrix + a leak check.

## Dependencies
- Skills: `scaffold-project`, `security-review`.

## References
- [Netlify env vars](https://docs.netlify.com/build/environment-variables/overview/) · [Supabase Vault](https://supabase.com/docs/guides/database/vault)

## Guardrails
- Never commit secret values. The service-role and vendor keys must never reach the client.
