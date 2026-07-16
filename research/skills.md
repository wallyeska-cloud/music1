# Skills Inventory — EZE

**Prepared:** 2026-07-15
**Source:** derived from [`PRD.md`](./PRD.md), [`tech-stack.md`](./tech-stack.md), [`CLAUDE.md`](../.claude/CLAUDE.md)

## How to read this

Each entry is a candidate **Claude Code Skill** — a reusable, on-demand procedure stored at `.claude/skills/<name>/SKILL.md` (per the [skills docs](https://code.claude.com/docs/en/skills)). A skill is worth creating when a build/operate task is a repeatable multi-step procedure rather than a one-off. Not every entry below must become a formal SKILL.md on day one — this is the **exhaustive map** of distinct capabilities needed to build and run EZE, so we can decide which to formalize.

**Conventions used here**
- **Complexity:** Simple (single concern, well-trodden) · Moderate (several moving parts / external service) · Complex (async, money, security, or multi-system correctness).
- **Example invocation** shows either a `/slash` call or the natural-language trigger the skill's `description` should match.
- Skills reference the non-negotiables in CLAUDE.md §2 (licensed engine only, `generateSong()` abstraction, async fire-and-forget, org-scoped RLS, cost caps).

**Skill dependency backbone (build order):**
`scaffold-project` → `create-supabase-migration` + `add-rls-policies` → `setup-supabase-auth` + `enforce-org-multitenancy` → `create-api-route-handler` → external integrations (`elevenlabs`, `lyrics`, `stripe`, `moderation`, `storage`) → `async-job-orchestration` → frontend skills → testing → deploy.

---

## Category A — Project Setup & Scaffolding

### A1. `scaffold-project`
1. **Description:** Bootstrap the Next.js (App Router, TS) + Tailwind + shadcn/ui + Supabase client project with the agreed folder layout (`app/`, `components/`, `lib/`, `lib/engine/`, `supabase/migrations/`, `supabase/functions/`).
2. **Input:** Project name; tech-stack decisions (from `tech-stack.md`); target Node version.
3. **Output:** A running Next.js app skeleton, Tailwind/shadcn configured, Supabase client helpers (`lib/supabase/`), `.env.example` with all env var names, base ESLint/Prettier/tsconfig (strict).
4. **Dependencies:** libs: `next`, `react`, `typescript`, `tailwindcss`, `@supabase/supabase-js`, `@supabase/ssr`, `zod`; CLI: `create-next-app`, `supabase` CLI. APIs: none. Skills: none (root).
5. **Docs:** [Next.js](https://nextjs.org/docs) · [Tailwind](https://tailwindcss.com/docs) · [shadcn/ui](https://ui.shadcn.com/) · [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/nextjs)
6. **Complexity:** Moderate
7. **Invocation:** `/scaffold-project` or "set up the Next.js + Supabase project skeleton"

---

## Category B — Database Operations (CRUD, migrations, queries)

### B1. `create-supabase-migration`
1. **Description:** Author a versioned SQL migration for a schema change (new table, column, enum, constraint) matching the PRD §4 schema, with CHECK constraints and indexes.
2. **Input:** Table/field spec (from PRD §4); relationships; validation rules; index needs.
3. **Output:** Timestamped SQL file in `supabase/migrations/`; forward-only, reviewable.
4. **Dependencies:** CLI: `supabase migration new`, local Docker Postgres. Skills: `apply-migration-and-generate-types` (follow-up), `add-rls-policies` (paired).
5. **Docs:** [Supabase local dev/migrations](https://supabase.com/docs/guides/local-development) · [PostgreSQL DDL](https://www.postgresql.org/docs/current/ddl.html)
6. **Complexity:** Moderate
7. **Invocation:** `/create-supabase-migration add songs table` · "write a migration for the gift_links table"

### B2. `apply-migration-and-generate-types`
1. **Description:** Apply pending migrations (local/remote) and regenerate TypeScript types so schema and code can't drift. Leverages the Supabase MCP server when available.
2. **Input:** Migration files; target env (local/staging/prod).
3. **Output:** Applied schema + regenerated `lib/database.types.ts`.
4. **Dependencies:** CLI: `supabase db push`, `supabase gen types typescript`. MCP: Supabase MCP (`apply_migration`, `generate_typescript_types`). Skills: `create-supabase-migration`.
5. **Docs:** [Generating types](https://supabase.com/docs/guides/api/rest/generating-types) · [Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp)
6. **Complexity:** Simple
7. **Invocation:** `/apply-migration-and-generate-types`

### B3. `add-rls-policies`
1. **Description:** Write and test Row-Level Security policies for a table so rows are visible/editable only to members of the owning `org_id` (uses `is_org_member`/`has_org_role` helpers).
2. **Input:** Table name; access rules (owner/admin/member; public-read exceptions like gift links).
3. **Output:** RLS `ENABLE` + `CREATE POLICY` statements in a migration; a test proving cross-org isolation.
4. **Dependencies:** Skills: `enforce-org-multitenancy` (defines helpers), `test-rls-policies`. APIs: none.
5. **Docs:** [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
6. **Complexity:** Complex (security-critical; easy to get subtly wrong)
7. **Invocation:** `/add-rls-policies songs` · "add RLS so users only see their org's songs"

### B4. `write-data-access-layer`
1. **Description:** Create typed query/mutation helpers (CRUD) for an entity, wrapping the Supabase client with the generated types and consistent error handling.
2. **Input:** Entity name; required queries (from API spec §5); pagination needs.
3. **Output:** `lib/data/<entity>.ts` with typed functions + unit tests.
4. **Dependencies:** libs: `@supabase/supabase-js`, `zod`. Skills: `apply-migration-and-generate-types`, `error-handling-standard`.
5. **Docs:** [Supabase JS client](https://supabase.com/docs/reference/javascript) · [PostgREST queries](https://supabase.com/docs/guides/database/query-optimization)
6. **Complexity:** Simple
7. **Invocation:** `/write-data-access-layer songs`

### B5. `seed-test-data`
1. **Description:** Generate deterministic seed data (orgs, profiles, subjects, songs in each status) for local dev and E2E tests.
2. **Input:** Desired fixtures/personas; volume.
3. **Output:** `supabase/seed.sql` or a seed script.
4. **Dependencies:** CLI: `supabase db seed`. Skills: `create-supabase-migration`.
5. **Docs:** [Supabase seeding](https://supabase.com/docs/guides/local-development/seeding-your-database)
6. **Complexity:** Simple
7. **Invocation:** `/seed-test-data`

---

## Category C — Authentication & Authorization

### C1. `setup-supabase-auth`
1. **Description:** Configure Supabase Auth in Next.js: email magic link + Google/Apple OAuth + anonymous sign-in, with SSR session handling via `@supabase/ssr` (middleware + server/client helpers).
2. **Input:** Enabled providers; redirect URLs; session strategy.
3. **Output:** Working auth (sign-in/out, session in server components + route handlers), protected-route middleware.
4. **Dependencies:** libs: `@supabase/ssr`, `@supabase/supabase-js`. APIs: Google/Apple OAuth apps. Skills: `scaffold-project`, `manage-env-secrets`.
5. **Docs:** [Supabase Auth](https://supabase.com/docs/guides/auth) · [Next.js SSR auth](https://supabase.com/docs/guides/auth/server-side/nextjs) · [Anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous)
6. **Complexity:** Moderate
7. **Invocation:** `/setup-supabase-auth`

### C2. `enforce-org-multitenancy`
1. **Description:** Implement the org-based tenancy model: auto-create a personal `organization` + `owner` membership on signup (DB trigger/function), plus SQL helpers `is_org_member(org_id)` / `has_org_role(org_id, role)` used by all RLS.
2. **Input:** PRD §4.1 tenancy rules.
3. **Output:** Signup trigger, membership row creation, RLS helper functions; the invariant that every tenant row has a valid `org_id`.
4. **Dependencies:** Skills: `create-supabase-migration`, `add-rls-policies`, `setup-supabase-auth`. APIs: none.
5. **Docs:** [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) · [Postgres triggers](https://www.postgresql.org/docs/current/plpgsql-trigger.html) · [Multi-tenancy patterns](https://supabase.com/docs/guides/database/postgres/row-level-security#organization-based-access)
6. **Complexity:** Complex (foundational; every table depends on it)
7. **Invocation:** `/enforce-org-multitenancy`

### C3. `implement-anonymous-to-permanent-upgrade`
1. **Description:** Let an anonymous user who started the wizard (or a gift recipient) convert to a permanent account, migrating their draft brief/song ownership without data loss.
2. **Input:** Anonymous user id; target sign-up method.
3. **Output:** Upgrade flow that links `auth.users`, preserves `song_briefs`/`songs` ownership, and re-scopes to the new personal org.
4. **Dependencies:** Skills: `setup-supabase-auth`, `enforce-org-multitenancy`. libs: `@supabase/supabase-js`.
5. **Docs:** [Anonymous → permanent](https://supabase.com/docs/guides/auth/auth-anonymous#convert-an-anonymous-user-to-a-permanent-user)
6. **Complexity:** Moderate
7. **Invocation:** "implement anonymous account upgrade"

### C4. `implement-entitlements-check`
1. **Description:** Server-side guard that verifies an org has the required entitlement (song credit / HD download / regeneration) before a paid action, decrementing balance atomically.
2. **Input:** Org id; entitlement kind; action.
3. **Output:** Reusable `assertEntitlement()` helper; atomic balance decrement (row lock / RPC).
4. **Dependencies:** Skills: `handle-stripe-webhook` (grants entitlements), `write-data-access-layer`. libs: Supabase RPC/Postgres functions.
5. **Docs:** [Postgres functions/RPC](https://supabase.com/docs/guides/database/functions)
6. **Complexity:** Complex (money + concurrency; must be race-safe)
7. **Invocation:** "add entitlement check before generation"

---

## Category D — External API Integration

### D1. `integrate-elevenlabs-music` (the `generateSong()` wrapper)
1. **Description:** Implement the single `lib/engine/generateSong(brief)` module wrapping ElevenLabs Eleven Music — the ONLY place the music vendor is called (CLAUDE.md §2). Submits generation, handles the async job, normalizes output.
2. **Input:** A `song_brief` (name, occasion, vibe, lyrics); engine params.
3. **Output:** A provider job id + normalized result (audio bytes/URL, duration); engine-agnostic interface so a swap is one-file.
4. **Dependencies:** libs: ElevenLabs JS SDK. APIs: ElevenLabs Music API (`ELEVENLABS_API_KEY`). Skills: `integrate-lyrics-generation`, `setup-storage-signed-urls`, `async-job-orchestration`, `handle-elevenlabs-webhook`.
5. **Docs:** [Eleven Music API](https://elevenlabs.io/music-api) · [ElevenLabs API ref](https://elevenlabs.io/docs/api-reference/introduction)
6. **Complexity:** Complex (async + COGS + core value)
7. **Invocation:** `/integrate-elevenlabs-music` · "build the generateSong wrapper"

### D2. `integrate-lyrics-generation`
1. **Description:** Generate kid-safe, personalized lyrics from a brief via the Anthropic API with a locked system prompt, then pass to the music engine.
2. **Input:** Brief fields (child name, age, loves, occasion, vibe); safety prompt.
3. **Output:** Lyrics string (+ title), pre-screened for kid safety.
4. **Dependencies:** libs: `@anthropic-ai/sdk`. APIs: Anthropic (`ANTHROPIC_API_KEY`). Skills: `integrate-content-moderation` (post-check), `integrate-elevenlabs-music` (consumer).
5. **Docs:** [Anthropic API](https://docs.claude.com/en/api/overview) · [Anthropic SDK](https://docs.claude.com/en/api/client-sdks)
6. **Complexity:** Moderate
7. **Invocation:** "generate lyrics from the brief"

### D3. `integrate-stripe-checkout`
1. **Description:** Create Stripe Checkout sessions for single-song and credit-pack SKUs, server-side (never trust client amounts); return the hosted checkout URL.
2. **Input:** SKU/price id; buyer + org; optional `brief_id`.
3. **Output:** `checkout_url`; a `pending` `orders` row.
4. **Dependencies:** libs: `stripe`. APIs: Stripe (`STRIPE_SECRET_KEY`, publishable key). Skills: `handle-stripe-webhook`, `create-api-route-handler`.
5. **Docs:** [Stripe Checkout](https://docs.stripe.com/payments/checkout) · [Stripe Node SDK](https://docs.stripe.com/api?lang=node)
6. **Complexity:** Moderate
7. **Invocation:** `/integrate-stripe-checkout`

### D4. `handle-stripe-webhook`
1. **Description:** Signature-verified, idempotent Stripe webhook receiver that marks orders `paid`, grants entitlements, and (in pay-first mode) triggers generation.
2. **Input:** Stripe event; webhook secret.
3. **Output:** Order state transition + entitlement grant; dedup via `webhook_events`; `200`.
4. **Dependencies:** libs: `stripe`. Skills: `webhook-idempotency-and-verification`, `implement-entitlements-check`, `async-job-orchestration`.
5. **Docs:** [Stripe webhooks](https://docs.stripe.com/webhooks) · [Verify signatures](https://docs.stripe.com/webhooks/signature)
6. **Complexity:** Complex (money + idempotency)
7. **Invocation:** "build the Stripe webhook handler"

### D5. `handle-elevenlabs-webhook`
1. **Description:** Signature-verified, idempotent receiver for ElevenLabs generation-complete callbacks; stores audio in Storage, flips `songs.status` to `ready` (or `failed` → retry/refund).
2. **Input:** Provider event; webhook secret; `engine_job_id`.
3. **Output:** Stored audio/cover, `songs` row updated, Realtime notification; dedup via `webhook_events`.
4. **Dependencies:** APIs: ElevenLabs (`ELEVENLABS_WEBHOOK_SECRET`). Skills: `setup-storage-signed-urls`, `webhook-idempotency-and-verification`, `async-job-orchestration`.
5. **Docs:** [ElevenLabs API ref](https://elevenlabs.io/docs/api-reference/introduction) · [Netlify Functions](https://docs.netlify.com/build/functions/overview/)
6. **Complexity:** Complex
7. **Invocation:** "build the ElevenLabs webhook handler"

### D6. `integrate-content-moderation`
1. **Description:** Screen all user free-text (names, notes) and generated lyrics against a moderation policy before/after generation; block disallowed content with a friendly message; log to `moderation_events`.
2. **Input:** Text + context (`brief_text` | `lyrics`).
3. **Output:** `allow|block|flag` verdict + logged event; blocks halt generation.
4. **Dependencies:** APIs: a moderation endpoint (provider TBD). Skills: `integrate-lyrics-generation`, `create-api-route-handler`.
5. **Docs:** [OpenAI Moderation](https://platform.openai.com/docs/guides/moderation) (candidate) · [Anthropic safety](https://docs.claude.com/en/docs/about-claude/use-case-guides/content-moderation)
6. **Complexity:** Moderate (elevated importance — child audience)
7. **Invocation:** `/integrate-content-moderation`

### D7. `setup-storage-signed-urls`
1. **Description:** Configure private Supabase Storage buckets for audio/cover art and produce short-lived signed URLs for playback/download; never expose raw paths.
2. **Input:** Bucket names; object path; expiry.
3. **Output:** Upload helper + `getSignedUrl()`; entitlement-gated download.
4. **Dependencies:** libs: `@supabase/supabase-js`. Skills: `implement-entitlements-check` (download gate).
5. **Docs:** [Supabase Storage](https://supabase.com/docs/guides/storage) · [Signed URLs](https://supabase.com/docs/guides/storage/serving/downloads#signed-urls)
6. **Complexity:** Moderate
7. **Invocation:** "set up private audio storage with signed URLs"

---

## Category E — Backend / API Layer

### E1. `create-api-route-handler`
1. **Description:** Scaffold a typed REST Route Handler matching PRD §5: Zod-validated request/response, auth-level enforcement, consistent error shape, correct status codes.
2. **Input:** Endpoint spec (path, method, auth level, schema) from §5.
3. **Output:** `app/api/.../route.ts` with validation, auth guard, handler, tests.
4. **Dependencies:** libs: `zod`, `@supabase/ssr`. Skills: `write-zod-schemas`, `error-handling-standard`.
5. **Docs:** [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
6. **Complexity:** Simple–Moderate
7. **Invocation:** `/create-api-route-handler POST /api/songs`

### E2. `async-job-orchestration`
1. **Description:** Implement the fire-and-forget generation lifecycle: sync handler creates a `queued` song and returns `202`; a Netlify Background Function / Supabase Edge Function runs generation; webhook flips to `ready`; retries (≤2) then auto-refund on failure. Enforces the "never await a full song on a sync request" rule.
2. **Input:** Brief id; entitlement; status machine (`queued→generating→ready|failed`).
3. **Output:** Orchestrated pipeline + strict status transitions + retry/refund path.
4. **Dependencies:** Skills: `integrate-elevenlabs-music`, `handle-elevenlabs-webhook`, `implement-entitlements-check`. Infra: Netlify Background Functions / Supabase Edge Functions.
5. **Docs:** [Netlify Background Functions](https://docs.netlify.com/build/functions/background-functions/) · [Supabase Edge Functions](https://supabase.com/docs/guides/functions) · [Scheduled Functions](https://docs.netlify.com/build/functions/scheduled-functions/)
6. **Complexity:** Complex (the core reliability surface)
7. **Invocation:** `/async-job-orchestration`

### E3. `implement-rate-limiting`
1. **Description:** Add per-IP / per-user / global rate limits, especially on the free-preview and generation endpoints, with graceful degradation.
2. **Input:** Endpoint; limits (per hour/day); identity key.
3. **Output:** Reusable limiter middleware; 429 responses with retry hints.
4. **Dependencies:** libs: `@upstash/ratelimit` + Upstash Redis (adopt when traffic warrants; DB/in-memory acceptable at MVP). Skills: `create-api-route-handler`.
5. **Docs:** [Upstash Ratelimit](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview) · [Netlify edge middleware](https://docs.netlify.com/build/edge-functions/overview/)
6. **Complexity:** Moderate
7. **Invocation:** "add rate limiting to /api/previews"

### E4. `implement-cost-controls`
1. **Description:** Enforce per-user/day generation caps, a global daily preview budget, and a hard ElevenLabs spend cap with alerting; pause generation + alert ops if exceeded (CLAUDE.md "cost control is a feature").
2. **Input:** Cap thresholds; alert channel.
3. **Output:** Cap checks in the generation path; spend tracking; alerting hook.
4. **Dependencies:** Skills: `async-job-orchestration`, `implement-rate-limiting`, `structured-logging`. APIs: ElevenLabs usage.
5. **Docs:** [Supabase cost control](https://supabase.com/docs/guides/platform/cost-control) · [ElevenLabs pricing](https://elevenlabs.io/pricing/api)
6. **Complexity:** Complex
7. **Invocation:** "enforce generation caps and spend limits"

---

## Category F — Frontend Component Generation

### F1. `build-song-wizard`
1. **Description:** Build the ≤5-step guided creation wizard (PRD §3.1): preset vibe cards w/ audio samples, inline Zod validation, draft autosave, moderation pre-check, full a11y. NO open-ended "describe the music" field.
2. **Input:** Brief fields; vibe presets; validation schema.
3. **Output:** Wizard components + draft persistence + handoff to preview/checkout.
4. **Dependencies:** libs: React Hook Form, Zod, Zustand, shadcn/ui. Skills: `write-zod-schemas`, `setup-state-management`, `create-api-route-handler` (briefs).
5. **Docs:** [React Hook Form](https://react-hook-form.com/) · [Zod](https://zod.dev/) · [Zustand](https://zustand.docs.pmnd.rs/)
6. **Complexity:** Moderate
7. **Invocation:** `/build-song-wizard`

### F2. `build-reveal-player`
1. **Description:** Build the premium "reveal" experience (PRD §3.3): cover art, animated/synced lyrics, waveform player (play/scrub/download), tap-to-reveal affordance; mobile-first; `prefers-reduced-motion` aware.
2. **Input:** Song data (title, lyrics, signed stream URL, cover); entitlement.
3. **Output:** Reveal page + custom audio player component.
4. **Dependencies:** libs: `wavesurfer.js`, shadcn/ui, TanStack Query. Skills: `setup-storage-signed-urls`, `build-realtime-status`.
5. **Docs:** [wavesurfer.js](https://wavesurfer.xyz/) · [HTMLAudioElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement)
6. **Complexity:** Complex (the product's emotional core)
7. **Invocation:** `/build-reveal-player`

### F3. `build-realtime-status` ("creating your song…")
1. **Description:** Build the anticipation state (PRD §3.4) that auto-updates from `queued/generating` → `ready` via Supabase Realtime (polling fallback), with on-brand designed progress copy.
2. **Input:** Song id; status stream.
3. **Output:** Live-updating status component; no manual refresh needed.
4. **Dependencies:** libs: `@supabase/supabase-js` (Realtime), TanStack Query. Skills: `async-job-orchestration`.
5. **Docs:** [Supabase Realtime](https://supabase.com/docs/guides/realtime) · [TanStack Query](https://tanstack.com/query/latest)
6. **Complexity:** Moderate
7. **Invocation:** "build the creating-your-song live state"

### F4. `build-song-library`
1. **Description:** Authenticated list of the user's songs/orders with replay, re-download (entitlement-gated), and copy-share-link (PRD §3.7).
2. **Input:** Caller session; pagination.
3. **Output:** Library page + song cards.
4. **Dependencies:** Skills: `write-data-access-layer`, `create-api-route-handler` (GET /songs), `build-reveal-player`.
5. **Docs:** [Next.js data fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
6. **Complexity:** Simple
7. **Invocation:** `/build-song-library`

### F5. `build-share-page`
1. **Description:** Public, no-auth reveal page for a `gift_links` slug with rich OpenGraph tags for link unfurling, a signed stream, no owner PII, and a "make one too" CTA (PRD §3.8 — growth-critical).
2. **Input:** Public slug.
3. **Output:** SSR public route + OG meta + viral CTA; revoke support.
4. **Dependencies:** Skills: `setup-storage-signed-urls`, `create-api-route-handler` (public + gift-links). libs: Next.js metadata API.
5. **Docs:** [Next.js metadata / OG](https://nextjs.org/docs/app/building-your-application/optimizing/metadata) · [Open Graph](https://ogp.me/)
6. **Complexity:** Moderate
7. **Invocation:** `/build-share-page`

### F6. `build-checkout-ui`
1. **Description:** Purchase UI (single song + credit pack) that calls the checkout endpoint and redirects to Stripe Checkout; success/cancel handling.
2. **Input:** SKU/pricing; brief context.
3. **Output:** Checkout components + return-URL handling.
4. **Dependencies:** libs: `@stripe/stripe-js`. Skills: `integrate-stripe-checkout`.
5. **Docs:** [Stripe.js](https://docs.stripe.com/js) · [Checkout redirect](https://docs.stripe.com/payments/checkout/how-checkout-works)
6. **Complexity:** Simple
7. **Invocation:** `/build-checkout-ui`

### F7. `setup-state-management`
1. **Description:** Establish the state conventions: TanStack Query for server/async state (incl. job polling), Zustand for wizard/player UI state, Supabase session context for auth.
2. **Input:** App data-flow needs.
3. **Output:** Query client provider, store patterns, conventions doc.
4. **Dependencies:** libs: TanStack Query, Zustand. Skills: `scaffold-project`.
5. **Docs:** [TanStack Query](https://tanstack.com/query/latest) · [Zustand](https://zustand.docs.pmnd.rs/)
6. **Complexity:** Simple
7. **Invocation:** "set up the state management conventions"

---

## Category G — Testing & Validation

### G1. `write-zod-schemas`
1. **Description:** Author the shared Zod schemas (brief, subject, song, order, API payloads) used by BOTH client and server for a single source of validation truth.
2. **Input:** Field specs + validation rules (PRD §4.5).
3. **Output:** `lib/schemas/*.ts`, imported everywhere.
4. **Dependencies:** libs: `zod`. Skills: consumed by nearly all API/frontend skills.
5. **Docs:** [Zod](https://zod.dev/)
6. **Complexity:** Simple
7. **Invocation:** `/write-zod-schemas`

### G2. `write-unit-tests`
1. **Description:** Vitest unit tests for data-access helpers, entitlement logic, engine wrapper (mocked), and utilities.
2. **Input:** Target module; cases/edge cases.
3. **Output:** `*.test.ts` with meaningful coverage of logic branches.
4. **Dependencies:** libs: `vitest`, `@testing-library/react`. Skills: the module under test.
5. **Docs:** [Vitest](https://vitest.dev/) · [Testing Library](https://testing-library.com/docs/)
6. **Complexity:** Simple
7. **Invocation:** "write unit tests for the entitlements helper"

### G3. `write-e2e-tests`
1. **Description:** Playwright E2E for the critical **create → pay → reveal → share** flow, using Stripe test mode and mocked/stubbed generation.
2. **Input:** Flow steps; test fixtures/seed.
3. **Output:** `e2e/*.spec.ts` covering the money path + reveal.
4. **Dependencies:** libs: `@playwright/test`. APIs: Stripe test mode. Skills: `seed-test-data`, `build-checkout-ui`, `build-reveal-player`.
5. **Docs:** [Playwright](https://playwright.dev/docs/intro) · [Stripe testing](https://docs.stripe.com/testing)
6. **Complexity:** Complex
7. **Invocation:** `/write-e2e-tests`

### G4. `test-rls-policies`
1. **Description:** Automated tests that assert cross-org isolation — a user in org A can never read/write org B's rows — by running queries as different roles/JWTs.
2. **Input:** Tables + policies; two test orgs.
3. **Output:** Passing isolation tests; regression guard on RLS.
4. **Dependencies:** Skills: `add-rls-policies`, `enforce-org-multitenancy`, `seed-test-data`. MCP: Supabase MCP (`execute_sql` as roles).
5. **Docs:** [Testing RLS](https://supabase.com/docs/guides/database/postgres/row-level-security#testing-policies)
6. **Complexity:** Complex (security regression surface)
7. **Invocation:** `/test-rls-policies`

### G5. `test-webhook-idempotency`
1. **Description:** Verify Stripe/ElevenLabs webhook handlers are signature-verified and idempotent (replayed events cause no double-charge, double-grant, or duplicate song).
2. **Input:** Sample/replayed events; secrets.
3. **Output:** Tests asserting single-effect processing + rejection of bad signatures.
4. **Dependencies:** Skills: `handle-stripe-webhook`, `handle-elevenlabs-webhook`, `webhook-idempotency-and-verification`.
5. **Docs:** [Stripe test webhooks](https://docs.stripe.com/webhooks/test)
6. **Complexity:** Moderate
7. **Invocation:** "test webhook idempotency"

---

## Category H — Deployment & Infrastructure

### H1. `configure-netlify-deploy`
1. **Description:** Configure Netlify for the Next.js app: `netlify.toml`, Next runtime, Functions + Background Functions, env var wiring, Deploy Previews.
2. **Input:** Build command; function dirs; env var names.
3. **Output:** Deployable config; preview-per-PR; background-function routing.
4. **Dependencies:** CLI: `netlify`. MCP: Netlify MCP. Skills: `manage-env-secrets`.
5. **Docs:** [Netlify Next.js runtime](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/) · [Netlify MCP](https://docs.netlify.com/build/build-with-ai/netlify-mcp-server/)
6. **Complexity:** Moderate
7. **Invocation:** `/configure-netlify-deploy`

### H2. `setup-ci-pipeline`
1. **Description:** GitHub Actions pipeline: typecheck, lint, unit + E2E tests, and Supabase migration apply on deploy; block merge on failure.
2. **Input:** Test/lint commands; env/secrets; branch rules.
3. **Output:** `.github/workflows/*.yml`; required status checks.
4. **Dependencies:** APIs: GitHub Actions. Skills: `write-unit-tests`, `write-e2e-tests`, `apply-migration-and-generate-types`.
5. **Docs:** [GitHub Actions](https://docs.github.com/en/actions) · [Supabase CI](https://supabase.com/docs/guides/deployment/managing-environments)
6. **Complexity:** Moderate
7. **Invocation:** `/setup-ci-pipeline`

### H3. `manage-env-secrets`
1. **Description:** Standardize env var handling: maintain `.env.example` (names only), wire Netlify env + Supabase Vault, and assert no secret is client-exposed (only `NEXT_PUBLIC_*` reaches the browser).
2. **Input:** Required var names (CLAUDE.md §6).
3. **Output:** Documented env matrix + a lint/check that flags leaked secrets.
4. **Dependencies:** Skills: `scaffold-project`, `security-review`.
5. **Docs:** [Netlify env vars](https://docs.netlify.com/build/environment-variables/overview/) · [Supabase Vault](https://supabase.com/docs/guides/database/vault)
6. **Complexity:** Simple (but security-sensitive)
7. **Invocation:** "set up env var and secret management"

### H4. `setup-supabase-edge-function`
1. **Description:** Scaffold/deploy a Supabase Edge Function (Deno/TS) for webhook receivers or async work kept off the sync request path.
2. **Input:** Function name; trigger; secrets.
3. **Output:** `supabase/functions/<name>/` deployed.
4. **Dependencies:** CLI: `supabase functions`. MCP: Supabase MCP (`deploy_edge_function`).
5. **Docs:** [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
6. **Complexity:** Moderate
7. **Invocation:** `/setup-supabase-edge-function elevenlabs-webhook`

---

## Category I — Documentation Generation

### I1. `generate-api-docs`
1. **Description:** Produce/maintain API reference (OpenAPI or markdown) from the Route Handlers + Zod schemas so §5 stays in sync with code.
2. **Input:** Route handlers; shared schemas.
3. **Output:** `docs/api.md` or OpenAPI spec.
4. **Dependencies:** libs: `zod-to-openapi` (optional). Skills: `create-api-route-handler`, `write-zod-schemas`.
5. **Docs:** [OpenAPI](https://swagger.io/specification/) · [zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi)
6. **Complexity:** Simple
7. **Invocation:** `/generate-api-docs`

### I2. `update-project-memory`
1. **Description:** Keep `.claude/CLAUDE.md` §3 "Current State" accurate as work lands (done / in-progress / known issues), and prune stale entries.
2. **Input:** Recent changes/PRs; resolved open decisions.
3. **Output:** Updated CLAUDE.md Current State + File Structure Map.
4. **Dependencies:** Skills: none. Docs source: [`CLAUDE.md`](../.claude/CLAUDE.md).
5. **Docs:** [Claude Code memory](https://code.claude.com/docs/en/memory)
6. **Complexity:** Simple
7. **Invocation:** "update the project memory / current state"

---

## Category J — Error Handling, Logging & Observability

### J1. `error-handling-standard`
1. **Description:** Establish the consistent `{ error: { code, message } }` response shape, typed error classes, and safe client messaging (never leak internals); applied across all handlers.
2. **Input:** Error taxonomy; user-facing copy rules.
3. **Output:** Shared error utilities + handler wrapper.
4. **Dependencies:** Skills: `create-api-route-handler` (consumer).
5. **Docs:** [Next.js error handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
6. **Complexity:** Simple
7. **Invocation:** "set up the standard error-handling pattern"

### J2. `structured-logging`
1. **Description:** Structured logs + error tracking across route handlers, background functions, and webhooks (job ids, org id, redacted PII), wired to an error monitor.
2. **Input:** Log fields; redaction rules; sink.
3. **Output:** Logger util + integration; traceable generation lifecycle.
4. **Dependencies:** libs: `pino` (or similar), Sentry SDK (optional). Skills: `async-job-orchestration`.
5. **Docs:** [Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/) · [Netlify logs](https://docs.netlify.com/build/functions/logs/) · [Supabase logs](https://supabase.com/docs/guides/telemetry/logs)
6. **Complexity:** Moderate
7. **Invocation:** `/structured-logging`

### J3. `webhook-idempotency-and-verification`
1. **Description:** Reusable pattern for verifying provider signatures and deduping events via the `webhook_events` table — shared by all webhook handlers.
2. **Input:** Provider; secret; event id path.
3. **Output:** `verifyAndDedupe()` helper; guaranteed single-effect processing.
4. **Dependencies:** Skills: `handle-stripe-webhook`, `handle-elevenlabs-webhook`. libs: provider SDKs.
5. **Docs:** [Stripe signatures](https://docs.stripe.com/webhooks/signature)
6. **Complexity:** Complex (correctness-critical)
7. **Invocation:** "build the webhook verify+dedupe helper"

### J4. `build-admin-ops-dashboard`
1. **Description:** Internal view of jobs by status, failure rate, per-day generation counts, ElevenLabs spend estimate, and manual refund/credit tools (PRD §3.11). MVP can start as Supabase-MCP-driven SQL before a built UI.
2. **Input:** Ops queries; admin auth.
3. **Output:** Admin dashboard (or query pack) + refund actions.
4. **Dependencies:** Skills: `write-data-access-layer`, `implement-cost-controls`, `structured-logging`. MCP: Supabase MCP.
5. **Docs:** [Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp) · [Stripe refunds](https://docs.stripe.com/refunds)
6. **Complexity:** Moderate
7. **Invocation:** `/build-admin-ops-dashboard`

### J5. `security-review`
1. **Description:** Pre-launch checklist pass: RLS coverage on every table, no client-exposed secrets, signed-URL enforcement, webhook verification, rate/spend caps, moderation coverage, and adult-only/COPPA-awareness terms.
2. **Input:** Codebase + PRD §6.2.
3. **Output:** Findings list + fixes; go/no-go for launch.
4. **Dependencies:** Skills: `add-rls-policies`, `manage-env-secrets`, `implement-cost-controls`, `integrate-content-moderation`. Bundled: `/security-review`.
5. **Docs:** [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) · [Supabase security](https://supabase.com/docs/guides/database/secure-data)
6. **Complexity:** Complex
7. **Invocation:** `/security-review`

---

## Summary Table

| # | Skill | Category | Complexity |
|---|---|---|---|
| A1 | scaffold-project | Setup | Moderate |
| B1 | create-supabase-migration | Database | Moderate |
| B2 | apply-migration-and-generate-types | Database | Simple |
| B3 | add-rls-policies | Database | Complex |
| B4 | write-data-access-layer | Database | Simple |
| B5 | seed-test-data | Database | Simple |
| C1 | setup-supabase-auth | Auth | Moderate |
| C2 | enforce-org-multitenancy | Auth | Complex |
| C3 | implement-anonymous-to-permanent-upgrade | Auth | Moderate |
| C4 | implement-entitlements-check | Auth | Complex |
| D1 | integrate-elevenlabs-music | Integration | Complex |
| D2 | integrate-lyrics-generation | Integration | Moderate |
| D3 | integrate-stripe-checkout | Integration | Moderate |
| D4 | handle-stripe-webhook | Integration | Complex |
| D5 | handle-elevenlabs-webhook | Integration | Complex |
| D6 | integrate-content-moderation | Integration | Moderate |
| D7 | setup-storage-signed-urls | Integration | Moderate |
| E1 | create-api-route-handler | Backend | Simple–Moderate |
| E2 | async-job-orchestration | Backend | Complex |
| E3 | implement-rate-limiting | Backend | Moderate |
| E4 | implement-cost-controls | Backend | Complex |
| F1 | build-song-wizard | Frontend | Moderate |
| F2 | build-reveal-player | Frontend | Complex |
| F3 | build-realtime-status | Frontend | Moderate |
| F4 | build-song-library | Frontend | Simple |
| F5 | build-share-page | Frontend | Moderate |
| F6 | build-checkout-ui | Frontend | Simple |
| F7 | setup-state-management | Frontend | Simple |
| G1 | write-zod-schemas | Testing | Simple |
| G2 | write-unit-tests | Testing | Simple |
| G3 | write-e2e-tests | Testing | Complex |
| G4 | test-rls-policies | Testing | Complex |
| G5 | test-webhook-idempotency | Testing | Moderate |
| H1 | configure-netlify-deploy | Infra | Moderate |
| H2 | setup-ci-pipeline | Infra | Moderate |
| H3 | manage-env-secrets | Infra | Simple |
| H4 | setup-supabase-edge-function | Infra | Moderate |
| I1 | generate-api-docs | Docs | Simple |
| I2 | update-project-memory | Docs | Simple |
| J1 | error-handling-standard | Errors/Obs | Simple |
| J2 | structured-logging | Errors/Obs | Moderate |
| J3 | webhook-idempotency-and-verification | Errors/Obs | Complex |
| J4 | build-admin-ops-dashboard | Errors/Obs | Moderate |
| J5 | security-review | Errors/Obs | Complex |

**44 skills.** The **Complex** ones (RLS, org-multitenancy, entitlements, engine wrapper, both webhooks, async orchestration, cost controls, reveal player, E2E, RLS tests, webhook idempotency, security review) are where correctness/money/trust concentrate — staff and review these most carefully.

---

## Considered but NOT needed for MVP (deliberately excluded)

Per the brief ("better to identify skills we don't need than to miss skills we do"), these were evaluated and cut:

- **`setup-graphql-api`** — no GraphQL (shallow data graph; REST chosen). Skip.
- **`setup-search-infra` (Elasticsearch/Algolia)** — Postgres FTS suffices; no search need at MVP.
- **`setup-redis-cache`** — TanStack Query handles client cache; add Upstash only if metrics justify (folded into `implement-rate-limiting` if needed).
- **`build-native-mobile-app` (Expo/React Native)** — Phase 2; web-first for MVP.
- **`voice-cloning-integration`** — explicitly out of scope (consent/trust burden).
- **`video-generation`** — out of scope.
- **`in-app-audio-editing` / DAW / stem separation** — out of scope.
- **`org-management-ui`** (team invites/roles/B2B billing) — schema supports it, but no UI in MVP (P2).
- **`subscription-billing`** — MVP is pay-per-song + credit packs; subscriptions are a later pricing test.
- **`i18n-localization`** — English-only at MVP.
- **`integrate-suno-api`** — **PROHIBITED**, not merely out of scope. Unofficial/unlicensed engine; violates the core architectural constraint. Never build.
- **`physical-keepsake-fulfillment`** — v2 revenue idea (print/vinyl), not MVP.

---

## Notes on formalizing these as SKILL.md files

- Not all 44 need a `SKILL.md` immediately. **Formalize first** the repeatable, correctness-critical procedures where a written checklist prevents mistakes: `add-rls-policies`, `create-api-route-handler`, `webhook-idempotency-and-verification`, `async-job-orchestration`, `create-supabase-migration`, `security-review`. These benefit most from progressive-disclosure skill bodies.
- One-time setup skills (`scaffold-project`, `configure-netlify-deploy`) can stay as ad-hoc procedures or lightweight skills.
- Each `SKILL.md` needs a sharp **`description`** (what it does + when to use it) so Claude auto-triggers it correctly — that field is the single biggest driver of whether a skill fires at the right time.
- Consider a `plugin` bundling the EZE-specific skills so they travel with the repo (`.claude/skills/`).
