# Product Requirements Document — EZE (working title)

**"Make your child the hero of their own song."**

**Version:** 1.0 (MVP)
**Prepared:** 2026-07-15
**Owner:** wallyeska@msn.com
**Companion documents:** [`viability-analysis.md`](./viability-analysis.md) · [`tech-stack.md`](./tech-stack.md)

> **How to read this document.** A developer new to the project should be able to build the MVP from Sections 3–6 alone. Sections 1–2 explain *why* each feature exists; Sections 7–8 define the boundaries and the scoreboard. Every product decision here traces back to the two constraints established in the viability analysis: **(1)** we build on a *licensed, official* music engine (ElevenLabs Eleven Music), not an unofficial Suno wrapper; **(2)** we compete on the *experience/moment*, not on raw generation, by owning a narrow, high-emotion wedge the incumbents won't chase.

---

## 1. Executive Summary

### What we're building
EZE turns a parent's short description of their child into a **fully-produced, personalized "hero song"** — an original, sung, story-driven track that casts the child by name as the protagonist of their own adventure — delivered as a **shareable, keepsake "reveal" experience** (a beautiful web page with cover art, animated lyrics, and downloadable audio) rather than a bare MP3. The parent answers a short guided wizard (child's name, age, what they love, the occasion, a musical vibe), pays per song (or per small credit pack), and within minutes receives a link they can play at a birthday, bedtime, or holiday and share with family.

### Primary value proposition
**Suno gives you a tool; EZE gives you a moment.** For a non-technical parent, going from "I wish there were a song about my kid" to a finished, emotionally resonant keepsake takes under five minutes and zero creative skill — no prompt-craft, no DAW, no "which of these 12 takes is good." The magic is the *reveal and the ritual*, not the audio file. This is the defensible layer the viability analysis identified: the generation is a bought commodity; the experience wrapped around it is the product.

### Why this wedge (and not "make any song")
The viability analysis is explicit: the generic "describe music → get a song" concept **is Suno** and is a NO-GO. The survivable path is a **narrow, licensed, experience-first** product. Kids & family / the literal "Disney moment" is the most on-brand with the founder's stated vision *and* the least directly served by the incumbents (Suno is a horizontal creator tool; the gift-song startups mostly target adult occasions). EZE occupies that gap.

### Target user persona (psychographic, not just demographic)

**"Maya, the Memory-Making Parent"** — 34, mother of a 5-year-old, suburban US, household income $70–140k, high smartphone fluency but *not* a "creator." She is not a musician and never will be.

- **Core motivation:** She is the family's designated memory-keeper. She curates the photo albums, plans the themed birthday, and feels a quiet pressure to make childhood feel *magical* before it slips away. A personalized song is a memory artifact she couldn't make herself.
- **Deeper emotional driver:** A song about her child, *by name*, as the hero, produces a visceral "this is about MY baby" reaction. That emotional spike — often literal happy tears — is the product. It also signals love and effort to her child and to watching relatives.
- **Fears:** (1) That it'll come out generic, cheesy, or obviously "AI slop" and embarrass rather than move her. (2) That it's complicated or that she'll "do it wrong." (3) Paying and getting something disappointing with no recourse.
- **Goals:** A finished, genuinely lovely song she can play *at the moment* (the birthday, the bedtime, the holiday morning), share with grandparents, and keep forever.
- **What she is NOT:** She is not price-sensitive to the penny (this is a gift/keepsake, not a utility), but she *is* trust-sensitive. She'll pay $15–30 for something that makes her cry; she won't tolerate friction, confusion, or a bad first result.

---

## 2. User Avatar Deep Dive

