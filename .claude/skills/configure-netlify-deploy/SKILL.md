---
description: Configure Netlify for the Next.js app — netlify.toml, Next runtime, Functions + Background Functions, env var wiring, Deploy Previews. Use when setting up or changing hosting/deploy config.
---

# configure-netlify-deploy

**Purpose:** Make the app deployable on Netlify with previews and background functions.

**Use when:** setting up or changing deployment.

## Inputs
- Build command; function dirs; env var names.

## Procedure
1. Add `netlify.toml`; enable the Next.js runtime.
2. Configure Functions and Background Functions (15-min ceiling for async generation).
3. Wire env vars (names from CLAUDE.md §6); enable Deploy Previews per PR.
4. Verify a preview deploy builds and runs.

## Output
- Deployable Netlify config; preview-per-PR.

## Dependencies
- CLI: `netlify`. Netlify MCP when available. Skills: `manage-env-secrets`.

## References
- [Netlify Next.js runtime](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/) · [Netlify MCP](https://docs.netlify.com/build/build-with-ai/netlify-mcp-server/)

## Guardrails
- Background Functions need a paid plan; on free tier use the ElevenLabs-webhook + Supabase Edge Function path. Escalate production deploys and paid-plan upgrades.
