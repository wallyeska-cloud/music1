---
description: Establish the frontend state conventions — TanStack Query for server/async state (incl. job polling), Zustand for wizard/player UI, Supabase session context for auth. Use once to set patterns, or when state handling drifts.
---

# setup-state-management

**Purpose:** Keep client state consistent and simple across the app.

**Use when:** establishing or correcting state-management patterns.

## Inputs
- App data-flow needs.

## Procedure
1. Add a TanStack Query provider; use it for all server/async state (song status, library, orders).
2. Use Zustand stores for local UI state (wizard steps, audio player).
3. Provide Supabase session via context (from `@supabase/ssr`).
4. Document the conventions so agents follow them.

## Output
- Query client provider, store patterns, a short conventions note.

## Dependencies
- Libraries: TanStack Query, Zustand. Skills: `scaffold-project`.

## References
- [TanStack Query](https://tanstack.com/query/latest) · [Zustand](https://zustand.docs.pmnd.rs/)

## Guardrails
- No Redux. Don't duplicate server state into client stores — Query owns it.