### Who exactly is this for?
The MVP primary buyer is a **parent (or grandparent, aunt/uncle, godparent) creating a song for a specific child they love**, tied to an occasion (birthday, holiday, new sibling, first day of school, bedtime ritual, "just because"). Secondary/adjacent (design for, don't optimize for yet): the same buyer making a song for a partner or for themselves as a nostalgic novelty.

A deliberately-designed **B2B/tenant path** (see multi-tenancy, §4) anticipates resellers: a preschool making songs for its graduating class, a children's photographer offering a song add-on, a pediatric therapy practice, or a gifting brand. We architect for these organizations now but do **not** build org-specific features in the MVP.

### Their current painful workflow (the "before")
Today, a parent who wants this has three bad options:
1. **DIY on Suno/Udio.** Requires learning prompt-craft, understanding "styles," generating many takes, judging musical quality she has no vocabulary for, editing lyrics, and wrangling an export. High skill floor, high time cost, and the output is a raw file with no "moment." Most parents bounce.
2. **Commission a musician on Fiverr/Etsy.** $80–300+, days-to-weeks turnaround, back-and-forth revisions. High quality but slow, expensive, and effortful.
3. **Give up** and buy a generic gift.

The pain is a **skill + time + emotional-risk gap**: she has the desire and the money but neither the craft nor the patience, and she's afraid of a cringe result.

### What success looks like for them
- She finishes the wizard in **under 5 minutes** without confusion.
- The result makes her (or the child, or Grandma) **light up** — the emotional spike lands on the first listen.
- She can **play it at the moment** and **share a link** to family who can hear it instantly, no app install.
- She feels it was **worth the money** and that she "made something special," even though she has no musical skill.

### What would make her tell a colleague/friend about it?
The share is driven by the **reveal reaction**, not by a referral incentive. She tells other parents when: (a) the song genuinely moved her or her child (screenshottable, playable proof), (b) it was shockingly *easy* ("I just answered a few questions"), and (c) sharing it is frictionless (a link that looks beautiful and plays instantly for the recipient). **Word-of-mouth is the primary growth loop, so the shareable reveal page is a P0 growth feature, not a nicety.**

---

## 3. Feature Specification

Priorities: **P0** = MVP-critical (no launch without it) · **P1** = important (fast-follow, target within weeks of launch) · **P2** = nice-to-have (backlog).

> **Engine abstraction (applies to all generation features):** all music/lyric generation goes through a single internal interface `generateSong(brief)` that wraps ElevenLabs Eleven Music. No feature calls the vendor SDK directly. This makes swapping engines (e.g., to Udio/UMG licensed API) a one-module change, per the tech-stack decision.

### 3.1 Guided Song-Creation Wizard — **P0**
**User story:** *As a parent, I want to answer a few simple, friendly questions about my child so that I get a personalized song without needing any musical or technical skill.*

**Description:** A multi-step form (3–5 steps) capturing the **song brief**: child's first name (and optional nickname), age, 2–4 things they love (e.g., dinosaurs, soccer, the color purple), the occasion, an optional short "anything special?" free-text, and a **vibe/genre** picked from a small curated set of presets (e.g., "Adventure Anthem," "Gentle Lullaby," "Pop Superstar," "Silly Fun"). No open-ended "describe the music" field — curation is the point.

**Acceptance criteria:**
- Wizard has ≤5 steps; each step validates inline before "Next."
- All fields except name, occasion, and vibe are optional; name/occasion/vibe are required.
- Genre/vibe presets are selectable as cards with a short audio sample each.
- Progress is preserved if the user refreshes or signs in mid-wizard (draft persisted to `song_briefs`, keyed to session/anonymous user).
- Free-text fields enforce max length and pass content moderation (§3.9) before submission.
- Completing the wizard produces a persisted `song_briefs` row and advances to preview/checkout.
- Fully keyboard-navigable and screen-reader labeled (§6).

**Technical notes/deps:** React Hook Form + Zod (shared schema client/server). Draft autosave to Supabase (`song_briefs`, JSONB payload). Anonymous Supabase auth so a user can start before signing up.

---

### 3.2 Song Generation & Job Orchestration — **P0**
**User story:** *As a parent, I want my song to be created automatically after I submit my details so that I get a finished track without doing any work.*

**Acceptance criteria:**
- On paid submission, a `songs` row is created with status `queued`.
- Generation runs **asynchronously** (fire-and-forget): the sync request returns immediately; a Netlify Background Function / Supabase Edge Function performs generation and ElevenLabs webhook handling.
- Lyrics are generated (LLM) from the brief, then passed to Eleven Music; final audio + cover art stored in Supabase Storage.
- Status transitions are strictly: `queued → generating → ready` or `→ failed`. No other transitions allowed.
- On `failed`, the system auto-retries up to 2× before surfacing a user-facing failure with an automatic refund/credit-back.
- End-to-end p95 generation time target: **< 3 minutes** (see §6).
- All webhook handling is idempotent and signature-verified.

**Technical notes/deps:** `generateSong(brief)` wrapper. Lyrics via Claude (Anthropic API) with a kid-safe system prompt. Eleven Music API for audio. Idempotency via `webhook_events` table (dedupe on provider event ID). Per-user/day generation caps + spend cap to prevent cost blowout (viability §1 risk).

---

### 3.3 The "Reveal" Experience & Player — **P0**
**User story:** *As a parent, I want a beautiful moment when I first hear the song so that it feels like a special keepsake, not a file download.*

**Acceptance criteria:**
- A dedicated song page renders: cover art, the child's name as title, an **animated/synced lyric display**, a custom audio player (play/pause, scrub via waveform, download).
- First-play offers an optional "reveal" affordance (e.g., a tap-to-play curtain) designed for playing *to* the child/family.
- Page is responsive and looks premium on mobile (most reveals happen on a phone).
- Audio streams via signed URL from Supabase Storage/CDN; no raw storage URLs exposed.
- Download available only to entitled users (buyer/owner).

**Technical notes/deps:** wavesurfer.js for waveform/lyric sync; TanStack Query or Supabase Realtime to flip UI from "creating…" to "ready."

---

### 3.4 "Creating Your Song" Anticipation State — **P0**
**User story:** *As a parent, I want to see that my song is being made so that the wait feels exciting instead of broken.*

**Acceptance criteria:**
- While status is `queued`/`generating`, show a designed, on-brand progress experience (not a bare spinner) with playful copy and rough time expectation.
- UI updates to `ready` automatically without a manual refresh (Realtime or polling).
- If the user leaves, they receive an email/notification when the song is ready (P1 for email; in-app state is P0).

**Technical notes/deps:** Supabase Realtime subscription on the `songs` row, or TanStack Query polling fallback.

---

### 3.5 Payments & Entitlements — **P0**
**User story:** *As a parent, I want to pay for my song simply and trust I'll get what I paid for so that I feel safe buying.*

**Acceptance criteria:**
- Stripe Checkout supports (a) single-song purchase and (b) a small credit pack (e.g., 3 songs) — pricing configurable server-side.
- A song is only generated after payment confirmation (Stripe webhook), OR a **free low-fidelity preview** is generated pre-payment (see §3.6) and full song unlocks post-payment. *(Decision flag: pick one model at build time — see Open Questions.)*
- Entitlements recorded in `orders`/`entitlements`; download/HD gated on entitlement.
- Failed/abandoned payments never trigger paid generation.
- Automatic credit-back on generation failure.

**Technical notes/deps:** Stripe Checkout + webhooks (signature-verified, idempotent via `webhook_events`). Prices/products managed in Stripe; never trust client-sent amounts.

---

### 3.6 Free Preview (Try-Before-You-Buy) — **P1**
**User story:** *As a hesitant first-time buyer, I want to hear a short sample first so that I trust it's worth paying for.*

**Acceptance criteria:** A short (~30–60s) or watermarked/low-fidelity preview is generated free (rate-limited, abuse-capped), full HD unlocks on payment. This directly attacks the persona's #1 fear (a disappointing paid result) and mirrors proven competitor flows ("pay only when happy").

**Technical notes/deps:** Strict anonymous rate limits + moderation to control preview COGS. This is the biggest cost-control lever and conversion lever together — prioritize early.

---

### 3.7 Account, Song Library & Re-download — **P0**
**User story:** *As a parent, I want my songs saved to my account so that I can replay, re-download, and share them anytime.*

**Acceptance criteria:** Authenticated users see all their songs and orders; can replay, re-download (if entitled), and copy a share link. Anonymous creators can claim their song into a new account (anonymous→permanent upgrade).

**Technical notes/deps:** Supabase Auth (magic link + Google/Apple OAuth), RLS scoping every row to owner/org.

---

### 3.8 Shareable Gift Link — **P0 (growth-critical)**
**User story:** *As a proud parent, I want to send a beautiful link to family so that they can hear the song instantly without installing anything.*

**Acceptance criteria:** Each song can generate a public `gift_links` slug → a no-auth reveal page with rich OpenGraph preview (title/cover) for good link unfurling in texts/social. Owner can revoke a link. Public page never exposes owner PII or download rights.

**Technical notes/deps:** Server-rendered public route with OG tags; signed streaming URL; recipient may optionally "make one too" CTA (viral loop).

---

### 3.9 Content Safety & Moderation — **P0**
**User story:** *As the platform, I want to prevent unsafe or abusive content so that a kids' product stays trustworthy and lawful.*

**Acceptance criteria:** All user free-text (names, "special" notes) is moderated before generation; disallowed content (hate, sexual, real-person impersonation of non-owned individuals, etc.) is blocked with a friendly message. Generated lyrics pass a kid-safety filter. Moderation events are logged.

**Technical notes/deps:** Moderation API (e.g., provider moderation endpoint) pre- and post-generation. Especially important given the child audience.

---

### 3.10 Lyric Regeneration / Light Edit — **P1**
**User story:** *As a parent, I want to tweak the lyrics or try another take so that the song feels exactly right.*

**Acceptance criteria:** Owner can request one alternate take or edit specific lyric lines and regenerate (entitlement-limited: e.g., 1–2 free regenerations per purchase). Regenerations respect the same moderation + cost caps.

---

### 3.11 Admin / Ops Dashboard — **P1**
**User story:** *As an operator, I want to monitor generations, failures, spend, and refunds so that I can keep quality and costs under control.*

**Acceptance criteria:** Internal view of jobs by status, failure rates, per-day generation counts, ElevenLabs spend estimate, and manual refund/credit tools. (MVP can start as SQL/Supabase dashboard + the Supabase MCP workflow; a built UI is P1.)

---

### 3.12 Organization / Reseller Accounts — **P2 (architected now, built later)**
**User story:** *As a preschool or gifting brand, I want a team account so that multiple staff can create and manage songs under one organization.*

**Acceptance criteria (deferred):** Multiple users per org, roles, org-scoped libraries and billing. The **schema and RLS support this from day one** (§4); no org-management UI ships in MVP.

---

### Feature priority summary

| # | Feature | Priority |
|---|---|---|
| 3.1 | Guided Song-Creation Wizard | **P0** |
| 3.2 | Song Generation & Orchestration | **P0** |
| 3.3 | Reveal Experience & Player | **P0** |
| 3.4 | "Creating Your Song" state | **P0** |
| 3.5 | Payments & Entitlements | **P0** |
| 3.7 | Account & Song Library | **P0** |
| 3.8 | Shareable Gift Link | **P0** |
| 3.9 | Content Safety & Moderation | **P0** |
| 3.6 | Free Preview | **P1** |
| 3.4b | Email "song ready" notification | **P1** |
| 3.10 | Lyric Regeneration / Edit | **P1** |
| 3.11 | Admin / Ops Dashboard | **P1** |
| 3.12 | Organization / Reseller Accounts | **P2** |

---

## 4. Database Schema

**Engine:** PostgreSQL (Supabase). **Security model:** Row-Level Security (RLS) on every user-facing table. **Multi-tenancy:** organization-scoped — every tenant-owned row carries `org_id`; every consumer gets a personal org automatically on signup, so the same model serves both B2C and future B2B without a schema change.

### 4.1 Multi-tenancy architecture
- **Tenant root = `organizations`.** Every user belongs to ≥1 org via `memberships`.
- On signup, a **personal organization** is auto-created (`type = 'personal'`) and the user is added as `owner`. Consumer flows silently use this personal org; nothing in the consumer UI mentions "organizations."
- All tenant-owned tables (`song_briefs`, `songs`, `subjects`, `orders`, `entitlements`, `gift_links`) carry `org_id NOT NULL`.
- **RLS pattern:** a row is visible/editable only if the requesting `auth.uid()` has a membership in that row's `org_id`. A SQL helper `is_org_member(org_id)` / `has_org_role(org_id, role)` backs the policies.
- This satisfies the "multiple organizations" requirement while keeping the MVP consumer experience org-invisible.

### 4.2 Tables

**`organizations`** — tenant root
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | `gen_random_uuid()` |
| name | text NOT NULL | personal orgs default to user's name |
| type | text NOT NULL | enum: `personal` \| `business`; default `personal` |
| created_at | timestamptz NOT NULL | default `now()` |
| deleted_at | timestamptz NULL | soft delete |

**`profiles`** — 1:1 with `auth.users`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK / FK → auth.users.id | |
| display_name | text | |
| avatar_url | text | |
| default_org_id | uuid FK → organizations.id | the user's personal org |
| marketing_opt_in | boolean NOT NULL default false | |
| created_at | timestamptz NOT NULL default now() | |

**`memberships`** — user ↔ org (many-to-many, powers multi-tenancy + RLS)
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| org_id | uuid FK → organizations.id NOT NULL | |
| user_id | uuid FK → profiles.id NOT NULL | |
| role | text NOT NULL | enum: `owner` \| `admin` \| `member`; default `owner` |
| created_at | timestamptz NOT NULL default now() | |
| | | **UNIQUE(org_id, user_id)** |

**`subjects`** — the "hero" of a song (child); reusable across songs
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| org_id | uuid FK → organizations.id NOT NULL | |
| name | text NOT NULL | child's first name / nickname |
| age | int NULL | 0–18; CHECK range |
| loves | text[] NULL | interests |
| pronouns | text NULL | optional |
| created_at | timestamptz NOT NULL default now() | |

**`song_briefs`** — captured wizard input (draft-able before payment)
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| org_id | uuid FK → organizations.id NOT NULL | |
| created_by | uuid FK → profiles.id NULL | null while anonymous |
| subject_id | uuid FK → subjects.id NULL | |
| occasion | text NOT NULL | enum-ish: birthday, holiday, bedtime, new_sibling, etc. |
| vibe | text NOT NULL | preset genre id |
| details | jsonb NOT NULL default '{}' | flexible extra fields (free-text note, etc.) |
| status | text NOT NULL | enum: `draft` \| `submitted`; default `draft` |
| created_at | timestamptz NOT NULL default now() | |

**`songs`** — generation records (core entity)
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| org_id | uuid FK → organizations.id NOT NULL | |
| brief_id | uuid FK → song_briefs.id NOT NULL | |
| subject_id | uuid FK → subjects.id NULL | denormalized for query ease |
| status | text NOT NULL | enum: `queued` \| `generating` \| `ready` \| `failed`; default `queued` |
| title | text NULL | e.g., "Ava the Brave" |
| lyrics | text NULL | generated lyrics |
| audio_path | text NULL | Supabase Storage path (private) |
| cover_path | text NULL | Storage path |
| duration_s | int NULL | |
| engine | text NOT NULL default 'elevenlabs' | which provider produced it |
| engine_job_id | text NULL | provider-side job id |
| is_preview | boolean NOT NULL default false | free preview vs paid HD |
| error_reason | text NULL | populated on `failed` |
| retry_count | int NOT NULL default 0 | |
| created_at | timestamptz NOT NULL default now() | |
| ready_at | timestamptz NULL | |

**`orders`** — payments
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| org_id | uuid FK → organizations.id NOT NULL | |
| buyer_id | uuid FK → profiles.id NOT NULL | |
| song_id | uuid FK → songs.id NULL | null for credit-pack purchases |
| stripe_checkout_id | text NULL | |
| stripe_payment_intent | text NULL | |
| amount_cents | int NOT NULL | |
| currency | text NOT NULL default 'usd' | |
| status | text NOT NULL | enum: `pending` \| `paid` \| `refunded` \| `failed` |
| created_at | timestamptz NOT NULL default now() | |

**`entitlements`** — what an org is allowed to do (credits, downloads)
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| org_id | uuid FK → organizations.id NOT NULL | |
| kind | text NOT NULL | enum: `song_credit` \| `hd_download` \| `regeneration` |
| balance | int NOT NULL default 0 | remaining credits |
| source_order_id | uuid FK → orders.id NULL | |
| created_at | timestamptz NOT NULL default now() | |

**`gift_links`** — public shareable reveal pages
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| org_id | uuid FK → organizations.id NOT NULL | |
| song_id | uuid FK → songs.id NOT NULL | |
| public_slug | text NOT NULL UNIQUE | unguessable slug |
| revoked | boolean NOT NULL default false | |
| view_count | int NOT NULL default 0 | |
| created_at | timestamptz NOT NULL default now() | |

**`webhook_events`** — idempotency ledger (Stripe + ElevenLabs)
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| provider | text NOT NULL | `stripe` \| `elevenlabs` |
| provider_event_id | text NOT NULL | **UNIQUE(provider, provider_event_id)** |
| payload | jsonb NOT NULL | |
| processed_at | timestamptz NULL | |
| created_at | timestamptz NOT NULL default now() | |

**`moderation_events`** — audit of blocked/flagged content
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| org_id | uuid FK → organizations.id NULL | |
| context | text NOT NULL | `brief_text` \| `lyrics` |
| verdict | text NOT NULL | `allow` \| `block` \| `flag` |
| detail | jsonb | model scores, matched category |
| created_at | timestamptz NOT NULL default now() | |

**`analytics_events`** (optional, P1) — product funnel telemetry (wizard_started, song_ready, gift_link_opened, purchase). May be offloaded to a dedicated analytics tool instead.

### 4.3 Entity-relationship summary
```
auth.users 1───1 profiles
profiles   *───* organizations   (via memberships; role per edge)
organizations 1───* subjects
organizations 1───* song_briefs
song_briefs   1───* songs          (a brief can yield preview + HD + regens)
subjects      1───* songs
songs         1───* gift_links
organizations 1───* orders
orders        1───* entitlements
songs         1───0..* orders      (a paid song links to its order)
(provider webhooks) ──► webhook_events   (idempotency, no FK)
```

### 4.4 Indexing strategy (for common queries)
- `songs (org_id, status)` — library views and ops "jobs by status."
- `songs (status, created_at)` — worker/retry sweeps of stuck `queued`/`generating`.
- `songs (brief_id)` — fetch all takes for a brief.
- `memberships (user_id)` and `memberships (org_id)` — RLS membership checks (hot path; index both directions).
- `gift_links (public_slug)` — UNIQUE index; the public reveal lookup.
- `orders (org_id, status)` and `orders (stripe_payment_intent)` — reconciliation.
- `webhook_events (provider, provider_event_id)` — UNIQUE; idempotency guard.
- `subjects (org_id)` — subject reuse in wizard.
- GIN index on `song_briefs.details` and `subjects.loves` only if we query inside them.

### 4.5 Data validation rules
- **Enums enforced** via Postgres `CHECK` constraints or enum types for all `status`/`type`/`role`/`kind` fields (invalid transitions rejected at the DB).
- `subjects.age` CHECK between 0 and 18.
- `orders.amount_cents > 0`; currency ISO-4217.
- All required FKs `NOT NULL`; `ON DELETE` = soft-delete pattern (set `deleted_at`), never hard cascade user data.
- Free-text length caps at the app layer (Zod) **and** DB (`CHECK char_length(...)`): names ≤ 60, notes ≤ 500.
- `gift_links.public_slug` generated with ≥128 bits entropy (unguessable).
- **Status machine** for `songs` enforced in application logic *and* guarded by a trigger that rejects illegal transitions.
- **RLS is a validation rule too:** no row readable/writable outside the caller's org membership; service-role key used only in trusted server/edge functions, never client-side.

---

## 5. API Specification

**Style:** typed REST via Next.js Route Handlers (deployed as Netlify Functions). **Auth:** Supabase JWT (from `@supabase/ssr`) in `Authorization: Bearer` / cookie; RLS enforces org scoping server-side. **Formats:** JSON; all bodies validated with shared Zod schemas. **Errors:** consistent `{ error: { code, message } }` with appropriate HTTP status.

Auth levels: **Public** (no auth) · **User** (authenticated, incl. anonymous Supabase users) · **Owner** (must own/entitle the resource, via RLS) · **Service** (server-to-server / webhook, verified by signature, never called from browser).

### 5.1 Endpoints

| Method & Path | Auth | Purpose | Request (key fields) | Response |
|---|---|---|---|---|
| `POST /api/auth/anonymous` | Public | Start an anonymous session for pre-signup wizard | — | `{ session }` |
| `POST /api/briefs` | User | Create/save a song brief (draft) | `{ subject:{name,age,loves,pronouns}, occasion, vibe, details }` | `{ brief }` |
| `PATCH /api/briefs/:id` | Owner | Update a draft brief | partial brief | `{ brief }` |
| `POST /api/moderation/check` | User | Pre-validate free-text before submit | `{ context, text }` | `{ verdict }` |
| `POST /api/previews` | User (rate-limited) | Generate a free preview from a brief | `{ brief_id }` | `{ song:{id,status,is_preview:true} }` |
| `POST /api/checkout` | User | Create Stripe Checkout session (single song or credit pack) | `{ brief_id?, sku }` | `{ checkout_url }` |
| `POST /api/songs` | Owner (entitled) | Kick off a **paid** generation (fire-and-forget) | `{ brief_id }` | `202 { song:{id,status:'queued'} }` |
| `GET /api/songs/:id` | Owner | Poll song status/details | — | `{ song }` |
| `GET /api/songs` | User | List caller's songs (org-scoped) | query: pagination | `{ songs[] }` |
| `POST /api/songs/:id/regenerate` | Owner (entitled) | Alt take / lyric edit | `{ lyric_overrides? }` | `202 { song }` |
| `GET /api/songs/:id/download` | Owner (entitled) | Get signed HD audio URL | — | `{ url, expires_at }` |
| `POST /api/gift-links` | Owner | Create a shareable link | `{ song_id }` | `{ slug, url }` |
| `POST /api/gift-links/:id/revoke` | Owner | Revoke a link | — | `{ ok }` |
| `GET /api/public/songs/:slug` | Public | Reveal-page data for a gift link | — | `{ title, cover_url, lyrics, stream_url }` |
| `POST /api/webhooks/stripe` | Service (sig-verified) | Payment lifecycle | Stripe event | `200` |
| `POST /api/webhooks/elevenlabs` | Service (sig-verified) | Generation-complete callback | provider event | `200` |
| `GET /api/me` | User | Profile + entitlements + orgs | — | `{ profile, orgs, entitlements }` |
| `GET /api/admin/jobs` | Owner+admin (internal) | Ops: jobs/spend/failures | filters | `{ jobs[], stats }` |

### 5.2 Representative request/response

`POST /api/songs` → `202 Accepted`
```json
// request
{ "brief_id": "b3f1..." }
// response
{ "song": { "id": "9a2c...", "status": "queued", "is_preview": false } }
```
Client then subscribes (Realtime) or polls `GET /api/songs/:id` until `status: "ready"`, then loads the reveal page.

`GET /api/public/songs/:slug` → `200` (no PII)
```json
{ "title": "Ava the Brave", "cover_url": "https://cdn/.../signed",
  "lyrics": "…", "stream_url": "https://cdn/.../signed?exp=…" }
```

### 5.3 Authentication requirements (summary)
- **Never** expose the Supabase service-role key or ElevenLabs/Stripe secret keys to the browser. Generation, downloads, and webhook processing run server-side only.
- Webhooks (`/api/webhooks/*`) are **Service** auth: verify provider signature, reject unsigned, dedupe via `webhook_events`.
- All resource access is **RLS-enforced**; the API layer never trusts a client-supplied `org_id`.

### 5.4 Rate limiting & abuse controls
- **`POST /api/previews`** — the highest-cost anonymous path: strict per-IP and per-anonymous-user limits (e.g., N/hour, M/day), plus a global daily preview budget with graceful degradation. This is the primary COGS-control lever (viability §1).
- **`POST /api/songs` / `/regenerate`** — gated by entitlements (must have a paid credit); per-org daily generation cap as a backstop.
- **`POST /api/moderation/check`, `/api/briefs`** — modest per-user limits to prevent scraping/spam.
- **`GET /api/public/songs/:slug`** — cache-friendly, but rate-limit per IP to deter enumeration; slugs are high-entropy regardless.
- Enforcement: edge middleware + Upstash Redis counters (adopt when traffic warrants; simple in-memory/DB counters acceptable at MVP).
- A **hard platform spend cap** on ElevenLabs usage with alerting; generation pauses and alerts ops if exceeded.

---

## 6. Non-Functional Requirements

### 6.1 Performance
- **Song generation p95 < 3 minutes** end-to-end (brief submit → `ready`); p50 < 90s. If the engine is slower, the "creating…" experience must set expectations and email-on-ready (P1) is promoted.
- **Web vitals:** LCP < 2.5s on 4G mobile for the reveal and wizard pages; TTI < 3.5s.
- **API latency:** p95 < 500ms for all synchronous endpoints (generation is async and excluded).
- **Audio:** streaming starts < 1s from tap; served via CDN with cache headers.

### 6.2 Security
- RLS on all tenant tables; least-privilege keys; secrets only in server/edge env (Netlify env + Supabase Vault).
- All webhooks signature-verified + idempotent.
- HTTPS everywhere (enforced by Netlify); HSTS.
- Signed, expiring URLs for all private media; no public storage buckets for paid assets.
- PII minimization: we store a child's first name and interests — treat as sensitive; no unnecessary collection; clear deletion path (see privacy).
- **Children's data / COPPA-awareness:** the *buyer is an adult*; the product is *about* a child but not *used by* a child under 13 to create an account. Terms must state accounts are for adults 18+. Legal review required before launch (flagged in §7 dependencies).
- Input validation (Zod) on every endpoint; parameterized queries only.
- Content moderation on all user text and generated lyrics (§3.9).
- Rate limiting + spend caps as DoS/cost-abuse defense.

### 6.3 Accessibility
- Target **WCAG 2.1 AA**.
- Full keyboard navigation for the wizard, player, and checkout.
- Screen-reader labels on all inputs, buttons, and the audio player controls; lyric text available as real text (not image).
- Color contrast ≥ 4.5:1; visible focus states; respects `prefers-reduced-motion` for the reveal animation.
- Captions/transcript: lyrics serve as the transcript for the audio.

### 6.4 Mobile responsiveness
- **Mobile-first**; the reveal and wizard must be excellent on phones (majority of first plays and shares happen on mobile).
- Fluid layouts, touch targets ≥ 44px, no horizontal scroll, safe-area aware.
- Tested across iOS Safari and Android Chrome, small (≤375px) through desktop breakpoints.
- Audio autoplay handled per mobile browser policy (user-gesture-gated play, which fits the "tap to reveal" interaction anyway).

---

## 7. Out of Scope (MVP) & Future (v2)

### Explicitly NOT building in MVP
- **Native mobile apps** (iOS/Android). Web-first; Expo/React Native is a Phase-2 decision (tech-stack §1).
- **Organization/reseller management UI** — schema supports it (§4), but no team invites, org billing, or B2B dashboards in MVP.
- **Voice cloning / the child's or parent's actual voice** singing. High trust/consent/safety burden; deferred.
- **Open-ended "make any song"** creation, custom prompt fields, or general-purpose music tools — that's Suno's territory and explicitly rejected in the viability analysis.
- **Music video / animated video generation.**
- **In-app audio editing / DAW / stem separation.**
- **Physical keepsakes** (vinyl, printed storybooks, cards) — strong v2 revenue idea, not MVP.
- **Multi-language songs** beyond English.
- **Public discovery feed / social network / user profiles.**
- **Subscriptions** (MVP is pay-per-song + small credit packs; subscription modeling is a later pricing test).
- **Retroactive commercial-rights licensing** claims beyond what the ElevenLabs license grants; we surface exactly the rights the engine provides, nothing more.

### Future considerations (v2+)
- Physical keepsake products (printed lyric storybook + song = the "Disney moment" made tangible).
- Occasion-expanded templates (weddings, memorials, pets, anniversaries) — enter adjacent gift-song lanes deliberately once the core moment is proven.
- Native app with offline library and push "song ready" notifications.
- Reseller/white-label program using the existing multi-tenant schema (preschools, photographers, gift brands).
- Voice personalization with rigorous consent flows.
- Subscription tier for prolific gift-givers / family plans.
- Engine flexibility: route to whichever licensed provider (ElevenLabs / Udio-UMG) gives the best quality-per-dollar, via the `generateSong()` abstraction.

---

## 8. Success Metrics

**North-star metric:** **number of songs that reach a "delighted reveal"** — proxied by *songs marked `ready` that are then played to completion and shared* (a played + shared song ≈ the "Disney moment" landed). This ties the scoreboard to the actual defensible value (the moment), not vanity signups.

### Funnel / product-health KPIs
- **Wizard completion rate** (started → brief submitted).
- **Preview→purchase conversion** (P1 feature; the core monetization lever).
- **Generation success rate** (`ready` / total attempts) — target **> 97%**; failures auto-refund.
- **Generation p95 time** — target **< 3 min**.
- **Play-through rate** (song played to ≥90%).
- **Share rate** (songs with ≥1 gift link created) — the word-of-mouth engine.
- **Gift-link open rate & "make one too" click-through** — measures the viral loop.
- **Refund/complaint rate** — trust proxy; target **< 3%**.
- **Gross margin per song** (price − ElevenLabs COGS − Stripe fee) — must stay comfortably positive vs. the ~$2 incumbent price anchor (viability §4).

### Targets (directional; calibrate after real traffic)

| Metric | Launch **week 1** | **Month 1** | **Month 3** |
|---|---|---|---|
| Paid songs created | 25–50 | 300–600 | 1,500–3,000 |
| Wizard completion rate | ≥ 55% | ≥ 65% | ≥ 70% |
| Preview→purchase (once live) | — | ≥ 8% | ≥ 12% |
| Generation success rate | ≥ 95% | ≥ 97% | ≥ 98% |
| Generation p95 | ≤ 4 min | ≤ 3 min | ≤ 2.5 min |
| Share rate (≥1 gift link) | ≥ 30% | ≥ 40% | ≥ 50% |
| Refund/complaint rate | ≤ 6% | ≤ 4% | ≤ 3% |
| Positive gross margin/song | Yes | Yes | Yes |

**Kill/pivot signals (from the viability analysis):** if, after honest effort, wizard completion stays low, previews don't convert, or margins can't clear the incumbent price floor, that is the "do not scale" signal — revisit the wedge rather than pour spend into a leaky funnel.

---

## Open Questions / Decisions to Lock Before Build
1. **Preview model:** free low-fi preview pre-payment vs. pay-first with money-back guarantee? (Affects §3.5/§3.6 and COGS exposure.) *Recommendation: free preview — it directly disarms the persona's #1 fear.*
2. **Pricing:** single-song price point and credit-pack sizing (anchor: gift-song market $2–$39; keepsake positioning supports the higher end). Needs the validation test from viability §5.
3. **Lyrics engine:** confirm Claude (Anthropic API) for lyric generation with a kid-safe system prompt; define the safety prompt + post-gen moderation.
4. **Legal/ToS + COPPA-awareness review** of a child-themed product before public launch — a hard dependency, not a nicety.
5. **Exact ElevenLabs Music parameters** (length, style controls) that best produce a "kid hero anthem," to be nailed down in the engine bake-off (viability §5 validation step 2).
