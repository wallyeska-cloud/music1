# Tech Stack Recommendation: "Disney Moment" AI Song App

**Prepared:** 2026-07-15
**Companion to:** [`viability-analysis.md`](./viability-analysis.md)

## Framing assumptions (carried from the viability analysis)

The stack below is optimized for the **conditional-GO** shape of this project, not the original concept:

1. **Engine = a licensed, official Music API (ElevenLabs Eleven Music v2), not an unofficial Suno wrapper.** This is a hard requirement from the viability analysis — it's the only choice that gives stable API contracts *and* legal footing.
2. **Web-first, mobile-ready.** The wedge (personalized "Disney moment" songs, likely gifted/shared) lives or dies on **shareable links and SEO discovery** — both of which favor a web app for the MVP. We pick a stack that lets us add native mobile later **without a rewrite**.
3. **The build is mostly product/experience, not infra.** So the guiding principle is *minimize backend surface area*: managed services, one language, serverless. Every hour spent on undifferentiated plumbing is an hour not spent on the moment that is the entire moat.

**Headline recommendation:** **Next.js (React) + Supabase + Netlify + ElevenLabs Music API + Stripe**, all in TypeScript. This hits every one of your constraints, keeps hosting **well under $50/mo through 10k users**, and has **first-party MCP servers for the three highest-touch components** (Supabase, Netlify, Stripe).

> **Hosting = Netlify (your call).** Netlify is a first-class Next.js host, has an official MCP server, and — usefully for this app — its **Background Functions run up to 15 minutes**, which is a *better* fit for async song generation than most serverless defaults. Notes on its function timeout model and credit-based pricing are called out in §4.

---

## 1. Frontend Recommendation

### Framework: **Next.js 15 (React) — web first; Expo (React Native) for the mobile app in Phase 2**

You said React or React Native for cross-platform. Here's the honest split: **you don't have a cross-platform need at MVP — you have a share/discovery need**, and that points to web. A gifted song is opened from a text message or email on whatever device the recipient has; that's a URL, not an app install.

