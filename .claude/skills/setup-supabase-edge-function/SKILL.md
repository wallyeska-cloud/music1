---
description: Scaffold and deploy a Supabase Edge Function (Deno/TS) for webhook receivers or async work kept off the sync request path. Use when adding a webhook endpoint or background job on Supabase.
---

# setup-supabase-edge-function

**Purpose:** Run webhook/async logic off the Netlify sync budget.

**Use when:** adding a webhook receiver or async job on Supabase.

## Inputs
- Function name; trigger; required secrets.

## Procedure
1. `supabase functions new <name>` under `supabase/functions/`.
2. Implement the handler (Deno/TS); verify signatures for webhooks.
3. Set function secrets; deploy (`supabase functions deploy` or Supabase MCP `deploy_edge_function`).
4. Wire the provider (Stripe/ElevenLabs) to the function URL.

## Output
- A deployed edge function.

## Dependencies
- CLI: `supabase functions`. Supabase MCP (`deploy_edge_function`) when available.

## References
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

## Guardrails
- Webhook functions must verify signatures and be idempotent (see webhook-idempotency-and-verification).
