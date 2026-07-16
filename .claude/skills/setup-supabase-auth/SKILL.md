---
description: Configure Supabase Auth in Next.js — email magic link, Google/Apple OAuth, anonymous sign-in — with SSR session handling and protected-route middleware. Use when setting up or changing authentication.
---

# setup-supabase-auth

**Purpose:** Stand up low-friction authentication with SSR sessions.

**Use when:** implementing sign-in/up, OAuth, anonymous auth, or session middleware.

## Inputs
- Enabled providers; redirect URLs; session strategy.

## Procedure
1. Enable providers in Supabase (magic link + Google/Apple OAuth + anonymous).
2. Wire `@supabase/ssr` server/client helpers and Next.js middleware for session refresh.
3. Add protected-route guards for authed pages/handlers.
4. Verify sign-in, sign-out, and anonymous session flows.

## Output
- Working auth + session handling + protected-route middleware.

## Dependencies
- Libraries: `@supabase/ssr`, `@supabase/supabase-js`. APIs: Google/Apple OAuth apps.
- Skills: `scaffold-project`, `manage-env-secrets`.

## References
- [Supabase Auth](https://supabase.com/docs/guides/auth) · [Next.js SSR auth](https://supabase.com/docs/guides/auth/server-side/nextjs) · [Anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous)

## Guardrails
- Keep signup fields minimal (conversion matters). Accounts are for adults 18+. Secrets stay server-side.