- **Now (MVP):** [Next.js](https://nextjs.org/docs) (App Router). React on the web, with server-side rendering for the shareable "song reveal" pages — which matters for **link previews (OpenGraph) and SEO** on gift/occasion landing pages. One framework gives you the marketing site, the app, *and* your API routes.
- **Later (Phase 2, when retention justifies it):** [Expo](https://docs.expo.dev/) + [React Native](https://reactnative.dev/docs/getting-started). Because both are React, your components, types, validation schemas, and API client are largely reusable. You do **not** rewrite; you extract shared logic into a package.

> Why not React Native / Expo from day one? Native app-store friction (install, review cycles, IAP fees) is exactly the wrong tax on a product whose magic is "click a link, hear your song." Web removes that friction for the launch and the viral loop.

### Key libraries for our specific features

| Need | Library | Why |
|---|---|---|
| Data fetching / async server state | [TanStack Query](https://tanstack.com/query/latest) | Purpose-built for the **poll-until-song-ready** pattern; caching, retries, background refetch for free |
| Client state (wizard, player) | [Zustand](https://zustand.docs.pmnd.rs/) | Tiny, no boilerplate; perfect for the multi-step "describe your song" flow |
| Forms + validation | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | Zod schemas are **shared** with the backend for end-to-end type-safe validation |
| Audio playback | [Howler.js](https://howlerjs.com/) or native `<audio>` + [wavesurfer.js](https://wavesurfer.xyz/) | wavesurfer gives the waveform-scrub UI that makes the "reveal" feel premium |
| UI components / styling | [Tailwind CSS](https://tailwindcss.com/docs) + [shadcn/ui](https://ui.shadcn.com/) | Fast, ownable components; no runtime cost; easy to theme for the "Disney" warmth |
| Auth UI | [`@supabase/ssr`](https://supabase.com/docs/guides/auth/server-side/nextjs) | First-party Supabase auth helpers for Next.js |
| Payments UI | [Stripe React / Checkout](https://docs.stripe.com/payments/checkout) | Hosted checkout = minimal PCI surface |

### State management approach

Three tiers, deliberately kept simple:
1. **Server/async state → TanStack Query.** The song-generation job status, user's song library, order history. This is 80% of your "state."
2. **Client UI state → Zustand.** The song-creation wizard steps, the audio player, modals.
3. **Auth/session → Supabase client + React context.** Provided by `@supabase/ssr`.

Avoid Redux — it's overkill here and adds ceremony you'll regret in a small team.

---

## 2. Backend Recommendation

### Runtime & framework: **TypeScript everywhere — Next.js Route Handlers + Supabase Edge Functions**

Your Node-vs-Python question has a clear answer *for this project*: **Node/TypeScript**, because (a) ElevenLabs ships a first-class [JS/TS SDK](https://elevenlabs.io/docs/api-reference/introduction), (b) it lets you share Zod validation types across front and back, and (c) it keeps a solo/small team in **one language**. Python's library edge (numpy, audio DSP, ML) doesn't buy you anything when the heavy lifting is a hosted API call.

- **Synchronous request/response + orchestration:** [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers), which deploy to [Netlify Functions](https://docs.netlify.com/build/functions/overview/). Handles auth'd reads, creating a generation job, Stripe checkout session creation. (Netlify's sync function timeout is 10s on Free/Personal, raisable to 26s on Pro — plenty, because you never block on the actual song generation; see §6.)
- **Async / long-running / webhooks:** two good options, use whichever fits the step — [Netlify Background Functions](https://docs.netlify.com/build/functions/background-functions/) (up to **15 minutes**, ideal for kicking off and awaiting a generation) or [Supabase Edge Functions](https://supabase.com/docs/guides/functions) (Deno/TypeScript) for the ElevenLabs and Stripe webhook receivers — both keep long work off the sync request budget.
- **When to add Python:** only if you later do server-side audio post-processing (stitching narration + song, loudness normalization with `ffmpeg`, custom stem work). At that point add a **single containerized Python worker** ([FastAPI](https://fastapi.tiangolo.com/) on [Fly.io](https://fly.io/docs/) or [Railway](https://docs.railway.com/)) that pulls jobs off a queue. Don't build this until the product demands it.

### API architecture: **REST now, tRPC if you want it, GraphQL no**

- **Recommended: typed REST via Next.js Route Handlers**, with request/response types shared through Zod. Simple, cache-friendly, and every third party (Stripe, ElevenLabs) talks REST/webhooks anyway.
- **Optional upgrade: [tRPC](https://trpc.io/docs).** If your web and future Expo app live in one monorepo, tRPC gives end-to-end type safety with zero schema duplication. Great DX, but it's a convenience, not a necessity — adopt it only if you're comfortable with the pattern.
- **Skip GraphQL.** Your data graph is shallow (users, songs, orders). GraphQL's cost (schema, resolvers, caching complexity) buys nothing here. *(Note: Supabase can auto-expose [pg_graphql](https://supabase.com/docs/guides/graphql) if you ever want it — no need to run a server.)*

### Authentication strategy: **Supabase Auth**

[Supabase Auth](https://supabase.com/docs/guides/auth) covers everything the MVP needs and integrates natively with the database's row-level security:
- **Email magic links + Google/Apple OAuth** for low-friction signup (critical — every signup field costs you conversions on an emotional-purchase product).
- **Row-Level Security (RLS)** so a user can only read their own songs/orders — enforced at the database, not just the app layer. This is the single biggest security win of the Supabase model.
- **Anonymous → permanent user upgrade:** let a gift *recipient* play their song without an account, and let a creator start the wizard before signing up, then convert. Supabase supports [anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous) for exactly this.
- Session handling in Next.js via [`@supabase/ssr`](https://supabase.com/docs/guides/auth/server-side/nextjs).

---

## 3. Database Recommendation

### Primary: **Supabase (PostgreSQL)** — the strongest choice among your three options

You listed Supabase, Firebase, and MongoDB Atlas. For this app, **Supabase wins decisively**:
- **Relational is the right model.** Users → songs → orders → gift recipients is inherently relational with real foreign keys. Postgres fits; a document store (Firebase/Mongo) would fight you.
- **It bundles Auth + Storage + Edge Functions + Realtime** behind one project — fewer moving parts for a small team.
- **First-party MCP server** (see §5) — a major workflow advantage you specifically asked to prioritize.
- **No vendor lock-in on the data layer** — it's plain Postgres; you can `pg_dump` and leave. Firebase's proprietary model makes exit far harder.

Docs: [Supabase Database](https://supabase.com/docs/guides/database/overview) · [PostgreSQL](https://www.postgresql.org/docs/)

### Schema approach

- **SQL-first, migration-driven.** Define tables in versioned SQL migrations (see below), not by clicking in a dashboard.
- **RLS on every user-facing table** from day one — retrofitting security is painful.
- Sketch of core tables:
  - `profiles` (1:1 with `auth.users`)
  - `songs` (owner_id, prompt/brief JSONB, status enum: `queued|generating|ready|failed`, elevenlabs_job_id, audio_path, duration_s, created_at)
  - `orders` (buyer_id, song_id, stripe_payment_intent, amount, status)
  - `gift_links` (song_id, public_slug, recipient_email, revealed_at) — powers the shareable reveal page
- Use `JSONB` for the flexible "song brief" (occasion, names, tone, genre) so you can iterate on wizard fields without a migration every time.
- Consider [pgvector](https://supabase.com/docs/guides/database/extensions/pgvector) *later* if you add "songs like this" discovery — it's a Postgres extension, not a new database.

### Secondary data stores

Keep this list short on purpose:
- **File/audio storage → [Supabase Storage](https://supabase.com/docs/guides/storage)** (S3-compatible). Store generated audio here with signed URLs; **never** serve large audio from the database.
- **CDN for audio delivery → Supabase Storage's built-in CDN** (or front it with [Cloudflare](https://developers.cloudflare.com/) free tier). Matters because audio bandwidth is your main egress cost.
- **Cache → not needed at MVP.** TanStack Query handles client-side caching. If job-status polling or rate-limiting pressure grows, add [Upstash Redis](https://upstash.com/docs/redis) (serverless, free tier, per-request pricing) — *only when metrics justify it*.
- **Search → Postgres full-text search** ([built in](https://supabase.com/docs/guides/database/full-text-search)) is more than enough. Don't add Elasticsearch/Algolia.

### Backup & migration strategy

- **Migrations:** [Supabase CLI](https://supabase.com/docs/guides/local-development) — `supabase migration new`, run locally against a Docker Postgres, commit the SQL, apply to prod via CI. This gives you a reproducible, version-controlled schema. Pair with [`supabase db diff`](https://supabase.com/docs/reference/cli/supabase-db-diff).
- **Backups:** Free tier gives daily backups; **Pro adds Point-in-Time Recovery (PITR)** — turn it on before you take real money. Also schedule a periodic off-platform `pg_dump` to your own storage for defense-in-depth (don't trust a single provider with your only copy).
- **Type safety:** generate TypeScript types from the schema with [`supabase gen types`](https://supabase.com/docs/guides/api/rest/generating-types) so the DB schema and app code can't silently drift.

---

## 4. Infrastructure & Hosting

### Deployment platform: **Netlify (frontend + API) + Supabase (backend services)**

- **[Netlify](https://docs.netlify.com/)** for Next.js — first-class support via Netlify's [Next.js runtime](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/): [Deploy Previews](https://docs.netlify.com/deploy/deploy-previews/) per PR, global edge CDN, zero-config. Free tier is generous for an MVP.
- **Supabase** hosts DB, Auth, Storage, Edge Functions.
- **Async generation flow:** for "submit brief → generate → notify," start with the simplest thing that works: write a `songs` row with status `queued`, then run the generation in a **[Netlify Background Function](https://docs.netlify.com/build/functions/background-functions/)** (15-min ceiling — comfortably covers a slow generation) and/or let ElevenLabs' webhook flip the row to `ready`. Netlify also has [Scheduled Functions](https://docs.netlify.com/build/functions/scheduled-functions/) for retry sweeps. If you later need real retries/fan-out/observability, add **[Inngest](https://www.inngest.com/docs)** or **[Trigger.dev](https://trigger.dev/docs)** — both have free tiers and native Next.js/TypeScript support. Avoid standing up your own queue infra at MVP.
- **Payments:** [Stripe](https://docs.stripe.com/) (Checkout + webhooks). No monthly fee; per-transaction only.
- **Domain:** ~$12/year from [Cloudflare Registrar](https://developers.cloudflare.com/registrar/) (at cost).

### CI/CD approach

- **[GitHub](https://docs.github.com/en/actions) + [Netlify Git integration](https://docs.netlify.com/deploy/deploy-overview/):** every push → Deploy Preview; merge to `main` → production. This is automatic and free.
- **[GitHub Actions](https://docs.github.com/en/actions)** for: typecheck (`tsc`), lint ([ESLint](https://eslint.org/docs/latest/)), tests ([Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/docs/intro) for the critical create→pay→reveal flow), and **applying Supabase migrations** on deploy.
- **Env/secrets:** [Netlify environment variables](https://docs.netlify.com/build/environment-variables/overview/) + Supabase Vault for service keys. Never ship the Supabase service-role key to the client.

### Estimated monthly cost (hosting only — engine COGS called out separately)

| Stage | Netlify | Supabase | Queue/Other | **Hosting total** |
|---|---|---|---|---|
| **MVP / pre-revenue** | $0 (Free)† | $0 (Free)* | $0 (free tiers) | **~$0/mo** |
| **~1k users** | $9–20 (Personal/Pro)† | $25 (Pro, for PITR + no auto-pause) | $0 (still free tiers) | **~$25–45/mo** |
| **~10k users** | $20 (Pro, flat, unlimited seats) | $25 + modest storage/egress overage | $0–20 (Inngest/Upstash if adopted) | **~$45–65/mo** |

† **Netlify's model (2026):** credit-based. Free = 300 credits/mo (~15 GB bandwidth, **10s** function timeout, **no Background Functions**). Personal = $9 (1,000 credits). **Pro = flat $20/org/mo, unlimited seats, 3,000 credits (~150 GB), 26s sync timeout, and 15-min Background Functions.** ([Netlify pricing](https://www.netlify.com/pricing/)) → **Practical note:** because the Free tier lacks Background Functions, run the MVP's async generation via the **ElevenLabs-webhook + Supabase Edge Function** path (which is free), and adopt Netlify Background Functions once you're on a paid plan. Either path keeps you under budget.

\* **Supabase free-tier caveat:** Supabase pauses a project after 7 days of inactivity — fine for MVP/dev, **but move to Pro ($25) the moment you have paying users or a public launch**, both for uptime and PITR backups. ([Supabase pricing](https://supabase.com/pricing))

**You stay under your $50/mo hosting cap comfortably through ~10k users.** The one line item that scales with usage is *not hosting* — it's the **music engine (COGS)**:

> **ElevenLabs Music ≈ $0.15 per minute of audio.** A 2-minute song ≈ **$0.30 of raw cost.** ([ElevenLabs API pricing](https://elevenlabs.io/pricing/api)) This is a **cost of goods**, not hosting overhead — you price the product above it (the gift-song market sits at $2–$39/song, so the margin is there). Build **hard per-user generation caps and a spend cap** from day one so a free-tier abuser or a bug can't run up the bill. Set Supabase's [spend cap](https://supabase.com/docs/guides/platform/cost-control) on and monitor ElevenLabs usage.

---

## 5. MCP Server Availability

You asked to prioritize services with MCP servers for Claude Code. This stack is deliberately chosen so the **three highest-friction components each have a first-party MCP server** — and one of them (Supabase) is **already connected in this environment**.

| Component | MCP server | What it enables in the dev workflow |
|---|---|---|
| **Supabase** | [Official Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp) — *already available in this session* | Claude can **inspect tables, run SQL, apply migrations, generate TS types, read logs, and check security advisors** directly. Massively speeds up schema iteration and debugging. |
| **Netlify** | [Netlify MCP server](https://docs.netlify.com/build/build-with-ai/netlify-mcp-server/) | Create/manage sites, trigger and inspect deploys, read build/function logs, manage env vars, and diagnose failed deploys from inside the assistant. |
| **Stripe** | [Stripe MCP / Agent Toolkit](https://docs.stripe.com/mcp) | Create test products/prices, inspect payments, test webhook events without leaving the workflow. |
| **GitHub** | [GitHub MCP](https://github.com/github/github-mcp-server) | PRs, issues, Actions status, code search. |
| **ElevenLabs** | [ElevenLabs MCP](https://github.com/elevenlabs/elevenlabs-mcp) | Trigger/inspect generations and voices for rapid prototyping of the song flow. |

**What this enables concretely:** the entire backend spine (Postgres schema, migrations, payments, deploys) is manipulable and debuggable through Claude Code. In practice that means Claude can propose a migration, apply it, regenerate types, and check advisors in one loop — the kind of task that otherwise means context-switching across four dashboards. This is a real, compounding DX advantage, and it's the strongest technical reason to pick **Supabase over Firebase/Mongo** for *this* team.

---

## 6. Integration Map

### How the pieces connect

```
                        ┌─────────────────────────────┐
                        │  Next.js (React) on Netlify  │
   Browser / (later)    │  - marketing + SEO pages     │
   Expo app  ─────────► │  - song-creation wizard      │
                        │  - shareable "reveal" page   │
                        │  - Route Handlers (API)      │
                        └───────┬─────────────┬────────┘
                                │             │
                 auth / RLS     │             │  create job / read library
                 (@supabase/ssr)│             ▼
                                │      ┌──────────────────────────┐
                                └────► │        Supabase          │
                                       │  Postgres (RLS)          │
                                       │  Auth · Storage(audio)   │
                                       │  Edge Functions          │
                                       └───┬───────────┬──────────┘
                                           │           │
              generation request          │           │  webhook: song ready
                                           ▼           ▲
                                   ┌───────────────────────────┐
                                   │  ElevenLabs Music API      │
                                   │  ($0.15/min, licensed)     │
                                   └───────────────────────────┘
                                           │
             payment (Checkout) ───────────┼──────────► ┌─────────────┐
             webhook: paid ◄───────────────┘            │   Stripe    │
                                                        └─────────────┘
```

**Happy path:** user completes wizard → Route Handler writes a `songs` row (`queued`) + calls ElevenLabs → (optionally gated behind Stripe Checkout) → ElevenLabs webhook hits a Supabase Edge Function → function stores audio in Supabase Storage, flips status to `ready` → frontend (TanStack Query poll or Supabase Realtime) shows the reveal → shareable `gift_links` slug lets the recipient play it with no account.

### Potential integration pain points (and mitigations)

1. **Async generation UX.** Songs take seconds-to-minutes; nothing should block on it. → Job row + status enum, webhook to update, and **Supabase [Realtime](https://supabase.com/docs/guides/realtime)** or TanStack Query polling to update the UI. Design the "your song is being created…" state as a *feature* (build anticipation), not a spinner.
2. **Webhook reliability & idempotency.** Both Stripe and ElevenLabs webhooks can retry/duplicate. → **Verify signatures**, make handlers **idempotent** (dedupe on event ID / job ID), and never trust client-reported success.
3. **Serverless timeouts.** Netlify's sync functions cap at 10s (Free) / 26s (Pro); a long generation call can exceed them. → **Fire-and-forget**: kick off generation from a sync handler, return immediately, and finish the work in a **Netlify Background Function (15 min)** or via the ElevenLabs webhook. Don't `await` the full song on the sync request thread.
4. **Cost blowout from abuse.** The engine is metered per minute. → Per-user/day generation caps, auth-gated generation (limited anonymous previews), Supabase spend cap, and alerting on ElevenLabs usage. Treat generation as a paid action early.
5. **Audio storage egress.** Large files served repeatedly = your biggest scaling cost. → Serve via CDN + signed URLs, set cache headers, and consider transcoding to efficient formats (AAC/Opus).
6. **RLS mistakes.** A missing policy can leak users' songs. → Write RLS policies in migrations, and **test them** (Supabase MCP can run the queries as different roles to verify).
7. **Vendor concentration.** Supabase hosts a lot of your surface. → It's plain Postgres + S3-compatible storage, so exit is feasible; keep independent `pg_dump` backups so you're never hostage to one provider.
8. **Engine swap-ability.** The viability analysis warns the AI-music landscape is shifting (licensing deals, new providers). → **Wrap the music engine behind a single internal interface** (`generateSong(brief)`), so swapping ElevenLabs for Udio/UMG's licensed API later is a one-file change, not a refactor.

---

## Summary Recommendation

| Layer | Choice | One-line justification |
|---|---|---|
| **Frontend** | Next.js (React), Tailwind + shadcn/ui; Expo later | Web-first for shareability/SEO; React path to native with no rewrite |
| **State** | TanStack Query + Zustand + Zod | Right tools for async job state + a multi-step wizard |
| **Backend** | TypeScript — Next Route Handlers + Supabase Edge Functions | One language, minimal surface, share types front-to-back |
| **API** | Typed REST (tRPC optional) | Shallow data graph; GraphQL unjustified |
| **Auth** | Supabase Auth + RLS | DB-enforced security, anonymous→permanent for gift flow |
| **Database** | Supabase Postgres | Relational fit, bundled services, first-party MCP, no lock-in |
| **Storage** | Supabase Storage + CDN | S3-compatible audio hosting with signed URLs |
| **Engine (COGS)** | ElevenLabs Music v2 API | Licensed + official + stable contract (per viability analysis) |
| **Payments** | Stripe Checkout | Minimal PCI surface, no monthly fee |
| **Hosting** | Netlify + Supabase | ~$0 MVP, ~$45–65/mo at 10k users — under your cap |
| **CI/CD** | GitHub + Netlify + Actions | Deploy Previews, automated migrations & tests |
| **MCP** | Supabase (live now), Netlify, Stripe, GitHub, ElevenLabs | Backend spine is inspectable/debuggable from Claude Code |

**The stack costs you almost nothing until you have users, keeps hosting under $50/mo through 10k users, uses one language end-to-end, and puts an MCP server on every high-friction component.** The only usage-scaling cost is the music engine itself — which is a cost of goods you price above, not hosting overhead.

---

### Documentation Links (every major technology)

**Frontend:** [Next.js](https://nextjs.org/docs) · [React](https://react.dev/) · [Expo](https://docs.expo.dev/) · [React Native](https://reactnative.dev/docs/getting-started) · [TanStack Query](https://tanstack.com/query/latest) · [Zustand](https://zustand.docs.pmnd.rs/) · [React Hook Form](https://react-hook-form.com/) · [Zod](https://zod.dev/) · [Tailwind CSS](https://tailwindcss.com/docs) · [shadcn/ui](https://ui.shadcn.com/) · [wavesurfer.js](https://wavesurfer.xyz/) · [Howler.js](https://howlerjs.com/)

**Backend / API:** [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) · [Supabase Edge Functions](https://supabase.com/docs/guides/functions) · [tRPC](https://trpc.io/docs) · [FastAPI](https://fastapi.tiangolo.com/) (if/when Python worker)

**Auth & Database:** [Supabase](https://supabase.com/docs) · [Supabase Auth](https://supabase.com/docs/guides/auth) · [`@supabase/ssr`](https://supabase.com/docs/guides/auth/server-side/nextjs) · [Supabase Database](https://supabase.com/docs/guides/database/overview) · [PostgreSQL](https://www.postgresql.org/docs/) · [Supabase Storage](https://supabase.com/docs/guides/storage) · [pgvector](https://supabase.com/docs/guides/database/extensions/pgvector) · [Supabase CLI / migrations](https://supabase.com/docs/guides/local-development)

**Engine & Payments:** [ElevenLabs Music API](https://elevenlabs.io/music-api) · [ElevenLabs API docs](https://elevenlabs.io/docs/api-reference/introduction) · [ElevenLabs pricing](https://elevenlabs.io/pricing/api) · [Stripe](https://docs.stripe.com/) · [Stripe Checkout](https://docs.stripe.com/payments/checkout)

**Infra / CI/CD / Queue:** [Netlify](https://docs.netlify.com/) · [Netlify Next.js runtime](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/) · [Netlify Background Functions](https://docs.netlify.com/build/functions/background-functions/) · [Netlify pricing](https://www.netlify.com/pricing/) · [Supabase pricing](https://supabase.com/pricing) · [GitHub Actions](https://docs.github.com/en/actions) · [Inngest](https://www.inngest.com/docs) · [Trigger.dev](https://trigger.dev/docs) · [Upstash Redis](https://upstash.com/docs/redis) · [Vitest](https://vitest.dev/) · [Playwright](https://playwright.dev/docs/intro) · [Cloudflare](https://developers.cloudflare.com/)

**MCP servers:** [Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp) · [Netlify MCP](https://docs.netlify.com/build/build-with-ai/netlify-mcp-server/) · [Stripe MCP](https://docs.stripe.com/mcp) · [GitHub MCP](https://github.com/github/github-mcp-server) · [ElevenLabs MCP](https://github.com/elevenlabs/elevenlabs-mcp)
