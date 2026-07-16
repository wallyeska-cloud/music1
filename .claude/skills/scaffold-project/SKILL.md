---
description: Bootstrap the EZE Next.js + Supabase + Tailwind project skeleton with the agreed folder layout, strict TS config, and an .env.example. Use once at project start, or when setting up the base app structure.
---

# scaffold-project

**Purpose:** Stand up the initial Next.js (App Router, TypeScript) app with Tailwind, shadcn/ui, the Supabase client helpers, and the project's folder conventions.

**Use when:** starting the codebase, or re-establishing the base structure.

## Inputs
- Project name; Node version; tech-stack decisions (`research/tech-stack.md`).

## Procedure
1. `create-next-app` with TypeScript + App Router + Tailwind.
2. Add shadcn/ui; configure `tsconfig.json` to `strict: true`.
3. Create folders: `app/` (with `app/api/`), `components/`, `lib/`, `lib/engine/`, `lib/supabase/`, `lib/schemas/`, `supabase/migrations/`, `supabase/functions/`.
4. Add Supabase client/server helpers in `lib/supabase/` using `@supabase/ssr`.
5. Write `.env.example` with all env var NAMES from `.claude/CLAUDE.md` §6 (no values).
6. Configure ESLint + Prettier.

## Output
- A running app skeleton; `npm run dev` works; conventions in place.

## Dependencies
- Libraries: `next`, `react`, `typescript`, `tailwindcss`, `@supabase/supabase-js`, `@supabase/ssr`, `zod`.
- Skills: none (root of the build order).

## References
- [Next.js](https://nextjs.org/docs) · [Tailwind](https://tailwindcss.com/docs) · [shadcn/ui](https://ui.shadcn.com/) · [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/nextjs)

## Guardrails
- TypeScript strict from day one. Only `NEXT_PUBLIC_*` vars are client-exposed. Never commit real secrets.
