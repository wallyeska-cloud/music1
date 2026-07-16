<!--
Maintainer notes (stripped from Claude's context, so they cost no tokens):
- Keep this file focused and ideally under ~200 lines; long files reduce adherence.
- Do NOT paste code, dependency dumps, or full directory trees here once code exists —
  Claude can read those from the repo. Keep RATIONALE, CONVENTIONS, and PITFALLS.
- The PRD/tech-stack are LINKED, not @imported, on purpose: @import would load those
  large files into every session's context. Update "Current State" (§3) as work lands.
-->

# CLAUDE.md — EZE

## 1. Project Identity
- **Project:** EZE (working title) — an app that turns a parent's short description of their child into a **fully-produced, personalized "hero song"** (the kid, by name, as the star), delivered as a **shareable keepsake "reveal" page**, not a bare MP3.
- **Core mission:** Give a non-technical parent a "Disney moment" in under 5 minutes — compete on the *experience/ritual*, NOT on raw music generation.
- **Success criteria:** North-star = songs that are **played to completion AND shared**. Generation success >97%, p95 generation <3 min, positive gross margin per song vs. the ~$2 incumbent price floor.
- **Full context (READ THESE for anything non-trivial):**
  - PRD → `research/PRD.md` (features, DB schema, API spec, NFRs, metrics)
  - Tech stack + rationale → `research/tech-stack.md`
  - Viability / strategy / "why this wedge" → `research/viability-analysis.md`

## 2. Technical Context

### Stack (all TypeScript, one language end-to-end)
- **Frontend:** Next.js (React, App Router) + Tailwind + shadcn/ui. State: TanStack Query (async/server state) + Zustand (wizard/player UI) + React Hook Form + Zod. Audio: wavesurfer.js.
- **Backend:** Next.js Route Handlers (deploy as Netlify Functions) for sync work; **Netlify Background Functions** (15-min ceiling) and/or Supabase Edge Functions for async generation + webhooks.
- **Database/Auth/Storage:** Supabase (Postgres + Auth + Storage). RLS on every tenant table.
- **Music engine (COGS):** ElevenLabs "Eleven Music" (licensed) via a wrapper — see rule below. Lyrics: Anthropic API (Claude) with a kid-safe prompt.
- **Payments:** Stripe Checkout + webhooks.
- **Hosting:** Netlify (frontend + API) + Supabase. **CI/CD:** GitHub + Netlify Deploy Previews + GitHub Actions (typecheck, lint, tests, apply Supabase migrations).

### Key architectural decisions (the "why" — do not silently reverse these)
- **Licensed engine only.** NEVER build on unofficial/reverse-engineered Suno APIs. Suno has no official API, it's mid-litigation, and reselling rights we don't hold is a legal risk. This is non-negotiable (see viability §1/§3).
- **`generateSong(brief)` abstraction.** ALL generation goes through one internal module wrapping ElevenLabs. No feature calls the vendor SDK directly — so we can swap engines (e.g., Udio/UMG) in one file.
- **Async, fire-and-forget generation.** Never `await` a full song on a sync request thread (Netlify sync cap 10s Free / 26s Pro). Kick off → return `202` → finish via Background Function / webhook → UI flips via Supabase Realtime or polling.
- **Org-based multi-tenancy from day one.** Every user gets an auto-created *personal* org on signup; every tenant row carries `org_id`; RLS scopes by org membership. Consumer UI never mentions "organizations." This serves future B2B resellers with no schema change.
- **Cost control is a feature.** Per-user/day generation caps + a hard ElevenLabs spend cap + rate-limited free previews. A bug or abuser must not be able to run up the bill.
- **Web-first, not native.** Shareable links + SEO drive the growth loop; native app is a Phase-2 (Expo) decision.

### Coding standards / conventions
- **TypeScript strict**; no `any` without justification. Shared Zod schemas validate on client AND server.
- **REST** (typed Route Handlers); tRPC optional later; no GraphQL.
- Errors: consistent `{ error: { code, message } }` shape.
- Webhooks: **always** signature-verify + dedupe via the `webhook_events` table (idempotent).
- Media: private Storage buckets + signed, expiring URLs only. Never expose raw storage paths.
- Enforce enums/status machines via Postgres CHECK constraints, not just app code.

## 3. Current State  <!-- UPDATE THIS SECTION AS WORK PROGRESSES -->
- **Phase:** Pre-build / research complete. **No application code exists yet.** Not a git repo yet.
- **Done:** Viability analysis, tech-stack decision, full PRD (all in `research/`).
- **In progress:** Nothing coded. Next likely steps: scaffold Next.js + Supabase, define schema migration, build the `generateSong()` wrapper, or build a validation landing page first.
- **Known open decisions (lock before/at build — see PRD "Open Questions"):**
  1. Preview model: free low-fi preview vs. pay-first-with-guarantee (**recommended: free preview**).
  2. Pricing: single-song price + credit-pack sizing (validate against $2–$39 market).
  3. Confirm Claude for lyrics + the kid-safety prompt.
  4. Legal/ToS + COPPA-awareness review (hard dependency before public launch — child-themed product).
  5. Exact ElevenLabs Music params for a "kid hero anthem" (engine bake-off).
- **Known risk/debt to watch:** engine quality must be good enough to deliver the emotional "moment" on a *licensed* engine — this is the top product risk, validate early.

## 4. Agent Instructions
### How to approach this codebase
- Read `research/PRD.md` before implementing any feature; it has the user stories, acceptance criteria, DB schema, and API spec.
- Respect the priorities: build **P0** features first (wizard, generation+orchestration, reveal/player, "creating…" state, payments, library, shareable gift link, moderation).
- Prefer the managed-service path (Supabase/Netlify/Stripe) over hand-rolled infra. Use the available **MCP servers** (Supabase is connected in-session; also Netlify, Stripe, GitHub, ElevenLabs) for schema/migrations/deploys/payments.

### Ask before making changes when
- A change would reverse a "Key architectural decision" (§2) — especially the licensed-engine or the `generateSong()` abstraction rules.
- The preview model or pricing (open decisions) would be hard-coded — confirm which model first.
- A feature touches **children's data, moderation, or legal/ToS** — surface implications, don't just implement.
- Adding a new third-party dependency or service not already in the stack.

### Never do without explicit approval
- Never integrate an **unofficial/reverse-engineered Suno API** or any unlicensed music source.
- Never expose secrets client-side (Supabase service-role key, ElevenLabs/Stripe secret keys, Anthropic key) — server/edge only.
- Never generate paid songs before payment is confirmed, or bypass the spend/rate caps.
- Never ship a user-facing table without RLS.
- Never commit secrets or `.env` files; never push to `main` without CI passing.

## 5. File Structure Map  <!-- aspirational until code lands; update when scaffolded -->
- `research/` — strategy & specs: `viability-analysis.md`, `tech-stack.md`, `PRD.md`.
- `.claude/` — this file (project memory).
- **Planned once scaffolded (Next.js App Router):** `app/` (routes + Route Handlers under `app/api/`), `components/`, `lib/` (incl. `lib/engine/generateSong.ts` — the engine wrapper), `lib/supabase/`, `supabase/migrations/` (versioned SQL), `supabase/functions/` (edge functions).
- **Naming:** kebab-case files/dirs; PascalCase React components; Zod schemas colocated and shared client/server; DB tables/columns snake_case.

## 6. External Dependencies
| Service | Purpose | Docs |
|---|---|---|
| Supabase | Postgres DB, Auth, Storage, Edge Functions | https://supabase.com/docs |
| Netlify | Hosting, Functions, Background Functions, CI deploys | https://docs.netlify.com/ |
| ElevenLabs (Eleven Music) | Licensed music generation (COGS) | https://elevenlabs.io/music-api |
| Anthropic API (Claude) | Lyric generation (kid-safe prompt) | https://docs.claude.com/ |
| Stripe | Payments (Checkout + webhooks) | https://docs.stripe.com/ |
| GitHub | Source control + Actions CI | https://docs.github.com/en/actions |

**Env vars needed (names only — never commit values):**
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client-safe)
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `ELEVENLABS_API_KEY`, `ELEVENLABS_WEBHOOK_SECRET`
- `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## 7. User Avatar Reminder
- **Who:** "Maya, the Memory-Making Parent" (~34, non-musician, high phone fluency). The family memory-keeper making a keepsake for a specific child she loves, tied to an occasion.
- **Her driver:** the visceral "this is about MY baby" reaction — happy tears. That emotional spike *is* the product.
- **Her fears:** a cheesy/generic "AI-slop" result; that it's complicated; paying and getting something disappointing.
- **UX principles for her:**
  1. **Curate, don't configure** — guided wizard with preset vibes; NO open-ended "describe the music" field (that's Suno's job, and it scares her).
  2. **The reveal is the product** — design the first listen as a moment; mobile-first, premium, shareable.
  3. **Make the wait exciting**, not broken — the "creating your song…" state is a feature.
  4. **Disarm the fear** — free preview / try-before-buy; auto-refund on failure.
  5. **Zero-friction sharing** — a beautiful link that plays instantly for Grandma with no install/account.
